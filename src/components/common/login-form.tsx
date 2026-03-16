"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Email veya şifre hatalı.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="******"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}