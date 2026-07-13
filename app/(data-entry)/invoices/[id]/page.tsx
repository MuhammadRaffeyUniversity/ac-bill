import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";

export default async function LegacyInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["DATA_ENTRY", "DISPATCHER"]);
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id }, select: { jobId: true } });
  if (!invoice) notFound();
  redirect(`/jobs?job=${encodeURIComponent(invoice.jobId)}`);
}
