export function getInvoiceHandoffPath(jobId: string, status: string) {
  if (status !== "COMPLETED") return null;
  return `/invoices?jobId=${encodeURIComponent(jobId)}`;
}
