import { PayoutWorkspace } from "@/components/payouts/payout-workspace";
import { requireRole } from "@/src/lib/auth/guards";
import { parsePayoutMonth } from "@/src/lib/payouts/month";
import { ensureSalaryObligations } from "@/src/lib/payouts/salary-obligations";
import { getPayoutWorkspace } from "@/src/lib/payouts/workspace";

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireRole(["DATA_ENTRY"]);
  const params = await searchParams;
  const periodKey = parsePayoutMonth(params.month);
  const generation = await ensureSalaryObligations(periodKey);
  const workspace = await getPayoutWorkspace(periodKey, generation.exceptions);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-8 md:py-8">
      <PayoutWorkspace data={workspace} />
    </main>
  );
}
