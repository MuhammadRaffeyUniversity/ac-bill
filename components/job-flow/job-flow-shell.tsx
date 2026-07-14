import Link from "next/link";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { JobActionQueue, type JobFlowQueueRow } from "@/components/job-flow/job-action-queue";
import { cn } from "@/lib/utils";

export function JobFlowShell({ rows, selectedId, search, showWorkspace, backHref = "/jobs", children }: { rows: JobFlowQueueRow[]; selectedId?: string; search: string; showWorkspace: boolean; backHref?: string; children: React.ReactNode }) {
  return <main className="min-h-0 bg-muted/30 lg:h-full" data-motion="page">
    <div className="grid min-h-0 lg:h-full grid-cols-[minmax(0,1fr)] lg:grid-cols-[310px_minmax(0,1fr)]">
      <div className={cn(showWorkspace ? "hidden lg:block" : "block", "lg:min-h-0")}><JobActionQueue rows={rows} selectedId={selectedId} search={search} /></div>
      <section className={cn(showWorkspace ? "min-w-0" : "hidden lg:block", "ops-scrollbar lg:min-h-0 lg:overflow-y-auto")}>
        <div className="mx-auto max-w-5xl p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <Link href={backHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "lg:hidden")}><ArrowLeftIcon data-icon="inline-start" />Back to jobs</Link>
            <div className="ml-auto"><Link href="/jobs?mode=new" className={buttonVariants()}><PlusIcon data-icon="inline-start" />New WhatsApp job</Link></div>
          </div>
          {children}
        </div>
      </section>
    </div>
  </main>;
}
