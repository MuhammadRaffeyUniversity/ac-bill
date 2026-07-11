import { feedbackSchema } from "@/src/lib/billing/schema";
import { db } from "@/src/lib/db";

export async function submitFeedback(input: unknown) {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your feedback." };

  const feedback = await db.feedback.findUnique({ where: { token: parsed.data.token }, select: { id: true, submittedAt: true } });
  if (!feedback) return { error: "This feedback link is not valid." };
  if (feedback.submittedAt) return { error: "Feedback has already been submitted for this job." };

  await db.feedback.update({
    where: { id: feedback.id },
    data: {
      rating: parsed.data.rating,
      paidAmount: parsed.data.paidAmount,
      paymentMethod: parsed.data.paymentMethod,
      acCooling: parsed.data.acCooling === "YES",
      comment: parsed.data.comment || null,
      publicDisplayPermission: parsed.data.publicDisplayPermission,
      submittedAt: new Date(),
    },
  });
  return { success: "Thank you for your feedback." };
}
