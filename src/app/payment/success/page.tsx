import { getTranslations } from "next-intl/server";

type PageProps = {
  searchParams?: Promise<{ merchant_oid?: string; mock?: string }>;
};

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const t = await getTranslations("payment");

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center px-6 py-16">
      <div className="w-full rounded-[32px] border border-emerald-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {t("successBadge")}
        </div>
        <h1 className="mt-4 text-4xl font-black text-slate-950">{t("successTitle")}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          {t("successText")}
        </p>
        <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          <p>{t("orderRef", { ref: params?.merchant_oid ?? "-" })}</p>
          <p className="mt-2">{t("status", { status: params?.mock === "1" ? t("mockApproval") : t("liveApproval") })}</p>
        </div>
      </div>
    </div>
  );
}
