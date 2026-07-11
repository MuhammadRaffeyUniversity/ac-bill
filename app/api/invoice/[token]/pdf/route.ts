import { renderToBuffer } from "@react-pdf/renderer";

import { InvoicePdf } from "@/src/lib/billing/invoice-pdf";
import { db } from "@/src/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await db.invoice.findUnique({ where: { printableToken: token }, select: { invoiceNumber: true, issuedAt: true, subtotal: true, discount: true, tax: true, total: true, items: { select: { description: true, quantity: true, unitPrice: true, lineTotal: true } }, job: { select: { customer: { select: { name: true } }, address: { select: { rawAddress: true } } } } } });
  if (!invoice) return new Response("Invoice not found.", { status: 404 });

  const pdf = await renderToBuffer(InvoicePdf({ invoice: {
    invoiceNumber: invoice.invoiceNumber, issuedAt: invoice.issuedAt, customerName: invoice.job.customer.name, customerAddress: invoice.job.address.rawAddress,
    subtotal: Number(invoice.subtotal), discount: Number(invoice.discount), tax: Number(invoice.tax), total: Number(invoice.total),
    items: invoice.items.map((item) => ({ description: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })),
  } }));
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=\"${invoice.invoiceNumber}.pdf\"`, "Cache-Control": "private, no-store" } });
}
