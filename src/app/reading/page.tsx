import { Button } from "@/src/components/common/button";
import { AiArticleReader } from "@/src/components/reading/ai-article-reader";
import { getDailyReadingModule, getDailyVocabulary } from "@/src/lib/ai-content";
import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function ReadingPage() {
	const session = await getServerSession(authOptions);
	const profile = session?.user?.id
		? await prisma.studentProfile.findUnique({
				where: { userId: session.user.id },
				select: { interestTags: true },
		  })
		: null;

	const [reading, vocabulary] = await Promise.all([
		getDailyReadingModule({ interestTags: profile?.interestTags ?? [] }),
		getDailyVocabulary(),
	]);
	const mainPassage = reading.passages[0];
	const supportingPassages = reading.passages.slice(1);
	const wordMeanings = Object.fromEntries(
		vocabulary.items.map((item) => [item.word.toLowerCase(), item.trMeaning])
	);

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
						AI Reading Studio
					</span>
					<h1 className="mt-4 text-3xl font-black text-slate-950 md:text-4xl">
						Gunluk cok kaynakli AI reading modulu
					</h1>
					<p className="mt-3 max-w-2xl text-slate-600">
						Her gun farkli kaynaklardan secilen metinlerle ana fikir, baglam, cikarim,
						kelime ve ton sorularini birlikte calis.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button href="/dashboard" variant="outline">
						Dashboard&apos;a Don
					</Button>
					<Button href="/live-classes">Canli Ders Takvimi</Button>
				</div>
			</div>

			<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-500">Kaynak Sayisi</p>
					<h2 className="mt-2 text-3xl font-black text-slate-950">{reading.passages.length}</h2>
					<p className="mt-2 text-sm text-slate-600">
						Gunluk modulde farkli yayinlardan secilen metinler.
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-500">Tahmini Sure</p>
					<h2 className="mt-2 text-3xl font-black text-slate-950">30 dk</h2>
					<p className="mt-2 text-sm text-slate-600">
						Skim + detay okuma + soru analizi dahil planli sure.
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-500">Soru Tipi</p>
					<h2 className="mt-2 text-3xl font-black text-slate-950">5 tip</h2>
					<p className="mt-2 text-sm text-slate-600">
						Main idea, detail, inference, vocabulary ve tone.
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-500">AI Modeli</p>
					<h2 className="mt-2 text-3xl font-black text-slate-950">{reading.model}</h2>
					<p className="mt-2 text-sm text-slate-600">
						Gunluk icerikler AI destekli olarak olusturulur.
					</p>
				</div>
			</div>

			<div className="mt-10 space-y-6">
				<AiArticleReader
					passage={mainPassage}
					generatedAt={reading.generatedAt}
					wordMeanings={wordMeanings}
				/>

				<div className="grid gap-6 lg:grid-cols-3">
					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
						<h2 className="text-xl font-bold text-slate-900">Ana parca soru seti</h2>
						<div className="mt-5 space-y-4">
							{mainPassage.questions.map((task) => (
								<div
									key={task.question}
									className="rounded-2xl border border-slate-200 px-5 py-4"
								>
									<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
										<div>
											<h3 className="text-lg font-bold text-slate-900">{task.type.toUpperCase()}</h3>
											<p className="mt-2 text-sm text-slate-600">{task.question}</p>
										</div>
										<span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
											Soru
										</span>
									</div>
								</div>
							))}
						</div>

						<div className="mt-6 rounded-3xl border border-slate-200 p-6">
							<h3 className="text-lg font-bold text-slate-900">Ek kaynaklar</h3>
							<div className="mt-4 grid gap-4">
								{supportingPassages.map((item) => (
									<div key={item.title} className="rounded-2xl border border-slate-200 p-4">
										<p className="text-xs font-semibold uppercase text-slate-500">{item.source}</p>
										<h4 className="mt-1 text-base font-bold text-slate-900">{item.title}</h4>
										<p className="mt-2 text-sm text-slate-600">{item.summary}</p>
										<div className="mt-3 space-y-2">
											{item.questions.slice(0, 2).map((question) => (
												<div key={`${item.title}-${question.question}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
													<p className="text-[11px] font-semibold uppercase text-blue-700">{question.type}</p>
													<p className="mt-1 text-xs text-slate-700">{question.question}</p>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="space-y-6">
					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-bold text-slate-900">AI okuma plani</h2>
						<div className="mt-5 space-y-3">
							{mainPassage.studyPlan.map((item, index) => (
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
						<p className="text-sm font-semibold text-blue-100">AI performans rehberi</p>
						<h3 className="mt-2 text-xl font-black">Okuma verimini sistemli artir</h3>
						<p className="mt-3 text-sm leading-7 text-blue-100">
							{reading.performanceGuide.skimFirst} {reading.performanceGuide.markSignals} {" "}
							{reading.performanceGuide.answerOrder} {reading.performanceGuide.reviewWindow}
						</p>
						<p className="mt-3 text-xs text-blue-100">Guncellendi: {new Date(reading.generatedAt).toLocaleDateString("tr-TR")}</p>
					</div>
					</div>
				</div>
			</div>
		</div>
	);
}
