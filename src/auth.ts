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
          const [activeSubscription, manualFeatureAccess, manualExamAccesses] = await Promise.all([
            prisma.subscription.findFirst({
              where: {
                userId: dbUser.id,
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
              where: { userId: dbUser.id },
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
              where: { userId: dbUser.id },
              select: { examModuleId: true },
            }),
          ]);

          const hasManualFeatureAccess = Boolean(manualFeatureAccess);
          const manualAccessibleExamIds = manualExamAccesses.map(
            (item: { examModuleId: string }) => item.examModuleId,
          );
          const subscriptionAccessibleExamIds = activeSubscription?.plan.examModules.map((item: { examModuleId: string }) => item.examModuleId) ?? [];
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

          token.hasActiveSubscription = Boolean(activeSubscription);
          token.hasStudentPlatformAccess = hasStudentPlatformAccess;
          token.subscriptionEndsAt = activeSubscription?.endDate?.toISOString() ?? null;
          token.hasReadingAccess = effectiveStudentAccess.hasReadingAccess;
          token.hasGrammarAccess = effectiveStudentAccess.hasGrammarAccess;
          token.hasVocabAccess = effectiveStudentAccess.hasVocabAccess;
          token.hasExamAccess = effectiveStudentAccess.hasExamAccess;
          token.hasLiveClassesAccess = effectiveStudentAccess.hasLiveClassesAccess;
          token.hasLiveRecordingsAccess = effectiveStudentAccess.hasLiveRecordingsAccess;
          token.hasContentLibraryAccess = effectiveStudentAccess.hasContentLibraryAccess;
          token.hasAIPlannerAccess = effectiveStudentAccess.hasAIPlannerAccess;
          token.accessibleExamIds = effectiveStudentAccess.accessibleExamIds;
        } else {
          token.hasActiveSubscription = true;
          token.hasStudentPlatformAccess = true;
          token.subscriptionEndsAt = null;
          token.hasReadingAccess = true;
          token.hasGrammarAccess = true;
          token.hasVocabAccess = true;
          token.hasExamAccess = true;
          token.hasLiveClassesAccess = true;
          token.hasLiveRecordingsAccess = true;
          token.hasContentLibraryAccess = true;
          token.hasAIPlannerAccess = true;
          token.accessibleExamIds = [];
        }
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
