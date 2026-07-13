"use server";

import { randomBytes } from "node:crypto";

import { Prisma } from "@/src/generated/prisma/client";
import { InvoiceStatus, JobStatus, PaymentStatus, ReviewStatus, TeamEntryType } from "@/src/generated/prisma/enums";
import { revalidatePath } from "next/cache";

import { calculateInvoiceTotals, formatInvoiceNumber, getPaymentSummary } from "@/src/lib/billing/calculations";
import { createInvoiceWithPaymentsSchema, recordPaymentsSchema } from "@/src/lib/billing/schema";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export type BillingActionState = { error?: string; success?: string; invoiceId?: string; jobId?: string };

const allowedRoles = ["DATA_ENTRY", "DISPATCHER"] as const;
const invoiceInclude = {
  payments: { select: { amount: true } },
  job: { select: { id: true } },
} as const;

function parseInvoiceWithPaymentsFormData(formData: FormData) {
  const items = JSON.parse(String(formData.get("items") ?? "[]"));
  const payments = JSON.parse(String(formData.get("payments") ?? "[]"));
  return createInvoiceWithPaymentsSchema.safeParse({
    jobId: formData.get("jobId"),
    discount: formData.get("discount") || 0,
    tax: formData.get("tax") || 0,
    dueAt: formData.get("dueAt"),
    items,
    payments,
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
  _formData: FormData,
): Promise<BillingActionState> {
  void _previousState;
  void _formData;
  await requireRole(allowedRoles);
  return { error: "Use the guided job flow to issue this invoice with its audited payment details." };
}

export async function createInvoiceWithPayments(
  _previousState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  await requireRole(allowedRoles);

  let parsed: ReturnType<typeof parseInvoiceWithPaymentsFormData>;
  try {
    parsed = parseInvoiceWithPaymentsFormData(formData);
  } catch {
    return { error: "Invoice or payment rows could not be read. Add them again." };
  }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the invoice and payment details." };

  const data = parsed.data;
  const job = await db.job.findUnique({
    where: { id: data.jobId },
    select: {
      id: true,
      status: true,
      performed: true,
      customerId: true,
      submittedEntries: {
        where: { entryType: TeamEntryType.COMPLETION, reviewStatus: ReviewStatus.APPROVED },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!job) return { error: "This job no longer exists." };
  if (job.status !== JobStatus.COMPLETED || !job.performed || !job.submittedEntries.length) return { error: "An invoice requires performed work and an approved manual completion report." };

  const totals = calculateInvoiceTotals(data.items, data.discount, data.tax);
  const paymentSummary = getPaymentSummary(totals.total, data.payments);
  const invoiceStatus = totals.total > 0 && paymentSummary.isPaid
    ? InvoiceStatus.PAID
    : paymentSummary.isPartial
      ? InvoiceStatus.PARTIALLY_PAID
      : InvoiceStatus.ISSUED;
  const paymentStatus = totals.total === 0
    ? PaymentStatus.NO_CHARGE
    : paymentSummary.isPaid
      ? PaymentStatus.PAID
      : paymentSummary.isPartial
        ? PaymentStatus.PARTIALLY_PAID
        : PaymentStatus.UNPAID;
  const now = new Date();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const invoice = await db.$transaction(async (tx) => {
        const readyJob = await tx.job.findFirst({
          where: {
            id: job.id,
            status: JobStatus.COMPLETED,
            performed: true,
            submittedEntries: { some: { entryType: TeamEntryType.COMPLETION, reviewStatus: ReviewStatus.APPROVED } },
          },
          select: { id: true },
        });
        if (!readyJob) throw new Error("JOB_NOT_READY");

        const existing = await tx.invoice.findUnique({ where: { jobId: data.jobId }, select: { id: true } });
        if (existing) throw new Error("INVOICE_EXISTS");

        const prefix = formatInvoiceNumber(now, 0).slice(0, -4);
        const count = await tx.invoice.count({ where: { invoiceNumber: { startsWith: prefix } } });
        const invoice = await tx.invoice.create({
          data: {
            jobId: job.id,
            invoiceNumber: formatInvoiceNumber(now, count + 1),
            status: invoiceStatus,
            subtotal: totals.subtotal,
            discount: totals.discount,
            tax: totals.tax,
            total: totals.total,
            issuedAt: now,
            dueAt: data.dueAt ? new Date(data.dueAt) : null,
            printableToken: randomBytes(24).toString("base64url"),
            items: { create: data.items.map((item) => ({ ...item, lineTotal: Math.round((item.quantity * item.unitPrice + Number.EPSILON) * 100) / 100 })) },
            payments: { create: data.payments.map((payment) => ({
              method: payment.method,
              amount: payment.amount,
              collectedByTeam: payment.collectedByTeam,
              referenceNumber: payment.referenceNumber || null,
              notes: payment.notes || null,
            })) },
          },
        });
        await tx.job.update({ where: { id: job.id }, data: { paymentStatus } });
        await tx.feedback.create({ data: { jobId: job.id, customerId: job.customerId, token: randomBytes(24).toString("base64url") } });
        return invoice;
      });

      revalidatePath("/jobs");
      revalidatePath("/invoices");
      return { success: `Invoice ${invoice.invoiceNumber} issued.`, invoiceId: invoice.id, jobId: job.id };
    } catch (error) {
      if (error instanceof Error && error.message === "JOB_NOT_READY") return { error: "The job changed and is no longer ready to invoice. Refresh it first." };
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
