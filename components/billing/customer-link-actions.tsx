"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CustomerLinkActions({ feedbackPath }: { feedbackPath: string }) {
  const [copied, setCopied] = useState(false);

  async function copyFeedbackLink() {
    await navigator.clipboard.writeText(new URL(feedbackPath, window.location.origin).toString());
    setCopied(true);
  }

  return <div className="mt-4 flex flex-wrap gap-2">
    <a href={feedbackPath} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted">Open customer review form</a>
    <Button type="button" variant="outline" size="sm" onClick={copyFeedbackLink}>{copied ? "Review link copied" : "Copy review link"}</Button>
  </div>;
}
