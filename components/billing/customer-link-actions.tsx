"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "error";

export function CustomerLinkActions({ feedbackPath, invoicePath }: { feedbackPath: string; invoicePath?: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function copyCustomerMessage() {
    const feedbackUrl = new URL(feedbackPath, window.location.origin).toString();
    const invoiceUrl = invoicePath ? new URL(invoicePath, window.location.origin).toString() : null;
    const lines = [
      "Thank you for choosing Ezy Aircond.",
      invoiceUrl ? `Invoice: ${invoiceUrl}` : null,
      `Feedback: ${feedbackUrl}`,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="grid gap-4 border-t bg-muted/20 p-5 sm:p-6" aria-label="Step 2">
      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
        <span className="font-mono text-sm font-semibold text-primary">02</span>
        <div>
          <h3 className="font-semibold">Send to customer</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Includes the invoice and feedback links in one ready-to-send message.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:ml-8 sm:grid-cols-2 lg:max-w-xl">
        <a
          href={feedbackPath}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
        >
          <ExternalLinkIcon data-icon="inline-start" />
          Open customer review form
        </a>
        <Button type="button" size="lg" className="w-full" onClick={copyCustomerMessage}>
          {copyState === "copied" ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copyState === "copied" ? "Customer message copied" : "Copy customer message"}
        </Button>
      </div>
      <p
        aria-live="polite"
        className={cn("min-h-5 text-xs sm:ml-8", copyState === "error" ? "text-destructive" : "text-muted-foreground")}
      >
        {copyState === "error"
          ? "Could not copy the customer message. Check browser clipboard access and try again."
          : copyState === "copied"
            ? "The customer message is ready to paste into WhatsApp."
            : "The copied message includes both secure customer links."}
      </p>
    </div>
  );
}
