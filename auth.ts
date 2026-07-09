import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import authConfig from "@/auth.config";
import { db } from "@/src/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: parsedCredentials.data.email.toLowerCase() },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            teamId: true,
            active: true,
            passwordHash: true,
          },
        });

        if (!user?.active || !user.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(parsedCredentials.data.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
        };
      },
    }),
  ],
});
