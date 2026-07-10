"use client";

import { useState } from "react";
import { SendIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FeedbackForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [permission, setPermission] = useState(false);
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setState({});
    const response = await fetch(`/api/feedback/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, comment, publicDisplayPermission: permission }) });
    const result = await response.json() as { error?: string; success?: string };
    setState(result);
    setSubmitting(false);
  }

  if (state.success) return <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">{state.success}</p>;
  return <form onSubmit={submit} className="grid gap-5"><fieldset className="grid gap-2"><legend className="text-sm font-medium">How was your service?</legend><div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value} onClick={() => setRating(value)} className="rounded-md p-1 text-muted-foreground hover:text-amber-500 aria-pressed:text-amber-500"><StarIcon className="size-7" fill={value <= rating ? "currentColor" : "none"} /></button>)}</div></fieldset><label className="grid gap-2 text-sm font-medium">Comments <span className="font-normal text-muted-foreground">(optional)</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Tell us how we did" /></label><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)} className="mt-1" />You may display this feedback publicly without my personal details.</label>{state.error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}<Button type="submit" disabled={submitting || rating === 0}><SendIcon data-icon="inline-start" />{submitting ? "Sending..." : "Send feedback"}</Button></form>;
}
