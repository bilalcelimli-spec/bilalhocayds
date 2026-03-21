"use client";

import Image from "next/image";
import { FileText, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/common/button";

type ExamMarketplacePurchaseProps = {
	examModuleId: string;
	title: string;
	examType: string;
	description?: string | null;
	coverImageUrl?: string | null;
	questionCount: number;
	durationMinutes: number;
	price: number | null;
	defaultFullName?: string;
	defaultEmail?: string;
	compact?: boolean;
};

function formatPrice(price: number | null) {
	if (price === null || price <= 0) {
		return "Satışa kapalı";
	}

	return new Intl.NumberFormat("tr-TR", {
		style: "currency",
		currency: "TRY",
		maximumFractionDigits: 0,
	}).format(price);
}

function resolvePaytrRedirectUrl(payment?: { redirectUrl?: string; token?: string }) {
	if (typeof payment?.redirectUrl === "string" && payment.redirectUrl.trim()) {
		return payment.redirectUrl;
	}

	if (typeof payment?.token === "string" && payment.token.trim()) {
		return `https://www.paytr.com/odeme/guvenli/${payment.token}`;
	}

	return null;
}

export function ExamMarketplacePurchase({
	examModuleId,
	title,
	examType,
	description,
	coverImageUrl,
	questionCount,
	durationMinutes,
	price,
	defaultFullName = "",
	defaultEmail = "",
	compact = false,
}: ExamMarketplacePurchaseProps) {
	const [fullName, setFullName] = useState(defaultFullName);
	const [email, setEmail] = useState(defaultEmail);
	const [phone, setPhone] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!price || price <= 0) {
			setError("Bu sınav şu anda satışa kapalı.");
			return;
		}

		setPending(true);
		setError("");

		const response = await fetch("/api/payment/exam", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ examModuleId, fullName, email, phone }),
		});

		const data = (await response.json()) as {
			error?: string;
			payment?: { redirectUrl?: string; token?: string; message?: string; status?: string };
		};

		setPending(false);
		if (!response.ok) {
			setError(data.error ?? "Sınav satışı başlatılamadı.");
			return;
		}

		const redirectUrl = resolvePaytrRedirectUrl(data.payment);
		if (redirectUrl) {
			window.location.href = redirectUrl;
			return;
		}

		setError(data.payment?.message ?? "Ödeme yönlendirmesi oluşturulamadı.");
	}

	return (
		<div className={`rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] ${compact ? "p-4" : "p-5"} shadow-[0_20px_70px_rgba(0,0,0,0.30)] backdrop-blur-xl`}>
			<div className="relative mb-4 overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.24),transparent_42%),linear-gradient(135deg,rgba(8,12,18,0.96),rgba(15,22,31,0.9),rgba(5,42,36,0.92))]">
				{coverImageUrl ? (
					<>
						<Image src={coverImageUrl} alt={title} fill className="object-cover opacity-55" sizes={compact ? "(max-width: 1280px) 100vw, 33vw" : "(max-width: 1280px) 100vw, 50vw"} unoptimized />
						<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.08),rgba(3,7,18,0.88))]" />
					</>
				) : (
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.25),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.22),transparent_24%),linear-gradient(135deg,rgba(3,7,18,0.55),rgba(5,46,22,0.3))]" />
				)}
				<div className="relative flex min-h-[190px] flex-col justify-between p-5">
					<div className="flex items-start justify-between gap-4">
						<div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">
							Exam Marketplace
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/8 p-3 text-white backdrop-blur-sm">
							<Sparkles size={18} />
						</div>
					</div>
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/90">{examType}</p>
						<h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
						<p className="mt-3 max-w-[28rem] text-sm leading-6 text-slate-200/90">
							{description ?? "Yayınlı sınav içeriği, süreli çözüm akışı ve ödeme sonrası erişim teslimi ile birlikte sunulur."}
						</p>
					</div>
				</div>
			</div>

			<div className="mb-4 flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">Exam Snapshot</p>
					<h3 className="mt-2 text-xl font-black text-white">{formatPrice(price)}</h3>
					<p className="mt-1 text-xs text-emerald-200">{examType} · {questionCount} soru · {durationMinutes} dk</p>
				</div>
				<div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right text-emerald-200">
					<p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">Teslim</p>
					<p className="mt-1 text-sm font-semibold text-white">Anında hesap erişimi</p>
				</div>
			</div>

			<div className="mb-4 grid gap-3 md:grid-cols-2">
				<div className="rounded-2xl border border-white/8 bg-black/20 p-3 text-xs text-slate-400">
					<div className="flex items-center gap-2 font-semibold text-slate-300"><FileText size={14} className="text-emerald-300" /> Paket özeti</div>
					<p className="mt-2">Sınav içeriği, soru setleri ve admin yayınlı açıklamalarla birlikte teslim edilir.</p>
				</div>
				<div className="rounded-2xl border border-white/8 bg-black/20 p-3 text-xs text-slate-400">
					<div className="flex items-center gap-2 font-semibold text-slate-300"><ShieldCheck size={14} className="text-emerald-300" /> Teslim</div>
					<p className="mt-2">Ödeme sonrası hesapta görünür ve e-posta ile bilgilendirme gönderilir.</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-2">
				<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ad Soyad" required className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500" />
				<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-posta" required className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500" />
				<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefon" required className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500" />

				{error ? <p className="text-xs text-red-300">{error}</p> : null}

				<Button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-[#d1fae5] via-[#6ee7b7] to-[#10b981] text-zinc-950 shadow-[0_20px_50px_rgba(16,185,129,0.28)] hover:brightness-105" disabled={pending || !price || price <= 0} size="lg">
					{pending ? "Yönlendiriliyor..." : `Sınavı Satın Al · ${formatPrice(price)}`}
				</Button>
			</form>
		</div>
	);
}