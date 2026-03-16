"use client";
import { useState, ChangeEvent, FormEvent } from "react";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  monthlyPrice?: number | null;
  yearlyPrice?: number | null;
  includesLiveClass?: boolean;
  includesAIPlanner?: boolean;
  includesReading?: boolean;
  includesGrammar?: boolean;
  includesVocab?: boolean;
  isActive?: boolean;
};

type AdminPlansProps = {
  initialPlans: Plan[];
};

type PlanFormState = {
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  includesLiveClass: boolean;
  includesAIPlanner: boolean;
  includesReading: boolean;
  includesGrammar: boolean;
  includesVocab: boolean;
  isActive: boolean;
};

const emptyForm = (): PlanFormState => ({
  name: "",
  slug: "",
  description: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  includesLiveClass: false,
  includesAIPlanner: false,
  includesReading: true,
  includesGrammar: true,
  includesVocab: true,
  isActive: true,
});

function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined || price <= 0) {
    return "Tanımsız";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminPlans({ initialPlans }: AdminPlansProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [form, setForm] = useState<PlanFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function refreshPlans() {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data: Plan[]) => setPlans(data));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const target = e.target;
    const { name, value } = target;
    const isCheckbox = target instanceof HTMLInputElement && target.type === "checkbox";
    const isNumberInput = target instanceof HTMLInputElement && target.type === "number";

    setForm((prev) => ({
      ...prev,
      [name]: isCheckbox
        ? target.checked
        : isNumberInput
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPendingAction(editingId ?? "create");
    const method = editingId ? "PUT" : "POST";
    const res = await fetch("/api/admin/plans", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
    });
    if (res.ok) {
      setEditingId(null);
      setForm(emptyForm());
      await refreshPlans();
    }
    setPendingAction(null);
  }

  function handleEdit(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name || "",
      slug: plan.slug || "",
      description: plan.description || "",
      monthlyPrice: plan.monthlyPrice ?? 0,
      yearlyPrice: plan.yearlyPrice ?? 0,
      includesLiveClass: plan.includesLiveClass ?? false,
      includesAIPlanner: plan.includesAIPlanner ?? false,
      includesReading: plan.includesReading ?? true,
      includesGrammar: plan.includesGrammar ?? true,
      includesVocab: plan.includesVocab ?? true,
      isActive: plan.isActive ?? true,
    });
  }

  async function handleToggleActive(plan: Plan) {
    setPendingAction(plan.id);
    await fetch("/api/admin/plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...plan,
        isActive: !(plan.isActive ?? true),
      }),
    });
    await refreshPlans();
    setPendingAction(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this plan?")) return;
    setPendingAction(id);
    await fetch("/api/admin/plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refreshPlans();
    setPendingAction(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Paket Yönetimi</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Admin paket fiyatlarını belirleyebilir, içerikleri değiştirebilir ve paketleri açıp kapatabilir.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-300">
            {plans.length} paket
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Paket adı"
              required
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="Slug"
              required
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <input
              name="monthlyPrice"
              type="number"
              min={0}
              value={form.monthlyPrice}
              onChange={handleChange}
              placeholder="Aylık fiyat"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <input
              name="yearlyPrice"
              type="number"
              min={0}
              value={form.yearlyPrice}
              onChange={handleChange}
              placeholder="Yıllık fiyat"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Paket açıklaması"
              rows={4}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white md:col-span-2"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Paket içeriği</p>
            <div className="mt-3 grid gap-2 text-sm text-zinc-300">
              <label><input className="mr-2" name="includesVocab" type="checkbox" checked={form.includesVocab} onChange={handleChange} />Vocabulary modülü</label>
              <label><input className="mr-2" name="includesReading" type="checkbox" checked={form.includesReading} onChange={handleChange} />Reading modülü</label>
              <label><input className="mr-2" name="includesGrammar" type="checkbox" checked={form.includesGrammar} onChange={handleChange} />Grammar modülü</label>
              <label><input className="mr-2" name="includesAIPlanner" type="checkbox" checked={form.includesAIPlanner} onChange={handleChange} />AI çalışma planı</label>
              <label><input className="mr-2" name="includesLiveClass" type="checkbox" checked={form.includesLiveClass} onChange={handleChange} />Canlı ders erişimi</label>
              <label><input className="mr-2" name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} />Paket aktif</label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pendingAction === (editingId ?? "create")}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
              >
                {editingId ? "Paketi Güncelle" : "Yeni Paket Oluştur"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300"
                >
                  İptal
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const features = [
            plan.includesVocab && "Vocabulary",
            plan.includesReading && "Reading",
            plan.includesGrammar && "Grammar",
            plan.includesAIPlanner && "AI planı",
            plan.includesLiveClass && "Canlı ders",
          ].filter((item): item is string => Boolean(item));

          return (
            <div key={plan.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-zinc-500">/{plan.slug}</p>
                </div>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${
                    plan.isActive
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-zinc-500/15 text-zinc-300"
                  }`}
                >
                  {plan.isActive ? "Açık" : "Kapalı"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-zinc-500">Aylık fiyat</p>
                  <p className="mt-1 font-semibold text-white">{formatPrice(plan.monthlyPrice)}</p>
                </div>
                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-zinc-500">Yıllık fiyat</p>
                  <p className="mt-1 font-semibold text-white">{formatPrice(plan.yearlyPrice)}</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-400">
                {plan.description || "Bu paket için açıklama eklenmemiş."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {features.map((feature) => (
                  <span key={feature} className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                    {feature}
                  </span>
                ))}
                {features.length === 0 ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-400">
                    İçerik seçilmemiş
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(plan)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(plan)}
                  disabled={pendingAction === plan.id}
                  className="rounded-xl border border-blue-500/20 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/10 disabled:opacity-60"
                >
                  {plan.isActive ? "Kapat" : "Aç"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  disabled={pendingAction === plan.id}
                  className="rounded-xl border border-red-500/20 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                >
                  Sil
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
