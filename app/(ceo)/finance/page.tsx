import { redirect } from "next/navigation";

import { requireSession } from "@/src/lib/auth/guards";
import { getDefaultRouteForRole } from "@/src/lib/auth/permissions";

export default async function FinancePage() {
  const session = await requireSession();
  redirect(getDefaultRouteForRole(session.user.role));
}
