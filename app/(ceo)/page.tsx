import { CalendarDaysIcon, CircleUserRoundIcon, LogOutIcon, TruckIcon } from "lucide-react";

import { signOut } from "@/auth";
import { CeoDashboard } from "@/components/dashboard/ceo-dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/src/lib/auth/guards";
import { getMonitoringSnapshot, parseMonitoringPeriod } from "@/src/lib/dashboard/monitoring";

export default async function Home({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const [session, params] = await Promise.all([requireRole(["ADMIN"]), searchParams]);
  const snapshot = await getMonitoringSnapshot(parseMonitoringPeriod(params.period));

  return <main className="min-h-screen bg-[#f7f9f8] text-foreground dark:bg-background"><div className="grid min-h-screen lg:grid-cols-[208px_minmax(0,1fr)]"><aside className="border-b border-[#d8e0dc] bg-background px-5 py-6 lg:border-r lg:border-b-0 dark:border-border"><div className="flex items-center gap-2.5"><div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><TruckIcon className="size-4" /></div><p className="text-base font-semibold">AC Bill</p></div><div className="mt-10 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">CEO monitor</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Read-only operational and financial visibility.</p></aside><section className="min-w-0"><header className="border-b border-[#d8e0dc] bg-background px-5 py-5 md:px-8 dark:border-border"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><h1 className="text-3xl font-semibold leading-none">Operations monitor</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDaysIcon className="size-3.5" />{snapshot.label}</p></div><div className="flex flex-wrap items-center gap-2"><div className="mr-auto flex min-w-0 items-center gap-2 px-1 xl:mr-1"><CircleUserRoundIcon className="size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="truncate text-sm font-medium">{session.user.name || "Admin account"}</p><p className="truncate text-xs text-muted-foreground">CEO / Admin</p></div></div><ThemeToggle /><form action={async () => { "use server"; await signOut({ redirectTo: "/signin" }); }}><Button variant="ghost" size="icon" type="submit" title="Sign out" aria-label="Sign out"><LogOutIcon /></Button></form></div></div></header><CeoDashboard snapshot={snapshot} /></section></div></main>;
}
