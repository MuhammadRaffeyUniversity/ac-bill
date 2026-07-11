import { notFound } from "next/navigation";

import { FeedbackForm } from "@/components/billing/feedback-form";
import { db } from "@/src/lib/db";

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const feedback = await db.feedback.findUnique({ where: { token }, select: { submittedAt: true, job: { select: { customer: { select: { name: true } }, serviceType: true } } } });
  if (!feedback) notFound();
  return <main className="min-h-screen bg-muted/30 px-4 py-10"><section className="mx-auto max-w-lg bg-background p-6 shadow-sm ring-1 ring-foreground/10"><p className="text-sm font-medium text-primary">EZY AIRCON</p><h1 className="mt-1 text-2xl font-semibold">Quick verification check</h1><p className="mt-2 text-sm text-muted-foreground">Please confirm today&apos;s {feedback.job.serviceType.toLowerCase()} service and share your feedback.</p><div className="mt-7">{feedback.submittedAt ? <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">Thank you. Your verification and feedback have been received.</p> : <FeedbackForm token={token} />}</div></section></main>;
}
