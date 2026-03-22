import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      hasActiveSubscription?: boolean;
      hasStudentPlatformAccess?: boolean;
      subscriptionEndsAt?: string | null;
      hasReadingAccess?: boolean;
      hasGrammarAccess?: boolean;
      hasVocabAccess?: boolean;
      hasExamAccess?: boolean;
      hasLiveClassesAccess?: boolean;
      hasLiveRecordingsAccess?: boolean;
      hasContentLibraryAccess?: boolean;
      hasAIPlannerAccess?: boolean;
      accessibleExamIds?: string[];
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
    hasStudentPlatformAccess?: boolean;
    subscriptionEndsAt?: string | null;
    hasReadingAccess?: boolean;
    hasGrammarAccess?: boolean;
    hasVocabAccess?: boolean;
    hasExamAccess?: boolean;
    hasLiveClassesAccess?: boolean;
    hasLiveRecordingsAccess?: boolean;
    hasContentLibraryAccess?: boolean;
    hasAIPlannerAccess?: boolean;
    accessibleExamIds?: string[];
  }
}
