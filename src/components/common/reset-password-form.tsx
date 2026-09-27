"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type ValidationState = "checking" | "valid" | "invalid";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const t = useTranslations("resetPassword");
  const tErrors = useTranslations("apiErrors");
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>(token ? "checking" : "invalid");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationState("invalid");
      setError(t("missingLink"));
      return;
    }

    let cancelled = false;

    async function validateToken() {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = (await response.json()) as { valid?: boolean; error?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.valid) {
          setValidationState("invalid");
          setError(data.error ?? t("invalidOrExpired"));
          return;
        }

        setValidationState("valid");
        setError("");
      } catch {
        if (!cancelled) {
          setValidationState("invalid");
          setError(t("verifyFailed"));
        }
      }
    }

    void validateToken();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? t("updateFailed"));
        return;
      }

      setSuccess(data.message ?? t("updated"));
      setPassword("");
      setConfirmPassword("");
      setValidationState("invalid");
    } catch {
      setError(tErrors("network"));
    } finally {
      setPending(false);
    }
  }

  if (validationState === "checking") {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-slate-300">
        {t("verifying")}
      </div>
    );
  }

  if (validationState === "invalid" && !success) {
    return (
      <div className="space-y-5">
        <div className="rounded-[28px] border border-red-400/20 bg-red-400/10 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-red-300">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">{t("invalidTitle")}</p>
              <p className="mt-2 text-sm leading-7 text-red-100/85">{error || t("invalidOrExpired")}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/forgot-password" className="rounded-[18px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/15">
            {t("requestNew")}
          </Link>
          <Link href="/login" className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.05]">
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">{t("newPassword")}</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <KeyRound size={16} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-[22px] border border-white/12 bg-white/[0.04] px-12 py-3.5 pr-16 text-white outline-none placeholder:text-slate-500 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder={t("newPasswordPlaceholder")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:text-white"
            tabIndex={-1}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">{t("confirmPassword")}</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <KeyRound size={16} />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-[22px] border border-white/12 bg-white/[0.04] px-12 py-3.5 pr-16 text-white outline-none placeholder:text-slate-500 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder={t("confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:text-white"
            tabIndex={-1}
            aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
          >
            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">{error}</p>
      ) : null}

      {success ? (
        <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">{t("updatedTitle")}</p>
              <p className="mt-2 text-sm leading-7 text-emerald-100/85">{success}</p>
            </div>
          </div>
          <Link href="/login" className="mt-5 inline-flex rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
            {t("login")}
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold uppercase tracking-[0.18em] text-amber-300">{t("infoTitle")}</span>
              <span className="text-slate-500">{t("infoTag")}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {t("infoText")}
            </p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-[22px] bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] px-5 py-3.5 font-bold text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.32)] transition hover:brightness-105 disabled:opacity-50"
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        </>
      )}
    </form>
  );
}