import Link from "next/link";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { JobActionQueue, type JobFlowQueueRow } from "@/components/job-flow/job-action-queue";
import { cn } from "@/lib/utils";

export function JobFlowShell({ rows, selectedId, search, showWorkspace, backHref = "/jobs", children }: { rows: JobFlowQueueRow[]; selectedId?: string; search: string; showWorkspace: boolean; backHref?: string; children: React.ReactNode }) {
  return <main className="min-h-[calc(100vh-105px)] bg-muted/30">
    <div className="grid lg:grid-cols-[310px_minmax(0,1fr)]">
      <div className={showWorkspace ? "hidden lg:block" : "block"}><JobActionQueue rows={rows} selectedId={selectedId} search={search} /></div>
      <section className={showWorkspace ? "min-w-0" : "hidden lg:block"}>
        <div className="mx-auto max-w-5xl p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link href={backHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "lg:hidden")}><ArrowLeftIcon data-icon="inline-start" />Back to jobs</Link>
            <div className="ml-auto"><Link href="/jobs?mode=new" className={buttonVariants()}><PlusIcon data-icon="inline-start" />New WhatsApp job</Link></div>
          </div>
          {children}
        </div>
      </section>
    </div>
  </main>;
}
