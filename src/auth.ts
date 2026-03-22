import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";

const TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

function hasAnyManualStudentAccess(input: {
  hasReadingAccess: boolean;
  hasGrammarAccess: boolean;
  hasVocabAccess: boolean;
  hasExamAccess: boolean;
  hasLiveClassesAccess: boolean;
  hasLiveRecordingsAccess: boolean;
  hasContentLibraryAccess: boolean;
  hasAIPlannerAccess: boolean;
  accessibleExamIds: string[];
}) {
  return (
    input.hasReadingAccess ||
    input.hasGrammarAccess ||
    input.hasVocabAccess ||
    input.hasExamAccess ||
    input.hasLiveClassesAccess ||
    input.hasLiveRecordingsAccess ||
    input.hasContentLibraryAccess ||
    input.hasAIPlannerAccess ||
    input.accessibleExamIds.length > 0
  );
}

async function buildTokenClaims(userId: string, role: string) {
  if (role !== "STUDENT") {
    return {
      role,
      hasActiveSubscription: true,
      hasStudentPlatformAccess: true,
      subscriptionEndsAt: null,
      hasReadingAccess: true,
      hasGrammarAccess: true,
      hasVocabAccess: true,
      hasExamAccess: true,
      hasLiveClassesAccess: true,
      hasLiveRecordingsAccess: true,
      hasContentLibraryAccess: true,
      hasAIPlannerAccess: true,
      accessibleExamIds: [],
    };
  }

  const now = new Date();
  const [activeSubscription, manualFeatureAccess, manualExamAccesses] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        endDate: true,
        plan: {
          select: {
            includesReading: true,
            includesGrammar: true,
            includesVocab: true,
            includesExam: true,
            includesLiveClass: true,
            includesAIPlanner: true,
            examModules: {
              select: {
                examModuleId: true,
              },
            },
          },
        },
      },
    } as never) as Promise<{
      id: string;
      endDate: Date | null;
      plan: {
        includesReading: boolean;
        includesGrammar: boolean;
        includesVocab: boolean;
        includesExam: boolean;
        includesLiveClass: boolean;
        includesAIPlanner: boolean;
        examModules: Array<{ examModuleId: string }>;
      };
    } | null>,
    prisma.studentFeatureAccess.findUnique({
      where: { userId },
      select: {
        hasReadingAccess: true,
        hasGrammarAccess: true,
        hasVocabAccess: true,
        hasExamAccess: true,
        hasLiveClassesAccess: true,
        hasLiveRecordingsAccess: true,
        hasContentLibraryAccess: true,
        hasAIPlannerAccess: true,
      },
    }),
    prisma.studentFeatureExamAccess.findMany({
      where: { userId },
      select: { examModuleId: true },
    }),
  ]);

  const hasManualFeatureAccess = Boolean(manualFeatureAccess);
  const manualAccessibleExamIds = manualExamAccesses.map(
    (item: { examModuleId: string }) => item.examModuleId,
  );
  const subscriptionAccessibleExamIds =
    activeSubscription?.plan.examModules.map((item: { examModuleId: string }) => item.examModuleId) ?? [];
  const effectiveStudentAccess = hasManualFeatureAccess
    ? {
        hasReadingAccess: Boolean(manualFeatureAccess?.hasReadingAccess),
        hasGrammarAccess: Boolean(manualFeatureAccess?.hasGrammarAccess),
        hasVocabAccess: Boolean(manualFeatureAccess?.hasVocabAccess),
        hasExamAccess: Boolean(manualFeatureAccess?.hasExamAccess),
        hasLiveClassesAccess: Boolean(manualFeatureAccess?.hasLiveClassesAccess),
        hasLiveRecordingsAccess: Boolean(manualFeatureAccess?.hasLiveRecordingsAccess),
        hasContentLibraryAccess: Boolean(manualFeatureAccess?.hasContentLibraryAccess),
        hasAIPlannerAccess: Boolean(manualFeatureAccess?.hasAIPlannerAccess),
        accessibleExamIds: manualAccessibleExamIds,
      }
    : {
        hasReadingAccess: Boolean(activeSubscription?.plan.includesReading),
        hasGrammarAccess: Boolean(activeSubscription?.plan.includesGrammar),
        hasVocabAccess: Boolean(activeSubscription?.plan.includesVocab),
        hasExamAccess: Boolean(activeSubscription?.plan.includesExam),
        hasLiveClassesAccess: Boolean(activeSubscription?.plan.includesLiveClass),
        hasLiveRecordingsAccess: Boolean(activeSubscription?.plan.includesLiveClass),
        hasContentLibraryAccess: Boolean(activeSubscription),
        hasAIPlannerAccess: Boolean(activeSubscription?.plan.includesAIPlanner),
        accessibleExamIds: subscriptionAccessibleExamIds,
      };
  const hasStudentPlatformAccess = hasManualFeatureAccess
    ? hasAnyManualStudentAccess(effectiveStudentAccess)
    : Boolean(activeSubscription);

  return {
    role,
    hasActiveSubscription: Boolean(activeSubscription),
    hasStudentPlatformAccess,
    subscriptionEndsAt: activeSubscription?.endDate?.toISOString() ?? null,
    hasReadingAccess: effectiveStudentAccess.hasReadingAccess,
    hasGrammarAccess: effectiveStudentAccess.hasGrammarAccess,
    hasVocabAccess: effectiveStudentAccess.hasVocabAccess,
    hasExamAccess: effectiveStudentAccess.hasExamAccess,
    hasLiveClassesAccess: effectiveStudentAccess.hasLiveClassesAccess,
    hasLiveRecordingsAccess: effectiveStudentAccess.hasLiveRecordingsAccess,
    hasContentLibraryAccess: effectiveStudentAccess.hasContentLibraryAccess,
    hasAIPlannerAccess: effectiveStudentAccess.hasAIPlannerAccess,
    accessibleExamIds: effectiveStudentAccess.accessibleExamIds,
  };
}

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
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true,
          },
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
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        const userRole = (user as { role?: unknown }).role;
        token.role = typeof userRole === "string" ? userRole : token.role;
      }

      if (!token.sub) {
        return token;
      }

      const now = Date.now();
      const shouldRefreshClaims =
        Boolean(user) ||
        typeof token.accessHydratedAt !== "number" ||
        now - token.accessHydratedAt > TOKEN_REFRESH_INTERVAL_MS ||
        typeof token.role !== "string";

      if (!shouldRefreshClaims) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { id: true, role: true },
      });

      if (dbUser) {
        token.sub = dbUser.id;
        const claims = await buildTokenClaims(dbUser.id, dbUser.role);
        token.role = claims.role;
        token.hasActiveSubscription = claims.hasActiveSubscription;
        token.hasStudentPlatformAccess = claims.hasStudentPlatformAccess;
        token.subscriptionEndsAt = claims.subscriptionEndsAt;
        token.hasReadingAccess = claims.hasReadingAccess;
        token.hasGrammarAccess = claims.hasGrammarAccess;
        token.hasVocabAccess = claims.hasVocabAccess;
        token.hasExamAccess = claims.hasExamAccess;
        token.hasLiveClassesAccess = claims.hasLiveClassesAccess;
        token.hasLiveRecordingsAccess = claims.hasLiveRecordingsAccess;
        token.hasContentLibraryAccess = claims.hasContentLibraryAccess;
        token.hasAIPlannerAccess = claims.hasAIPlannerAccess;
        token.accessibleExamIds = claims.accessibleExamIds;
        token.accessHydratedAt = now;
      } else {
        token.hasActiveSubscription = false;
        token.hasStudentPlatformAccess = false;
        token.subscriptionEndsAt = null;
        token.hasReadingAccess = false;
        token.hasGrammarAccess = false;
        token.hasVocabAccess = false;
        token.hasExamAccess = false;
        token.hasLiveClassesAccess = false;
        token.hasLiveRecordingsAccess = false;
        token.hasContentLibraryAccess = false;
        token.hasAIPlannerAccess = false;
        token.accessibleExamIds = [];
        token.accessHydratedAt = now;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? token.role : "STUDENT";
        session.user.hasActiveSubscription = Boolean(token.hasActiveSubscription);
        session.user.hasStudentPlatformAccess = Boolean(token.hasStudentPlatformAccess);
        session.user.subscriptionEndsAt =
          typeof token.subscriptionEndsAt === "string" ? token.subscriptionEndsAt : null;
        session.user.hasReadingAccess = Boolean(token.hasReadingAccess);
        session.user.hasGrammarAccess = Boolean(token.hasGrammarAccess);
        session.user.hasVocabAccess = Boolean(token.hasVocabAccess);
        session.user.hasExamAccess = Boolean(token.hasExamAccess);
        session.user.hasLiveClassesAccess = Boolean(token.hasLiveClassesAccess);
        session.user.hasLiveRecordingsAccess = Boolean(token.hasLiveRecordingsAccess);
        session.user.hasContentLibraryAccess = Boolean(token.hasContentLibraryAccess);
        session.user.hasAIPlannerAccess = Boolean(token.hasAIPlannerAccess);
        session.user.accessibleExamIds = Array.isArray(token.accessibleExamIds)
          ? token.accessibleExamIds.filter((value): value is string => typeof value === "string")
          : [];
      }

      return session;
    },
  },
};
