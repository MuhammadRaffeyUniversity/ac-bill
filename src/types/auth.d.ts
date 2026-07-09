import type { UserRole } from "@/src/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      teamId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    teamId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    teamId?: string | null;
  }
}
