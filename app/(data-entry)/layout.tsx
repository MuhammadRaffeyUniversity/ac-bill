import Link from "next/link";
import { CircleUserRoundIcon, FileTextIcon, LandmarkIcon, LogOutIcon, ReceiptTextIcon, Settings2Icon } from "lucide-react";

import { signOut } from "@/auth";
import { MobileSidebar } from "@/components/navigation/mobile-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/src/lib/auth/guards";
import { hasAnyRole } from "@/src/lib/auth/permissions";

const dataEntryLinks = [
  { href: "/jobs", label: "Job flow", icon: FileTextIcon, mobileIcon: "jobs", roles: ["DATA_ENTRY", "DISPATCHER", "TEAM_LEAD", "VIEWER"] as const },
  { href: "/expenses", label: "Expenses", icon: ReceiptTextIcon, mobileIcon: "expenses", roles: ["DATA_ENTRY"] as const },
  { href: "/ledger", label: "Company & CEO", icon: LandmarkIcon, mobileIcon: "ledger", roles: ["DATA_ENTRY"] as const },
  { href: "/team-setup", label: "Teams", icon: Settings2Icon, mobileIcon: "teams", roles: ["DATA_ENTRY"] as const },
] as const;

const roleLabels: Record<string, string> = {
  DATA_ENTRY: "Data Entry",
  DISPATCHER: "Dispatcher",
  TEAM_LEAD: "Team Lead",
  VIEWER: "Viewer",
};

export default async function DataEntryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const role = session.user.role;
  const readOnlyRole = role === "TEAM_LEAD" || role === "VIEWER";
  const visibleLinks = dataEntryLinks.filter((link) => hasAnyRole(role, link.roles));
  const mobileLinks = visibleLinks.map(({ href, label, mobileIcon: icon }) => ({ href, label, icon }));

  return (
    <div className="grid min-h-screen grid-cols-1 bg-muted/30 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="hidden border-b bg-background px-4 py-4 lg:block lg:border-r lg:border-b-0">
        <div><p className="text-sm font-semibold">AC Bill</p><p className="text-xs text-muted-foreground">Operations</p></div>
        <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
          {visibleLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0" data-motion="page">
        <header className="border-b bg-background px-5 py-5 md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <MobileSidebar links={mobileLinks} title={roleLabels[role] ?? "Operations"} description="Operations" />
              <div>
                <h1 className="text-2xl font-semibold leading-none sm:text-3xl">{readOnlyRole ? "Operations worklist" : "Data entry workspace"}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{readOnlyRole ? "Review the current jobs available to your role." : "Capture WhatsApp bookings and keep operations moving."}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto flex min-w-0 items-center gap-2 px-1 xl:mr-1">
                <CircleUserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0"><p className="truncate text-sm font-medium">{session.user.name || "Staff member"}</p><p className="truncate text-xs text-muted-foreground">{roleLabels[role] ?? role.replaceAll("_", " ")}</p></div>
              </div>
              <ThemeToggle />
              <form action={async () => { "use server"; await signOut({ redirectTo: "/signin" }); }}>
                <Button variant="ghost" size="icon" type="submit" title="Sign out" aria-label="Sign out"><LogOutIcon /></Button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}
