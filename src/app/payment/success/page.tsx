type PageProps = {
  searchParams?: Promise<{ merchant_oid?: string; mock?: string }>;
};

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center px-6 py-16">
      <div className="w-full rounded-[32px] border border-emerald-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Ödeme Başarılı
        </div>
        <h1 className="mt-4 text-4xl font-black text-slate-950">Satış süreci başarıyla alındı</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Ödeme ve abonelik akışın sisteme işlendi. Erişim ve satış takibi kısa süre içinde güncellenecektir.
        </p>
        <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          <p>Sipariş referansı: {params?.merchant_oid ?? "-"}</p>
          <p className="mt-2">Durum: {params?.mock === "1" ? "Mock ödeme onayı" : "Canlı ödeme onayı"}</p>
        </div>
      </div>
    </div>
  );
}
