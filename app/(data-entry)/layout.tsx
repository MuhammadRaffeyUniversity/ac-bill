import Link from "next/link";
import { CircleUserRoundIcon, FileTextIcon, LogOutIcon, ReceiptTextIcon, Settings2Icon } from "lucide-react";

import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/src/lib/auth/guards";
import { hasAnyRole } from "@/src/lib/auth/permissions";

const dataEntryLinks = [
  { href: "/jobs", label: "Job flow", icon: FileTextIcon, roles: ["DATA_ENTRY", "DISPATCHER", "TEAM_LEAD", "VIEWER"] as const },
  { href: "/expenses", label: "Expenses", icon: ReceiptTextIcon, roles: ["DATA_ENTRY"] as const },
  { href: "/team-setup", label: "Teams", icon: Settings2Icon, roles: ["DATA_ENTRY"] as const },
] as const;

export default async function DataEntryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const role = session.user.role;

  return (
    <div className="grid min-h-screen grid-cols-1 bg-muted/30 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="border-b bg-background px-4 py-4 lg:border-r lg:border-b-0">
        <div><p className="text-sm font-semibold">AC Bill</p><p className="text-xs text-muted-foreground">Operations</p></div>
        <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
          {dataEntryLinks.filter((link) => hasAnyRole(role, link.roles)).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <header className="border-b bg-background px-5 py-5 md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-none">Data entry workspace</h1>
              <p className="mt-2 text-sm text-muted-foreground">Capture WhatsApp bookings and keep operations moving.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto flex min-w-0 items-center gap-2 px-1 xl:mr-1">
                <CircleUserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0"><p className="truncate text-sm font-medium">{session.user.name || "Data Entry"}</p><p className="truncate text-xs text-muted-foreground">Data Entry</p></div>
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
