import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "@/src/auth";
import PricingCheckout from "@/src/components/payment/pricing-checkout";
import { SessionBanner } from "@/src/components/common/session-banner";

function reorderPopularToMiddle<T extends { slug: string }>(items: T[]): T[] {
	if (items.length !== 3) return items;
	const idx = items.findIndex((p) => p.slug === "premium");
	if (idx === 1 || idx === -1) return items;
	const reordered = [...items];
	const [popular] = reordered.splice(idx, 1);
	reordered.splice(1, 0, popular);
	return reordered;
}

export default async function PricingPage() {
	const [session, rawPlans] = await Promise.all([
		getServerSession(authOptions),
		prisma.plan.findMany({
			where: { isActive: true },
			orderBy: { monthlyPrice: "asc" },
			select: {
				id: true,
				name: true,
				slug: true,
				description: true,
				monthlyPrice: true,
				yearlyPrice: true,
				includesLiveClass: true,
				includesAIPlanner: true,
				includesReading: true,
				includesGrammar: true,
				includesVocab: true,
			},
		}),
	]);

	const plans = reorderPopularToMiddle(rawPlans);
	const isLoggedInStudent = session?.user?.role === "STUDENT";

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			{isLoggedInStudent && (
				<SessionBanner
					userName={session.user.name ?? ""}
					userEmail={session.user.email ?? ""}
				/>
			)}
			<div className="mx-auto max-w-3xl text-center">
				<div className="mx-auto mb-5 h-px w-20 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
				<span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
					Üyelik Planları
				</span>
				<h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
					Sana uygun YDS çalışma planını seç
				</h1>
				<p className="mt-4 text-lg leading-8 text-slate-400">
					Vocabulary, reading, grammar, AI planner ve canlı ders erişimini ihtiyacına
					göre seç. Tüm planlar sınav odaklı içeriklerle hazırlandı.
				</p>
				<p className="mt-3 text-sm leading-7 text-amber-300/90">
					Canlı ders içeren paketlerde program haftada 4 saat olarak planlanır. Dilersen tek tek canlı ders satın alma seçeneğini de kullanabilirsin.
				</p>
			</div>

			<PricingCheckout plans={plans} />

			<div className="mt-12 rounded-3xl border border-white/8 bg-zinc-900/60 p-8 backdrop-blur-xl">
				<div className="grid gap-6 md:grid-cols-3">
					<div>
						<div className="mb-3 h-0.5 w-8 rounded-full bg-amber-400/60" />
						<h3 className="text-lg font-bold text-white">Tüm planlarda</h3>
						<p className="mt-2 text-sm leading-7 text-slate-400">
							Sınav odaklı içerik yapısı, panel takibi ve düzenli güncellenen çalışma
							akışı bulunur.
						</p>
					</div>
					<div>
						<div className="mb-3 h-0.5 w-8 rounded-full bg-amber-400/60" />
						<h3 className="text-lg font-bold text-white">Esnek geçiş</h3>
						<p className="mt-2 text-sm leading-7 text-slate-400">
							İhtiyacın değiştikçe planını daha kapsamlı bir pakete taşıyabilirsin.
						</p>
					</div>
					<div>
						<div className="mb-3 h-0.5 w-8 rounded-full bg-amber-400/60" />
						<h3 className="text-lg font-bold text-white">Bilal Hoca desteği</h3>
						<p className="mt-2 text-sm leading-7 text-slate-400">
							Özellikle Pro ve Premium paketlerde strateji ve süreç takibi daha güçlü.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
