"use client";

import { useState } from "react";
import { SendIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FeedbackForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [acCooling, setAcCooling] = useState("");
  const [comment, setComment] = useState("");
  const [permission, setPermission] = useState(false);
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setState({});
    const response = await fetch(`/api/feedback/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, paidAmount, paymentMethod, acCooling, comment, publicDisplayPermission: permission }) });
    const result = await response.json() as { error?: string; success?: string };
    setState(result);
    setSubmitting(false);
  }

  if (state.success) return <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">{state.success}</p>;
  return <form onSubmit={submit} className="grid gap-5"><fieldset className="grid gap-2"><legend className="text-sm font-medium">1. Total paid amount</legend><label className="flex max-w-48 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm"><span className="text-muted-foreground">RM</span><input required type="number" min="0" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="0.00" /></label></fieldset><fieldset className="grid gap-2"><legend className="text-sm font-medium">2. Payment method</legend><select required value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"><option value="">Select payment method</option><option value="ONLINE">Online bank transfer</option><option value="CASH">Cash paid to technician</option><option value="CARD">Card</option><option value="OTHER">Other</option></select></fieldset><fieldset className="grid gap-2"><legend className="text-sm font-medium">3. Technician rating</legend><div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value} onClick={() => setRating(value)} className="rounded-md p-1 text-muted-foreground hover:text-amber-500 aria-pressed:text-amber-500"><StarIcon className="size-7" fill={value <= rating ? "currentColor" : "none"} /></button>)}</div></fieldset><fieldset className="grid gap-2"><legend className="text-sm font-medium">4. Is your AC cooling properly?</legend><div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input required type="radio" name="acCooling" value="YES" checked={acCooling === "YES"} onChange={() => setAcCooling("YES")} />Yes, perfectly</label><label className="flex items-center gap-2"><input required type="radio" name="acCooling" value="NO" checked={acCooling === "NO"} onChange={() => setAcCooling("NO")} />No, needs attention</label></div></fieldset><label className="grid gap-2 text-sm font-medium">Comments <span className="font-normal text-muted-foreground">(optional)</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Tell us how we did" /></label><p className="rounded-md bg-sky-50 p-3 text-xs leading-5 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200">Your service includes a 30-day leakage warranty. Please keep this message for your next filter service.</p><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)} className="mt-1" />You may display this feedback publicly without my personal details.</label>{state.error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}<Button type="submit" disabled={submitting || rating === 0 || !paidAmount || !paymentMethod || !acCooling}><SendIcon data-icon="inline-start" />{submitting ? "Sending..." : "Send verification and feedback"}</Button></form>;
}
