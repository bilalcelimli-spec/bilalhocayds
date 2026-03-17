"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, interestTags: [], priorityTags: [] }),
    });

    const data = await res.json() as { error?: string; message?: string };
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Kayıt sırasında hata oluştu.");
      return;
    }

    setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsun...");
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Ad Soyad</label>
        <input
          type="text"
          required
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          placeholder="Ad Soyad"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">E-posta</label>
        <input
          type="email"
          required
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          placeholder="ornek@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Şifre</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 pr-12 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="En az 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            tabIndex={-1}
          >
            {showPassword ? "Gizle" : "Göster"}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Şifre Tekrar</label>
        <input
          type={showPassword ? "text" : "password"}
          required
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          placeholder="Şifreni tekrar gir"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-green-400">{success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-amber-400 px-5 py-3 font-bold text-zinc-900 shadow-[0_4px_20px_rgba(212,168,67,0.3)] transition hover:bg-amber-300 disabled:opacity-50"
      >
        {pending ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
      </button>
    </form>
  );
}


const interestOptions = [
  { key: "technology", label: "Teknoloji" },
  { key: "economy", label: "Ekonomi" },
  { key: "science", label: "Bilim" },
  { key: "health", label: "Sağlık" },
  { key: "education", label: "Eğitim" },
  { key: "environment", label: "Çevre" },
  { key: "culture", label: "Kültür" },
  { key: "sports", label: "Spor" },
];

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [interestTags, setInterestTags] = useState<string[]>(["technology", "education"]);
  const [priorityTags, setPriorityTags] = useState<string[]>(["technology"]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  function toggleInterest(tag: string) {
    setInterestTags((current) => {
      if (current.includes(tag)) {
        setPriorityTags((priority) => priority.filter((item) => item !== tag));
        return current.filter((item) => item !== tag);
      }
      return [...current, tag];
    });
  }

  function togglePriority(tag: string) {
    if (!interestTags.includes(tag)) {
      return;
    }

    setPriorityTags((current) => {
      if (current.includes(tag)) {
        return current.filter((item) => item !== tag);
      }
      if (current.length >= 2) {
        return [current[1], tag];
      }
      return [...current, tag];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (interestTags.length === 0) {
      setError("En az bir ilgi alanı seçmelisin.");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, interestTags, priorityTags }),
    });

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error || "Kayıt sırasında hata oluştu.");
      return;
    }

    setSuccess("Kayıt başarılı. Giriş sayfasına yönlendiriliyorsun...");
    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Ad Soyad
        </label>
        <input
          type="text"
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-white/45"
          placeholder="Bilal Hoca"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Email
        </label>
        <input
          type="email"
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-white/45"
          placeholder="ornek@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Şifre
        </label>
        <input
          type="password"
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-white/45"
          placeholder="En az 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          İlgi Alanı Anketi
        </label>
        <p className="mb-3 text-xs text-slate-400">
          Reading modülünde günlük haber seçimi bu alanlara göre yapılır.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {interestOptions.map((option) => {
            const checked = interestTags.includes(option.key);
            return (
              <label
                key={option.key}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                    : "border-white/15 bg-white/5 text-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleInterest(option.key)}
                  className="h-4 w-4 accent-amber-400"
                />
                {option.label}
              </label>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Oncelikli Alanlar (En Fazla 2)
          </p>
          <div className="flex flex-wrap gap-2">
            {interestTags.map((tag) => {
              const selected = priorityTags.includes(tag);
              const label = interestOptions.find((item) => item.key === tag)?.label ?? tag;

              return (
                <button
                  key={`priority-${tag}`}
                  type="button"
                  onClick={() => togglePriority(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    selected
                      ? "border-amber-400/70 bg-amber-400/15 text-amber-200"
                      : "border-white/20 bg-white/5 text-slate-300 hover:border-white/35"
                  }`}
                >
                  {selected ? "★ " : ""}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-green-400">{success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
      </button>
    </form>
  );
}