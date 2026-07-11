import Link from "next/link";
import {
  ArrowLeftRightIcon,
  ClipboardListIcon,
  FileTextIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserRole } from "@/src/generated/prisma/enums";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";

type WorkspaceMetric = {
  label: string;
  value: string;
  detail: string;
};

type WorkspaceRow = {
  id: string;
  primary: string;
  secondary: string;
  status: string;
  amount?: string;
};

type OperationsShellProps = {
  title: string;
  description: string;
  roleLabel: string;
  activePath: string;
  metrics: WorkspaceMetric[];
  rows: WorkspaceRow[];
  showMetrics?: boolean;
  showWorkQueue?: boolean;
  children?: React.ReactNode;
};

const navItems: Array<{ label: string; href: string; roles: UserRole[] }> = [
  { label: "Dashboard", href: "/", roles: ["ADMIN"] },
  { label: "Intake", href: "/jobs/intake", roles: ["DATA_ENTRY"] },
  { label: "Dispatch", href: "/dispatch", roles: ["DISPATCHER", "DATA_ENTRY"] },
  { label: "Jobs", href: "/jobs", roles: ["DISPATCHER", "DATA_ENTRY", "TEAM_LEAD", "VIEWER"] },
  { label: "Team updates", href: "/team-entries", roles: ["DATA_ENTRY"] },
  { label: "Team mobile", href: "/team", roles: ["TEAM_LEAD"] },
  { label: "Expenses", href: "/expenses", roles: ["DATA_ENTRY"] },
  { label: "Partner", href: "/partner", roles: ["PARTNER_VIEWER"] },
];

export async function OperationsShell({
  title,
  description,
  roleLabel,
  activePath,
  metrics,
  rows,
  showMetrics = true,
  showWorkQueue = true,
  children,
}: OperationsShellProps) {
  const session = await auth();
  const role = session?.user?.role;
  return (
    <main className="min-h-screen bg-muted/30 text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="border-b bg-background px-4 py-4 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheckIcon />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">AC Bill</p>
              <p className="text-xs text-muted-foreground">Operations</p>
            </div>
          </div>

          <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
            {navItems.filter((item) => role && item.roles.includes(role)).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: item.href === activePath ? "secondary" : "ghost" }),
                  "justify-start"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="border-b bg-background px-4 py-3 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{roleLabel}</Badge>
                <ThemeToggle />
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/signin" });
                  }}
                >
                  <Button variant="outline" type="submit">
                    <LogOutIcon data-icon="inline-start" />
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <div className="grid gap-4 p-4 md:p-6">
            {showMetrics ? <section className="grid gap-3 md:grid-cols-3">
              {metrics.map((metric) => (
                <Card key={metric.label} size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-normal">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </section> : null}

            {children}

            {showWorkQueue ? <Card>
              <CardHeader>
                <CardTitle>Work queue</CardTitle>
                <CardDescription>Current records visible for this role.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:hidden">
                  {rows.map((row) => (
                    <div key={row.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{row.primary}</p>
                          <p className="text-xs text-muted-foreground">{row.secondary}</p>
                        </div>
                        <Badge variant="outline">{row.status}</Badge>
                      </div>
                      {row.amount ? <p className="mt-3 text-sm font-semibold">{row.amount}</p> : null}
                    </div>
                  ))}
                </div>

                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Record</TableHead>
                        <TableHead>Detail</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="font-medium">{row.primary}</div>
                            <div className="text-xs text-muted-foreground">{row.id}</div>
                          </TableCell>
                          <TableCell>{row.secondary}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.status}</Badge>
                          </TableCell>
                          <TableCell>{row.amount ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

export function WorkflowPanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {items.map((item, index) => (
          <div key={item} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              {index === 0 ? <ClipboardListIcon /> : index === 1 ? <ArrowLeftRightIcon /> : <FileTextIcon />}
              {item}
            </div>
            <p className="text-xs text-muted-foreground">Required before this record moves to the next step.</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
