import { Button } from "@/src/components/common/button";
import { getDailyGrammarModule } from "@/src/lib/ai-content";

export const dynamic = "force-dynamic";

export default async function GrammarPage() {
	const grammar = await getDailyGrammarModule();
	const grammarModule = grammar.module;

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
						AI Grammar Coach
					</span>
					<h1 className="mt-4 text-3xl font-black text-slate-950 md:text-4xl">
						Gunluk AI grammar modulu hazir
					</h1>
					<p className="mt-3 max-w-2xl text-slate-600">
						Bugun icin secilen konu: {grammarModule.topic}. Konu ozeti, ornekler, sik hatalar
						ve AI destekli mini test ile adim adim calis.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button href="/dashboard" variant="outline">
						Dashboard&apos;a Don
					</Button>
					<Button href="/pricing">Tam Konu Paketi</Button>
				</div>
			</div>

			<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-500">Bugunku Konu</p>
					<h2 className="mt-2 text-3xl font-black text-slate-950">{grammarModule.topic}</h2>
					<p className="mt-2 text-sm text-slate-600">
						Seviye: {grammarModule.level} · Hedef: {grammarModule.objective}
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-500">Mini Practice</p>
					<h2 className="mt-2 text-3xl font-black text-slate-950">{grammarModule.questions.length} soru</h2>
					<p className="mt-2 text-sm text-slate-600">
						AI secimli gunluk hizli kontrol seti.
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-500">AI Modeli</p>
					<h2 className="mt-2 text-3xl font-black text-slate-950">{grammar.model}</h2>
					<p className="mt-2 text-sm text-slate-600">
						Modul tarihi: {new Date(grammar.generatedAt).toLocaleDateString("tr-TR")}
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-500">Sik Hata</p>
					<h2 className="mt-2 text-3xl font-black text-slate-950">{grammarModule.commonMistakes.length}</h2>
					<p className="mt-2 text-sm text-slate-600">
						Bu konu icin odaklanman gereken hata alani.
					</p>
				</div>
			</div>

			<div className="mt-10 grid gap-6 lg:grid-cols-3">
				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
					<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div>
							<h2 className="text-xl font-bold text-slate-900">AI konu anlatimi</h2>
							<p className="mt-1 text-sm text-slate-600">
								{grammarModule.objective}
							</p>
						</div>
						<Button variant="secondary" size="sm">
							Practice Baslat
						</Button>
					</div>

					<div className="mt-6 rounded-3xl bg-slate-50 p-6">
						<h3 className="text-lg font-bold text-slate-900">AI analiz ozeti</h3>
						<p className="mt-3 text-sm leading-7 text-slate-600">
							{grammarModule.explanation}
						</p>
						<div className="mt-4 space-y-3">
							{grammarModule.examples.map((example) => (
								<div key={example.en} className="rounded-2xl border border-slate-200 p-4">
									<p className="text-sm font-medium text-slate-800">EN: {example.en}</p>
									<p className="mt-1 text-sm text-slate-600">TR: {example.tr}</p>
								</div>
							))}
						</div>
					</div>

					<div className="mt-6 space-y-4">
						{grammarModule.questions.map((question, index) => (
							<div
								key={question.question}
								className="rounded-2xl border border-slate-200 px-5 py-4"
							>
								<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
									<div>
										<h3 className="text-lg font-bold text-slate-900">Soru {index + 1}</h3>
										<p className="mt-2 text-sm text-slate-600">{question.question}</p>
										<p className="mt-2 text-xs text-slate-500">Secenekler: {question.options.join(" / ")}</p>
										<p className="mt-1 text-xs font-semibold text-slate-700">Cevap: {question.answer}</p>
										<p className="mt-1 text-xs text-slate-500">{question.explanation}</p>
									</div>
									<span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
										Test
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-bold text-slate-900">Sik hatalar</h2>
						<div className="mt-5 space-y-3">
							{grammarModule.commonMistakes.map((item, index) => (
								<div
									key={item}
									className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-4"
								>
									<span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
										{index + 1}
									</span>
									<p className="text-sm font-medium text-slate-700">{item}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl bg-blue-600 p-6 text-white shadow-sm">
						<p className="text-sm font-semibold text-blue-100">AI coach notu</p>
						<h3 className="mt-2 text-xl font-black">Gunluk calisma stratejisi</h3>
						<p className="mt-3 text-sm leading-7 text-blue-100">
							{grammar.aiCoachNote}
						</p>
						<div className="mt-4 border-t border-blue-300/40 pt-4">
							<p className="text-xs text-blue-100">Calisma Plani</p>
							<ul className="mt-2 space-y-1 text-sm text-blue-100">
								{grammarModule.studyPlan.map((step) => (
									<li key={step}>- {step}</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
