type PageProps = {
  searchParams?: Promise<{ merchant_oid?: string }>;
};

export default async function PaymentFailurePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center px-6 py-16">
      <div className="w-full rounded-[32px] border border-red-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          Ödeme Tamamlanamadı
        </div>
        <h1 className="mt-4 text-4xl font-black text-slate-950">İşlem başarısız oldu</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Ödeme tamamlanamadı veya iptal edildi. Bilgilerini kontrol ederek tekrar deneyebilirsin.
        </p>
        <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          <p>Sipariş referansı: {params?.merchant_oid ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}
