import { InvoiceWorkspace } from "@/components/billing/invoice-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ jobId?: string }> }) {
  await requireRole(["DATA_ENTRY", "DISPATCHER"]);
  const { jobId } = await searchParams;
  const [completedJobs, invoices] = await Promise.all([
    db.job.findMany({ where: { status: "COMPLETED", invoice: null }, orderBy: { performedAt: "desc" }, take: 50, select: { id: true, serviceType: true, requestedAt: true, customer: { select: { name: true } } } }),
    db.invoice.findMany({ orderBy: { issuedAt: "desc" }, take: 50, select: { id: true, invoiceNumber: true, status: true, total: true, issuedAt: true, payments: { select: { amount: true } }, job: { select: { serviceType: true, customer: { select: { name: true } } } } } }),
  ]);
  const invoiceJobs = completedJobs.map((job) => ({ id: job.id, customer: job.customer.name, serviceType: job.serviceType, requestedAt: job.requestedAt?.toISOString() ?? null }));
  return <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-8 md:py-10"><div className="mx-auto grid max-w-7xl gap-6"><header><h1 className="text-2xl font-semibold">Invoices and payments</h1><p className="mt-1 text-sm text-muted-foreground">Enter the team&apos;s amount, issue the invoice, then record exactly how the customer paid.</p></header><InvoiceWorkspace completedJobs={invoiceJobs} initialJobId={invoiceJobs.some((job) => job.id === jobId) ? jobId : undefined} invoices={invoices.map((invoice) => ({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, status: invoice.status, total: Number(invoice.total), paid: invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0), customer: invoice.job.customer.name, serviceType: invoice.job.serviceType, issuedAt: invoice.issuedAt?.toISOString() ?? null }))} /></div></main>;
}
