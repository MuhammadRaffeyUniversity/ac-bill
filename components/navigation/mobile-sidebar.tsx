"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FileTextIcon,
  GaugeIcon,
  LandmarkIcon,
  MenuIcon,
  ReceiptTextIcon,
  Settings2Icon,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type MobileSidebarLink = {
  href: string;
  label: string;
  icon: "jobs" | "expenses" | "ledger" | "teams" | "monitor";
};

const icons: Record<MobileSidebarLink["icon"], LucideIcon> = {
  jobs: FileTextIcon,
  expenses: ReceiptTextIcon,
  ledger: LandmarkIcon,
  teams: Settings2Icon,
  monitor: GaugeIcon,
};

export function MobileSidebar({
  links,
  title,
  description,
}: {
  links: MobileSidebarLink[];
  title: string;
  description: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0 lg:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <MenuIcon />
      </DialogTrigger>
      <SheetContent side="left">
        <DialogHeader className="border-b px-5 py-5 pr-14 text-left">
          <DialogTitle>AC Bill</DialogTitle>
          <DialogDescription>{title} · {description}</DialogDescription>
        </DialogHeader>
        <nav className="grid gap-1 p-3" aria-label={`${title} navigation`}>
          {links.map((link) => {
            const Icon = icons[link.icon];
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                onNavigate={() => setOpen(false)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Dialog>
  );
}

function SheetContent({
  side,
  children,
}: {
  side: "left";
  children: React.ReactNode;
}) {
  return (
    <DialogContent
      data-side={side}
      className="inset-y-0 left-0 h-dvh w-[min(20rem,88vw)] max-w-none translate-x-0 translate-y-0 content-start gap-0 rounded-none border-r p-0 sm:max-w-none data-open:slide-in-from-left-full data-closed:slide-out-to-left-full"
    >
      {children}
    </DialogContent>
  );
}
