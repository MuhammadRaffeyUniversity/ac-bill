import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { UserRole } from "@/src/generated/prisma/enums";
import { getDefaultRouteForRole, hasAnyRole } from "@/src/lib/auth/permissions";

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return session;
}

export async function requireRole(allowedRoles: readonly UserRole[]) {
  const session = await requireSession();

  if (!hasAnyRole(session.user.role, allowedRoles)) {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  return session;
}
