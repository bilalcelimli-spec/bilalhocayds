import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      hasActiveSubscription?: boolean;
      subscriptionEndsAt?: string | null;
      hasReadingAccess?: boolean;
      hasGrammarAccess?: boolean;
      hasVocabAccess?: boolean;
      hasExamAccess?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    hasActiveSubscription?: boolean;
    subscriptionEndsAt?: string | null;
    hasReadingAccess?: boolean;
    hasGrammarAccess?: boolean;
    hasVocabAccess?: boolean;
    hasExamAccess?: boolean;
  }
}