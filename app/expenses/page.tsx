import { ExpensesWorkspace } from "@/components/operations/expenses-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export default async function ExpensesPage() {
  await requireRole(["DATA_ENTRY"]);
  const [teams, jobs, expenses] = await Promise.all([
    db.team.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.job.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, assignedTeamId: true, customer: { select: { name: true } } } }),
    db.teamExpense.findMany({ orderBy: { createdAt: "desc" }, take: 30, select: { id: true, category: true, amount: true, date: true, approved: true, team: { select: { name: true } } } }),
  ]);
  return <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-8 md:py-10"><div className="mx-auto grid max-w-7xl gap-6"><header><h1 className="text-2xl font-semibold">Team expenses</h1><p className="mt-1 text-sm text-muted-foreground">Record field expenses without mixing them with company or personal spending.</p></header><ExpensesWorkspace teams={teams} jobs={jobs.map((job) => ({ id: job.id, customer: job.customer.name, assignedTeamId: job.assignedTeamId }))} expenses={expenses.map((expense) => ({ id: expense.id, category: expense.category, team: expense.team.name, amount: expense.amount.toFixed(2), date: expense.date.toISOString().slice(0, 10), approved: expense.approved }))} entryDate={new Date().toISOString().slice(0, 10)} /></div></main>;
}
