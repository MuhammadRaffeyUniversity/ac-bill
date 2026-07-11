import Link from "next/link";
import { ClipboardListIcon, FileTextIcon, LayoutDashboardIcon, ReceiptTextIcon, Settings2Icon, UsersRoundIcon } from "lucide-react";

import { requireSession } from "@/src/lib/auth/guards";
import { hasAnyRole } from "@/src/lib/auth/permissions";

const dataEntryLinks = [
  { href: "/jobs/intake", label: "Intake", icon: ClipboardListIcon, roles: ["DATA_ENTRY"] as const },
  { href: "/dispatch", label: "Dispatch", icon: LayoutDashboardIcon, roles: ["DATA_ENTRY", "DISPATCHER"] as const },
  { href: "/jobs", label: "Jobs", icon: FileTextIcon, roles: ["DATA_ENTRY", "DISPATCHER", "TEAM_LEAD", "VIEWER"] as const },
  { href: "/team-entries", label: "Team updates", icon: UsersRoundIcon, roles: ["DATA_ENTRY"] as const },
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
      <section className="min-w-0">{children}</section>
    </div>
  );
}
