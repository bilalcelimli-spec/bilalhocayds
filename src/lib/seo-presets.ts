export type SeoPagePreset = {
  key: string;
  label: string;
  path: string;
  group: "public" | "auth" | "student" | "teacher" | "admin";
  description: string;
  defaultSchemaType: string;
};

export const SEO_PAGE_PRESETS: SeoPagePreset[] = [
  {
    key: "home",
    label: "Ana Sayfa",
    path: "/",
    group: "public",
    description: "Ana landing sayfası ve marka vitrini.",
    defaultSchemaType: "WebSite",
  },
  {
    key: "pricing",
    label: "Fiyatlandırma",
    path: "/pricing",
    group: "public",
    description: "Planlar, fiyatlar ve dönüşüm odaklı satış sayfası.",
    defaultSchemaType: "Product",
  },
  {
    key: "live-classes",
    label: "Canlı Dersler",
    path: "/live-classes",
    group: "public",
    description: "Haftalık canlı ders takvimi ve satın alma akışı.",
    defaultSchemaType: "Course",
  },
  {
    key: "vocabulary",
    label: "Vocabulary Modülü",
    path: "/vocabulary",
    group: "student",
    description: "Kelime öğrenme ve günlük tekrar modülü.",
    defaultSchemaType: "WebPage",
  },
  {
    key: "reading",
    label: "Reading Modülü",
    path: "/reading",
    group: "student",
    description: "Okuma parçaları ve analiz ekranı.",
    defaultSchemaType: "Article",
  },
  {
    key: "grammar",
    label: "Grammar Modülü",
    path: "/grammar",
    group: "student",
    description: "Gramer konu anlatımı ve soru çözüm ekranı.",
    defaultSchemaType: "DefinedTermSet",
  },
  {
    key: "dashboard",
    label: "Öğrenci Dashboard",
    path: "/dashboard",
    group: "student",
    description: "Öğrenci paneli, görevler ve ilerleme görünümü.",
    defaultSchemaType: "ProfilePage",
  },
  {
    key: "dashboard-live-recordings",
    label: "Canlı Ders Kayıtları",
    path: "/dashboard/live-recordings",
    group: "student",
    description: "Geçmiş canlı ders kayıtlarının izlendiği alan.",
    defaultSchemaType: "VideoGallery",
  },
  {
    key: "login",
    label: "Giriş Yap",
    path: "/login",
    group: "auth",
    description: "Kullanıcı giriş ekranı.",
    defaultSchemaType: "WebPage",
  },
  {
    key: "register",
    label: "Kayıt Ol",
    path: "/register",
    group: "auth",
    description: "Yeni kullanıcı kayıt ekranı.",
    defaultSchemaType: "WebPage",
  },
  {
    key: "teacher",
    label: "Öğretmen Paneli",
    path: "/teacher",
    group: "teacher",
    description: "Öğretmen operasyon ve içerik yönetim ekranı.",
    defaultSchemaType: "ProfilePage",
  },
  {
    key: "admin",
    label: "Admin Dashboard",
    path: "/admin",
    group: "admin",
    description: "Yönetim paneli ana ekranı.",
    defaultSchemaType: "WebPage",
  },
];

export const SEO_GROUP_LABELS: Record<SeoPagePreset["group"], string> = {
  public: "Public",
  auth: "Auth",
  student: "Öğrenci",
  teacher: "Öğretmen",
  admin: "Admin",
};

export function buildSeoPageUrl(siteUrl: string, pagePath: string) {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  if (!pagePath || pagePath === "/") {
    return normalizedSiteUrl;
  }
  return `${normalizedSiteUrl}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`;
}
