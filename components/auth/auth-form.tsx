"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type FormMode = "login" | "register";

const initialFields = {
  name: "",
  email: "",
  password: "",
};

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>("login");
  const [fields, setFields] = useState(initialFields);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      if (mode === "register") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fields),
        });

        const registerData = (await registerResponse.json().catch(() => null)) as { message?: string } | null;

        if (!registerResponse.ok) {
          setMessage(registerData?.message ?? "Kayit tamamlanamadi.");
          return;
        }
      }

      const signInResult = await signIn("credentials", {
        email: fields.email,
        password: fields.password,
        redirect: false,
        callbackUrl: "/",
      });

      if (!signInResult || signInResult.error) {
        setMessage("Giris basarisiz. Bilgilerini kontrol et.");
        return;
      }

      router.push(signInResult.url ?? "/");
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-stone-800 bg-stone-900/90 p-6">
      <div className="flex gap-3 rounded-full border border-stone-800 bg-stone-950 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setMessage(null);
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "login" ? "bg-amber-400 text-stone-950" : "text-stone-300 hover:bg-stone-800"
          }`}
        >
          Giris yap
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setMessage(null);
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "register" ? "bg-amber-400 text-stone-950" : "text-stone-300 hover:bg-stone-800"
          }`}
        >
          Kayit ol
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <label className="block space-y-2">
            <span className="text-sm text-stone-300">Ad soyad</span>
            <input
              required
              value={fields.name}
              onChange={(event) => setFields((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 outline-none transition focus:border-amber-400"
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm text-stone-300">E-posta</span>
          <input
            required
            type="email"
            value={fields.email}
            onChange={(event) => setFields((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 outline-none transition focus:border-amber-400"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-stone-300">Sifre</span>
          <input
            required
            minLength={8}
            type="password"
            value={fields.password}
            onChange={(event) => setFields((current) => ({ ...current, password: event.target.value }))}
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 outline-none transition focus:border-amber-400"
          />
        </label>

        {message ? <p className="text-sm text-rose-300">{message}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-amber-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Isleniyor..." : mode === "login" ? "Giris yap" : "Kayit ol ve devam et"}
        </button>
      </form>
    </section>
  );
}