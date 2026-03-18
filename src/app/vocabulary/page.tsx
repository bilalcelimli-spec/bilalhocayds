import { Button } from "@/src/components/common/button";
import { getDailyVocabulary } from "@/src/lib/ai-content";

export const dynamic = "force-dynamic";

const studySteps = [
	"10 kelimeyi sesli tekrar ederek oku",
	"Her kelime için en az bir bağlamsal ipucu çıkar",
	"AI örnek cümlesini incele ve kendi cümleni yaz",
	"Gün sonunda mini quiz ile tekrar et",
];

export default async function VocabularyPage() {
	const vocab = await getDailyVocabulary();
	const todayWords = vocab.items;

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<span className="inline-flex rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
						AI Vocabulary Lab
					</span>
					<h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
						Her gün 10 akademik kelime ile AI destekli çalışma
					</h1>
					<p className="mt-3 max-w-2xl text-slate-300">
						Bugün için seçilen 10 akademik kelime; İngilizce örnek cümle, Türkçe
						anlam ve çeviri ile birlikte hazırlandı.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button href="/dashboard" variant="outline">
						Dashboard&apos;a Dön
					</Button>
					<Button href="/pricing">Premium Kelime Setleri</Button>
				</div>
			</div>

			<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Bugünkü Hedef</p>
					<h2 className="mt-2 text-3xl font-black text-white">10 kelime</h2>
					<p className="mt-2 text-sm text-slate-300">
						AI seçimiyle bugün odaklanılacak akademik set.
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">AI Modeli</p>
					<h2 className="mt-2 text-3xl font-black text-white">{vocab.model}</h2>
					<p className="mt-2 text-sm text-slate-300">
						Görevler günlük tarih ve seviye odağına göre üretilir.
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Örnek Cümle</p>
					<h2 className="mt-2 text-3xl font-black text-white">20 adet</h2>
					<p className="mt-2 text-sm text-slate-300">
						Her kelime kartında 2 örnek cümle ve 2 Türkçe çeviri.
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Güncelleme</p>
					<h2 className="mt-2 text-3xl font-black text-white">Gunluk</h2>
					<p className="mt-2 text-sm text-slate-300">
						Liste her gün farklı bir akademik odakla yenilenir.
					</p>
				</div>
			</div>

			<div className="mt-10 grid gap-6 lg:grid-cols-3">
				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:col-span-2">
					<div className="flex items-center justify-between gap-4">
						<div>
							<h2 className="text-xl font-bold text-white">Bugünün 10 akademik kelimesi</h2>
							<p className="mt-1 text-sm text-slate-300">
								Her kartta kelime, seviye, Türkçe anlam, örnek cümle ve çeviri yer alır.
							</p>
						</div>
						<Button variant="secondary" size="sm">
							Mini Quiz Başlat
						</Button>
					</div>

					<div className="mt-6 grid gap-4 md:grid-cols-2">
						{todayWords.map((item) => (
							<div
								key={item.word}
								className="rounded-2xl border border-white/15 bg-zinc-900/40 px-5 py-4"
							>
								<div className="flex flex-col gap-4">
									<div>
										<div className="flex items-center gap-3">
											<h3 className="text-lg font-bold text-white">{item.word}</h3>
											<span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
												{item.level}
											</span>
										</div>
										<p className="mt-2 text-sm text-slate-300">Anlam: {item.trMeaning}</p>
										<div className="mt-3 space-y-2">
											{item.examples.map((example, index) => (
												<div key={`${item.word}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
													<p className="text-sm text-slate-100">EN {index + 1}: {example.en}</p>
													<p className="mt-1 text-sm text-slate-300">TR {index + 1}: {example.tr}</p>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
						<h2 className="text-xl font-bold text-white">Çalışma akışı</h2>
						<div className="mt-5 space-y-3">
							{studySteps.map((step, index) => (
								<div
									key={step}
									className="flex items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-4"
								>
									<span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-zinc-900">
										{index + 1}
									</span>
									<p className="text-sm font-medium text-slate-200">{step}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-zinc-900/70 p-6 text-white shadow-[0_12px_40px_rgba(212,168,67,0.12)]">
						<p className="text-sm font-semibold text-amber-200">Bilal Hoca önerisi</p>
						<h3 className="mt-2 text-xl font-black">Academic word list tekrar günü</h3>
						<p className="mt-3 text-sm leading-7 text-slate-200">
							Bugün özellikle academic ve bağlaç temelli kelimelere odaklan. YDS
							reading sorularında bu grup sana hız kazandırır.
						</p>
					</div>
				</div>
			</div>

			<div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-xl font-bold text-white">Günlük AI okuma parçası</h2>
					<span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
						Günün kelimeleri bu metinde geçiyor
					</span>
				</div>
				<h3 className="mt-3 text-lg font-semibold text-slate-100">{vocab.reading.title}</h3>
				<p className="mt-3 text-sm leading-8 text-slate-200">{vocab.reading.passage}</p>
				<div className="mt-5 flex flex-wrap gap-2">
					{vocab.reading.words.map((word) => (
						<span
							key={word}
							className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
						>
							{word}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
