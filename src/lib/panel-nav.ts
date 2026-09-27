import { getTranslations } from "next-intl/server";

type NavUser = {
  hasLiveRecordingsAccess?: boolean;
  hasContentLibraryAccess?: boolean;
  hasVocabAccess?: boolean;
  hasReadingAccess?: boolean;
  hasGrammarAccess?: boolean;
  hasLiveClassesAccess?: boolean;
};

type NavItem = { label: string; href: string };

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

/** Öğrenci panelindeki sol menü; erişimi olmayan modüller gizlenir. */
export async function getStudentNavItems(user: NavUser): Promise<NavItem[]> {
  const t = await getTranslations("panelNav");
  return [
    { label: t("dashboard"), href: "/dashboard" },
    { label: t("orders"), href: "/dashboard/orders" },
    user.hasLiveRecordingsAccess ? { label: t("recordings"), href: "/dashboard/live-recordings" } : null,
    user.hasContentLibraryAccess ? { label: t("library"), href: "/dashboard/content-library" } : null,
    user.hasVocabAccess ? { label: t("vocabulary"), href: "/vocabulary" } : null,
    user.hasReadingAccess ? { label: t("reading"), href: "/reading" } : null,
    user.hasGrammarAccess ? { label: t("grammar"), href: "/grammar" } : null,
    { label: t("exam"), href: "/exam" },
    user.hasLiveClassesAccess ? { label: t("liveClasses"), href: "/live-classes" } : null,
    { label: t("pricing"), href: "/pricing" },
  ].filter(isDefined);
}

/** Öğretmen (Bilal Hoca) panelindeki sol menü. */
export async function getTeacherNavItems(): Promise<NavItem[]> {
  const t = await getTranslations("panelNav");
  return [
    { label: t("dashboard"), href: "/teacher" },
    { label: t("library"), href: "/dashboard/content-library" },
    { label: t("readingModule"), href: "/reading" },
    { label: t("grammarModule"), href: "/grammar" },
    { label: t("vocabularyModule"), href: "/vocabulary" },
    { label: t("examModule"), href: "/exam" },
    { label: t("liveClasses"), href: "/live-classes" },
    { label: t("adminPanel"), href: "/admin" },
  ];
}

/** Sınav akışı sayfalarındaki kısa menü. */
export async function getExamFlowNavItems(): Promise<NavItem[]> {
  const t = await getTranslations("panelNav");
  return [
    { label: t("dashboard"), href: "/dashboard" },
    { label: t("exam"), href: "/exam" },
  ];
}

export async function getPanelRoleLabel(role: string) {
  const t = await getTranslations("panelNav");
  return role === "TEACHER" ? t("teacherRole") : t("studentRole");
}
