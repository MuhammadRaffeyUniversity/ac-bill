import { CheckCircle2Icon, ExternalLinkIcon, FileDownIcon } from "lucide-react";

import { CustomerLinkActions } from "@/components/billing/customer-link-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HandoffStageProps = {
  invoiceNumber: string;
  total: number;
  paid: number;
  invoicePath: string;
  pdfPath: string;
  feedbackPath: string;
};

export function HandoffStage({
  invoiceNumber,
  total,
  paid,
  invoicePath,
  pdfPath,
  feedbackPath,
}: HandoffStageProps) {
  const due = Math.max(0, total - paid);
  const invoiceFigures = [
    { label: "Total", value: total, tone: "default" },
    { label: "Paid", value: paid, tone: "success" },
    { label: "Due", value: due, tone: due > 0 ? "warning" : "success" },
  ] as const;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="grid gap-5 border-b bg-gradient-to-br from-audit/70 via-card to-card p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Stage 5 of 5</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Customer handoff</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Prepare the customer documents, then copy the final message with both secure links.
          </p>
        </div>
        <Badge variant="outline" className="h-7 gap-1.5 border-audit-foreground/20 bg-audit text-audit-foreground">
          <CheckCircle2Icon data-icon="inline-start" />
          Ready to send
        </Badge>
      </header>

      <div className="grid border-b sm:grid-cols-3">
        {invoiceFigures.map((figure) => (
          <div key={figure.label} className="border-b px-5 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{figure.label}</p>
            <p
              className={cn(
                "mt-1 font-mono text-xl font-semibold tabular-nums",
                figure.tone === "success" ? "text-audit-foreground" : null,
                figure.tone === "warning" ? "text-action-required-foreground" : null,
              )}
            >
              RM {figure.value.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 p-5 sm:p-6" aria-label="Step 1">
        <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
          <span className="font-mono text-sm font-semibold text-primary">01</span>
          <div>
            <h3 className="font-semibold">Customer documents</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Invoice <span className="font-mono text-foreground">{invoiceNumber}</span> is ready to open or download.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:ml-8 sm:grid-cols-2 lg:max-w-xl">
          <a
            href={invoicePath}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            Open customer invoice
          </a>
          <a href={pdfPath} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            <FileDownIcon data-icon="inline-start" />
            Download PDF
          </a>
        </div>
      </div>

      <CustomerLinkActions feedbackPath={feedbackPath} invoicePath={invoicePath} />
    </section>
  );
}
