import { notFound } from "next/navigation";

import { db } from "@/src/lib/db";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await db.invoice.findUnique({ where: { printableToken: token }, select: { invoiceNumber: true, status: true, subtotal: true, discount: true, tax: true, total: true, issuedAt: true, dueAt: true, items: { select: { id: true, description: true, quantity: true, lineTotal: true } }, payments: { select: { amount: true } }, job: { select: { customer: { select: { name: true } } } } } });
  if (!invoice) notFound();
  const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <main className="min-h-screen bg-muted/30 px-3 py-6 sm:px-4 sm:py-10" data-motion="page">
      <article className="mx-auto max-w-2xl bg-background p-4 shadow-sm ring-1 ring-foreground/10 sm:p-6" data-motion="panel">
        <p className="text-sm font-medium text-primary">AC BILL</p>
        <h1 className="mt-1 break-words text-xl font-semibold sm:text-2xl">Invoice {invoice.invoiceNumber}</h1>
        <div className="mt-6 grid gap-4 border-y py-5 text-sm sm:mt-8 sm:grid-cols-2">
          <div><p className="text-muted-foreground">Customer</p><p className="mt-1 break-words font-medium">{invoice.job.customer.name}</p></div>
          <div className="sm:text-right"><p className="text-muted-foreground">Issued</p><p className="mt-1">{invoice.issuedAt?.toLocaleDateString("en-MY", { dateStyle: "medium" }) ?? "Pending"}</p></div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead className="border-b text-left text-muted-foreground"><tr><th className="py-3 font-medium">Description</th><th className="py-3 text-right font-medium">Qty</th><th className="py-3 text-right font-medium">Amount</th></tr></thead>
            <tbody>{invoice.items.map((item) => <tr key={item.id} className="border-b"><td className="py-3 pr-4">{item.description}</td><td className="py-3 text-right">{Number(item.quantity)}</td><td className="py-3 text-right">RM {Number(item.lineTotal).toFixed(2)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="ml-auto mt-6 grid w-full max-w-xs gap-2 text-sm">
          <Summary label="Subtotal" value={Number(invoice.subtotal)} />
          {Number(invoice.discount) ? <Summary label="Discount" value={-Number(invoice.discount)} /> : null}
          {Number(invoice.tax) ? <Summary label="Tax" value={Number(invoice.tax)} /> : null}
          <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span>RM {Number(invoice.total).toFixed(2)}</span></div>
          <Summary label="Paid" value={paid} />
          <div className="flex justify-between font-medium"><span>Balance due</span><span>RM {Math.max(0, Number(invoice.total) - paid).toFixed(2)}</span></div>
        </div>
      </article>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span>RM {value.toFixed(2)}</span></div>;
}
