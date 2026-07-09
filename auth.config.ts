import type { NextAuthConfig } from "next-auth";

import type { UserRole } from "@/src/generated/prisma/enums";

export default {
  secret: process.env.AUTH_SECRET,
  providers: [],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole;
        token.teamId = user.teamId;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole;
        session.user.teamId = token.teamId as string | null | undefined;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
