"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CustomerLinkActions({ feedbackPath, invoicePath }: { feedbackPath: string; invoicePath?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCustomerMessage() {
    const feedbackUrl = new URL(feedbackPath, window.location.origin).toString();
    const invoiceUrl = invoicePath ? new URL(invoicePath, window.location.origin).toString() : null;
    const lines = [
      "Thank you for choosing Ezy Aircond.",
      invoiceUrl ? `Invoice: ${invoiceUrl}` : null,
      `Feedback: ${feedbackUrl}`,
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
  }

  return <div className="mt-4 flex flex-wrap gap-2">
    <a href={feedbackPath} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted">Open customer review form</a>
    <Button type="button" variant="outline" size="sm" onClick={copyCustomerMessage}>{copied ? "Customer message copied" : "Copy customer message"}</Button>
  </div>;
}
