"use server";

import { randomBytes } from "node:crypto";

import { Prisma } from "@/src/generated/prisma/client";
import { InvoiceStatus, JobStatus, PaymentStatus } from "@/src/generated/prisma/enums";
import { revalidatePath } from "next/cache";

import { calculateInvoiceTotals, formatInvoiceNumber, getPaymentSummary } from "@/src/lib/billing/calculations";
import { createInvoiceSchema, recordPaymentsSchema } from "@/src/lib/billing/schema";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export type BillingActionState = { error?: string; success?: string; invoiceId?: string };
export const initialBillingActionState: BillingActionState = {};

const allowedRoles = ["DATA_ENTRY", "DISPATCHER"] as const;
const invoiceInclude = {
  payments: { select: { amount: true } },
  job: { select: { id: true } },
} as const;

function parseInvoiceFormData(formData: FormData) {
  const items = JSON.parse(String(formData.get("items") ?? "[]"));
  return createInvoiceSchema.safeParse({
    jobId: formData.get("jobId"),
    discount: formData.get("discount") || 0,
    tax: formData.get("tax") || 0,
    dueAt: formData.get("dueAt"),
    items,
  });
}

function getInvoiceStatus(total: number, payments: { amount: Prisma.Decimal }[]) {
  const summary = getPaymentSummary(total, payments.map((payment) => ({ amount: Number(payment.amount) })));
  if (summary.isPaid) return InvoiceStatus.PAID;
  if (summary.isPartial) return InvoiceStatus.PARTIALLY_PAID;
  return InvoiceStatus.ISSUED;
}

export async function createInvoice(
  _previousState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  await requireRole(allowedRoles);

  let parsed: ReturnType<typeof parseInvoiceFormData>;
  try {
    parsed = parseInvoiceFormData(formData);
  } catch {
    return { error: "Invoice items could not be read. Please add them again." };
  }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the invoice details." };

  const data = parsed.data;
  const job = await db.job.findUnique({ where: { id: data.jobId }, select: { id: true, status: true, customerId: true } });
  if (!job) return { error: "This job no longer exists." };
  if (job.status !== JobStatus.COMPLETED) return { error: "An invoice can only be created after the job is completed." };

  const totals = calculateInvoiceTotals(data.items, data.discount, data.tax);
  const now = new Date();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const invoice = await db.$transaction(async (tx) => {
        const existing = await tx.invoice.findUnique({ where: { jobId: data.jobId }, select: { id: true } });
        if (existing) throw new Error("INVOICE_EXISTS");

        const prefix = formatInvoiceNumber(now, 0).slice(0, -4);
        const count = await tx.invoice.count({ where: { invoiceNumber: { startsWith: prefix } } });
        const invoice = await tx.invoice.create({
          data: {
            jobId: data.jobId,
            invoiceNumber: formatInvoiceNumber(now, count + 1),
            status: InvoiceStatus.ISSUED,
            subtotal: totals.subtotal,
            discount: totals.discount,
            tax: totals.tax,
            total: totals.total,
            issuedAt: now,
            dueAt: data.dueAt ? new Date(data.dueAt) : null,
            printableToken: randomBytes(24).toString("base64url"),
            items: { create: data.items.map((item) => ({ ...item, lineTotal: Math.round((item.quantity * item.unitPrice + Number.EPSILON) * 100) / 100 })) },
          },
        });
        await tx.job.update({ where: { id: job.id }, data: { paymentStatus: totals.total === 0 ? PaymentStatus.PAID : PaymentStatus.UNPAID } });
        await tx.feedback.create({ data: { jobId: job.id, customerId: job.customerId, token: randomBytes(24).toString("base64url") } });
        return invoice;
      });
      revalidatePath("/invoices");
      return { success: `Invoice ${invoice.invoiceNumber} issued.`, invoiceId: invoice.id };
    } catch (error) {
      if (error instanceof Error && error.message === "INVOICE_EXISTS") return { error: "This job already has an invoice." };
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2) continue;
      throw error;
    }
  }
  return { error: "Could not allocate an invoice number. Please try again." };
}

export async function recordPayments(
  _previousState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  await requireRole(allowedRoles);

  let payments: unknown;
  try {
    payments = JSON.parse(String(formData.get("payments") ?? "[]"));
  } catch {
    return { error: "Payment lines could not be read. Please add them again." };
  }
  const parsed = recordPaymentsSchema.safeParse({ invoiceId: formData.get("invoiceId"), payments });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the payment details." };

  const invoice = await db.invoice.findUnique({ where: { id: parsed.data.invoiceId }, include: invoiceInclude });
  if (!invoice) return { error: "This invoice no longer exists." };
  if (invoice.status === InvoiceStatus.VOID) return { error: "Payments cannot be added to a void invoice." };

  const existingPaid = Number(invoice.payments.reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0)));
  const incoming = parsed.data.payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (existingPaid + incoming > Number(invoice.total) + 0.005) return { error: "Payments cannot exceed the invoice total." };

  await db.$transaction(async (tx) => {
    const created = await tx.payment.createMany({
      data: parsed.data.payments.map((payment) => ({
        invoiceId: invoice.id,
        method: payment.method,
        amount: payment.amount,
        collectedByTeam: payment.collectedByTeam,
        referenceNumber: payment.referenceNumber || null,
        notes: payment.notes || null,
      })),
    });
    if (created.count !== parsed.data.payments.length) throw new Error("Unable to record every payment line.");

    const allPayments = [...invoice.payments, ...parsed.data.payments.map((payment) => ({ amount: new Prisma.Decimal(payment.amount) }))];
    const status = getInvoiceStatus(Number(invoice.total), allPayments);
    await tx.invoice.update({ where: { id: invoice.id }, data: { status } });
    await tx.job.update({
      where: { id: invoice.job.id },
      data: { paymentStatus: status === InvoiceStatus.PAID ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID },
    });
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  return { success: "Payment record saved and invoice balance recalculated." };
}
