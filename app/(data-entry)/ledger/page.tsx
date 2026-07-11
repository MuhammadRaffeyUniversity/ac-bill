import { LedgerWorkspace } from "@/components/ledger/ledger-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export default async function LedgerPage() {
  await requireRole(["DATA_ENTRY"]);
  const [companyExpenses, personalExpenses, pettyCashEntries] = await Promise.all([
    db.companyExpense.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 15, select: { id: true, date: true, category: true, amount: true, paymentMethod: true } }),
    db.personalExpense.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 15, select: { id: true, date: true, category: true, amount: true } }),
    db.pettyCashEntry.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 20, select: { id: true, date: true, cashIn: true, cashOut: true, balanceAfter: true, sourceType: true, note: true } }),
  ]);
  return <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-8 md:py-10"><div className="mx-auto grid max-w-7xl gap-6"><header><h1 className="text-2xl font-semibold">Company ledger</h1><p className="mt-1 text-sm text-muted-foreground">Company spending, owner spending, and petty cash are recorded separately for clean reconciliation.</p></header><LedgerWorkspace entryDate={new Date().toISOString().slice(0, 10)} companyExpenses={companyExpenses.map((entry) => ({ ...entry, date: entry.date.toISOString().slice(0, 10), amount: Number(entry.amount) }))} personalExpenses={personalExpenses.map((entry) => ({ ...entry, date: entry.date.toISOString().slice(0, 10), amount: Number(entry.amount) }))} pettyCashEntries={pettyCashEntries.map((entry) => ({ ...entry, date: entry.date.toISOString().slice(0, 10), cashIn: Number(entry.cashIn), cashOut: Number(entry.cashOut), balanceAfter: Number(entry.balanceAfter) }))} /></div></main>;
}
