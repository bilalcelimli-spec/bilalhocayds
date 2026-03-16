import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }

      if (!token.email) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: token.email },
        select: { id: true, role: true },
      });

      if (dbUser) {
        token.sub = dbUser.id;
        token.role = dbUser.role;

        if (dbUser.role === "STUDENT") {
          const now = new Date();
          const activeSubscription = await prisma.subscription.findFirst({
            where: {
              userId: dbUser.id,
              status: { in: ["ACTIVE", "TRIALING"] },
              startDate: { lte: now },
              OR: [{ endDate: null }, { endDate: { gte: now } }],
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, endDate: true },
          });

          token.hasActiveSubscription = Boolean(activeSubscription);
          token.subscriptionEndsAt = activeSubscription?.endDate?.toISOString() ?? null;
        } else {
          token.hasActiveSubscription = true;
          token.subscriptionEndsAt = null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? token.role : "STUDENT";
        session.user.hasActiveSubscription = Boolean(token.hasActiveSubscription);
        session.user.subscriptionEndsAt =
          typeof token.subscriptionEndsAt === "string" ? token.subscriptionEndsAt : null;
      }

      return session;
    },
  },
};
