"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Trophy, Brain, CheckCircle2 } from "lucide-react";

interface Question {
  q: string;
  options: [string, string, string, string];
  correct: "A" | "B" | "C" | "D";
  passage?: string;
}

const P1 =
  "Rewilding refers to large‑scale ecosystem restoration where nature is allowed to manage itself. Unlike traditional conservation – which demands constant human management – rewilding steps back so natural processes can resume. Advocates argue it reverses biodiversity loss, mitigates climate change by restoring carbon‑absorbing habitats, and boosts local economies through eco‑tourism. Critics raise concerns about reintroduced apex predators, such as wolves, which can threaten livestock and, rarely, human safety. Despite these challenges, projects in Europe and North America show that ecosystems recover remarkably quickly once key species are restored and human interference is minimised.";

const P2 =
  "Artificial intelligence is rapidly transforming healthcare. Machine‑learning algorithms now analyse medical images with an accuracy that rivals – and sometimes surpasses – experienced radiologists, detecting early signs of cancer, Alzheimer's, and heart disease far sooner than traditional methods. Yet this integration raises ethical questions: who is liable when AI makes a wrong diagnosis? How should patient data be protected? There is also concern that over‑reliance on AI may gradually erode the clinical skills of healthcare professionals. Despite these concerns, most experts agree that AI, used as a supplement to human expertise rather than a replacement, holds enormous potential for improving patient outcomes and reducing costs.";

const questions: Question[] = [
  // ── VOCABULARY (1-15) ──
  {
    q: "The scientist's research findings were so ---- that they completely changed the way we understand the human brain.",
    options: ["trivial", "groundbreaking", "obsolete", "ambiguous"],
    correct: "B",
  },
  {
    q: "The new government policy was met with ---- criticism from opposition parties, who argued it would harm the economy.",
    options: ["subdued", "fierce", "tentative", "sporadic"],
    correct: "B",
  },
  {
    q: "Despite her ---- appearance, she turned out to be a ---- negotiator who secured the best possible deal for her client.",
    options: ["confident / nervous", "calm / inexperienced", "frail / formidable", "bold / incompetent"],
    correct: "C",
  },
  {
    q: "The documentary aims to ---- awareness about the devastating effects of plastic pollution on marine ecosystems.",
    options: ["raise", "rise", "arise", "arouse"],
    correct: "A",
  },
  {
    q: "The company decided to ---- its losses and close the struggling overseas branch rather than continue investing in it.",
    options: ["cut", "abandon", "write off", "avoid"],
    correct: "C",
  },
  {
    q: "The novel's complex plot kept readers ---- until the very last page, where all the mysteries were finally revealed.",
    options: ["confused", "engaged", "offended", "satisfied"],
    correct: "B",
  },
  {
    q: "It is not unusual for teenagers to ---- parental authority as part of their natural development and search for identity.",
    options: ["support", "challenge", "reinforce", "embrace"],
    correct: "B",
  },
  {
    q: "The ancient city ruins were so well ---- that archaeologists could clearly identify the layout of the original streets.",
    options: ["preserved", "discovered", "excavated", "abandoned"],
    correct: "A",
  },
  {
    q: "The film received ---- praise from critics around the world, earning numerous awards at major international festivals.",
    options: ["minimal", "limited", "widespread", "occasional"],
    correct: "C",
  },
  {
    q: "Researchers found that people who ---- regular physical exercise tend to live significantly longer than those who do not.",
    options: ["engage in", "carry on", "put up with", "deal with"],
    correct: "A",
  },
  {
    q: "The company's new marketing strategy proved highly ---- as sales increased by forty percent within the first quarter.",
    options: ["controversial", "effective", "disastrous", "predictable"],
    correct: "B",
  },
  {
    q: "Despite numerous setbacks, the team remained ---- in their belief that they could complete the ambitious project on time.",
    options: ["desperate", "optimistic", "sceptical", "indifferent"],
    correct: "B",
  },
  {
    q: "The professor's lecture was so ---- that even the most disinterested students found themselves taking detailed notes.",
    options: ["dull", "confusing", "compelling", "lengthy"],
    correct: "C",
  },
  {
    q: "The politician's speech was heavily ---- for its complete lack of substance and its reliance on empty promises.",
    options: ["admired", "criticised", "celebrated", "anticipated"],
    correct: "B",
  },
  {
    q: "After years of ---- research, the team finally made a breakthrough expected to lead to a cure for the disease.",
    options: ["extensive", "superficial", "occasional", "brief"],
    correct: "A",
  },
  // ── GRAMMAR (16-30) ──
  {
    q: "By the time the rescue team arrived, the survivors ---- in the collapsed building for over forty‑eight hours.",
    options: ["were trapped", "had been trapped", "had trapped", "were being trapped"],
    correct: "B",
  },
  {
    q: "The new regulations require that all employees ---- safety training before starting their new positions.",
    options: ["complete", "completed", "will complete", "had completed"],
    correct: "A",
  },
  {
    q: "---- she had studied harder, she would have passed the exam with a much higher score.",
    options: ["If", "Unless", "Had", "Should"],
    correct: "C",
  },
  {
    q: "The report suggests that the company's profits ---- significantly over the past five years, prompting an investigation.",
    options: ["have declined", "declined", "had declined", "are declining"],
    correct: "A",
  },
  {
    q: "It was not until the investigation ---- that the true extent of the financial fraud became clear to the public.",
    options: ["completed", "was completed", "had been completed", "would be completed"],
    correct: "B",
  },
  {
    q: "The more the students practised the exam questions, ---- their overall results became throughout the course.",
    options: ["the best", "the better", "the more better", "better"],
    correct: "B",
  },
  {
    q: "Scientists, ---- findings have been published in leading journals, are calling for immediate action on climate change.",
    options: ["who", "whose", "whom", "which"],
    correct: "B",
  },
  {
    q: "The director gave a speech, not only thanking the crew ---- praising the actors for their outstanding performances.",
    options: ["but also", "also", "and also", "as well as"],
    correct: "A",
  },
  {
    q: "The study found that children ---- in bilingual environments tend to develop stronger problem‑solving skills early on.",
    options: ["raising", "risen", "raised", "having raised"],
    correct: "C",
  },
  {
    q: "---- the weather being terrible, the outdoor concert was cancelled at the very last minute by the organisers.",
    options: ["Despite", "Due to", "Because of", "In spite"],
    correct: "B",
  },
  {
    q: "'I will definitely attend the conference,' said the mayor. → The mayor said that he ---- the conference.",
    options: ["would definitely attend", "will definitely attend", "definitely attended", "was definitely attending"],
    correct: "A",
  },
  {
    q: "The research paper, ---- by three different professors, was finally approved after months of extensive revisions.",
    options: ["reviewing", "reviewed", "having reviewed", "to review"],
    correct: "B",
  },
  {
    q: "The more exposure children have to books from an early age, ---- their vocabulary tends to become over time.",
    options: ["the richer", "the richest", "richer", "richest"],
    correct: "A",
  },
  {
    q: "Neither the manager nor his assistants ---- aware of the changes that had been made to the weekly schedule.",
    options: ["was", "were", "are", "had been"],
    correct: "B",
  },
  {
    q: "The experiment ---- under controlled conditions when an unexpected power outage caused all the data to be lost.",
    options: ["was being conducted", "was conducted", "had been conducted", "conducted"],
    correct: "A",
  },
  // ── READING: PASSAGE 1 (31-35) ──
  {
    passage: P1,
    q: "What is the main purpose of the passage?",
    options: [
      "To argue that rewilding is superior to all other conservation methods",
      "To describe rewilding and present both its potential benefits and its challenges",
      "To explain why rewilding projects have consistently failed across Europe",
      "To demonstrate that human management of ecosystems is always harmful",
    ],
    correct: "B",
  },
  {
    passage: P1,
    q: "According to the passage, one key difference between rewilding and traditional conservation is that:",
    options: [
      "Traditional conservation focuses on large‑scale ecosystem restoration",
      "Rewilding requires more constant human management than traditional conservation",
      "Rewilding aims to reduce human management so natural processes can resume",
      "Traditional conservation primarily focuses on the reintroduction of apex predators",
    ],
    correct: "C",
  },
  {
    passage: P1,
    q: "The word 'mitigate' as used in the passage is closest in meaning to:",
    options: ["worsen", "ignore", "reduce", "measure"],
    correct: "C",
  },
  {
    passage: P1,
    q: "Which of the following is mentioned as a concern that critics have raised about rewilding?",
    options: [
      "The high cost of eco‑tourism infrastructure",
      "The potential danger from reintroduced predators to livestock",
      "The slow pace at which damaged ecosystems recover",
      "The lack of scientific evidence for rewilding's long‑term benefits",
    ],
    correct: "B",
  },
  {
    passage: P1,
    q: "What does the final sentence of the passage suggest about rewilding projects?",
    options: [
      "They have been mostly unsuccessful due to continued human interference",
      "They require decades before any visible improvements are observed",
      "They have shown promising results once key species and conditions are restored",
      "They have only succeeded in regions with booming eco‑tourism revenues",
    ],
    correct: "C",
  },
  // ── READING: PASSAGE 2 (36-40) ──
  {
    passage: P2,
    q: "What is the central idea of the passage?",
    options: [
      "Artificial intelligence is already replacing doctors in hospitals worldwide",
      "AI offers significant benefits to healthcare but also raises important concerns",
      "Patient data protection is the single biggest challenge for AI in medicine",
      "AI diagnostic tools have proven to be less accurate than traditional ones",
    ],
    correct: "B",
  },
  {
    passage: P2,
    q: "According to the passage, AI can match or exceed human performance in which area?",
    options: [
      "Performing complex surgical procedures with high precision",
      "Analysing medical images for early diagnostic purposes",
      "Making treatment decisions and long‑term care planning",
      "Managing hospital administration and scheduling systems",
    ],
    correct: "B",
  },
  {
    passage: P2,
    q: "The word 'erode' in the passage is closest in meaning to:",
    options: ["strengthen", "gradually weaken", "rapidly improve", "suddenly destroy"],
    correct: "B",
  },
  {
    passage: P2,
    q: "According to the passage, most experts believe that AI in healthcare should be:",
    options: [
      "Completely independent of human oversight and regulation",
      "Prohibited until all major ethical questions have been resolved",
      "Used alongside human expertise rather than as a complete substitute",
      "Restricted to non‑diagnostic and administrative tasks only",
    ],
    correct: "C",
  },
  {
    passage: P2,
    q: "Which of the following concerns about AI in healthcare is explicitly mentioned in the passage?",
    options: [
      "AI systems are far too expensive for most hospitals to afford",
      "Professionals may become overly dependent on AI, losing critical clinical skills",
      "AI cannot yet detect early signs of serious diseases like cancer",
      "Machine‑learning algorithms take too long to train to be practically useful",
    ],
    correct: "B",
  },
  // ── SENTENCE STRUCTURE (41-50) ──
  {
    q: "The city's population has grown ---- rapidly ---- the existing infrastructure struggles to keep up with the demand.",
    options: ["so / that", "such / that", "too / to", "very / that"],
    correct: "A",
  },
  {
    q: "I deeply regret ---- him the truth when I had the chance, as it would have prevented all this confusion.",
    options: ["to not tell", "not telling", "not to tell", "telling not"],
    correct: "B",
  },
  {
    q: "The committee meeting, ---- lasted three hours, ended without reaching a clear consensus on the proposed budget.",
    options: ["who", "that", "which", "whose"],
    correct: "C",
  },
  {
    q: "The international conference will take place ---- the 15th and 17th of September in Istanbul's convention centre.",
    options: ["from", "between", "among", "during"],
    correct: "B",
  },
  {
    q: "---- of the students in the class had studied for the test, so the average score was surprisingly low.",
    options: ["Neither", "None", "Every", "Much"],
    correct: "B",
  },
  {
    q: "The new bridge, ---- in the 1990s, is now considered one of the most iconic structures in the entire region.",
    options: ["constructed", "constructing", "having constructed", "to construct"],
    correct: "A",
  },
  {
    q: "The children were told it was unsafe to swim because the river's water level ---- significantly since the heavy rains.",
    options: ["rose", "had risen", "has risen", "was rising"],
    correct: "B",
  },
  {
    q: "---- their best efforts, the engineers were unable to resolve the technical problems before the scheduled launch.",
    options: ["Although", "Despite", "Even though", "Whereas"],
    correct: "B",
  },
  {
    q: "The research team consists of scientists who specialise ---- various fields, including biology, chemistry, and physics.",
    options: ["on", "at", "in", "about"],
    correct: "C",
  },
  {
    q: "The reason why the project ultimately failed was ---- the team lacked proper communication throughout the entire process.",
    options: ["because", "that", "since", "as"],
    correct: "B",
  },
];

const LABELS = ["A", "B", "C", "D"] as const;
const PAGE_SIZE = 10;
const TOTAL_PAGES = 5;

function getSectionLabel(page: number): string {
  if (page === 0) return "Bölüm 1 — Kelime Bilgisi";
  if (page === 1) return "Bölüm 1 & 2 — Kelime Bilgisi / Dilbilgisi";
  if (page === 2) return "Bölüm 2 — Dilbilgisi";
  if (page === 3) return "Bölüm 3 — Okuduğunu Anlama";
  return "Bölüm 4 — Cümle Yapısı";
}

interface LevelInfo {
  code: string;
  name: string;
  color: string;
  ring: string;
  bg: string;
  bar: string;
  desc: string;
}

function getLevel(score: number): LevelInfo {
  if (score <= 14)
    return {
      code: "A2",
      name: "Başlangıç Seviyesi",
      color: "text-slate-300",
      ring: "ring-slate-500/50",
      bg: "bg-slate-800/60",
      bar: "bg-slate-500",
      desc: "Temel İngilizce yapılar henüz oturmamış. Doğru sistematik planla çok hızlı ilerliyebilirsin.",
    };
  if (score <= 24)
    return {
      code: "B1",
      name: "Orta Öncesi Seviye",
      color: "text-blue-400",
      ring: "ring-blue-500/50",
      bg: "bg-blue-900/30",
      bar: "bg-blue-500",
      desc: "Temel yapıları biliyorsun, ancak akademik İngilizce için daha stratejik bir çalışmaya ihtiyacın var.",
    };
  if (score <= 34)
    return {
      code: "B2",
      name: "Orta Seviye",
      color: "text-emerald-400",
      ring: "ring-emerald-500/50",
      bg: "bg-emerald-900/30",
      bar: "bg-emerald-500",
      desc: "Sağlam bir temel var. Hedef puana ulaşmak için akıllı strateji ve tutarlı pratik şart.",
    };
  if (score <= 44)
    return {
      code: "C1",
      name: "İleri Seviye",
      color: "text-amber-400",
      ring: "ring-amber-500/50",
      bg: "bg-amber-900/30",
      bar: "bg-amber-500",
      desc: "Çok iyi bir noktadasın. Küçük ama kritik hatalar seni geri tutuyor — onları birlikte kapatalım.",
    };
  return {
    code: "C2",
    name: "Ustalık Seviyesi",
    color: "text-purple-400",
    ring: "ring-purple-500/50",
    bg: "bg-purple-900/30",
    bar: "bg-purple-500",
    desc: "Olağanüstü bir performans! Mükemmel skora taşıyacak son rötuşları birlikte yapabiliriz.",
  };
}

export function LevelQuizSection() {
  const [step, setStep] = useState<"intro" | "quiz" | "results" | "lead" | "success">("intro");
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [form, setForm] = useState({ name: "", surname: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const pageQs = questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const pageFullyAnswered = pageQs.every((_, i) => answers[page * PAGE_SIZE + i] !== undefined);

  function handleAnswer(absIdx: number, label: string) {
    setAnswers((prev) => ({ ...prev, [absIdx]: label }));
  }

  function handleNext() {
    setPage((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrev() {
    setPage((p) => p - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFinish() {
    let s = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) s++;
    });
    setScore(s);
    setStep("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const lvl = getLevel(score);
    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          surname: form.surname.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          plan: `Seviye Testi – ${lvl.code} – ${score}/50`,
        }),
      });
      if (!res.ok) throw new Error("fail");
      setStep("success");
    } catch {
      setFormError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  const level = getLevel(score);
  const percentage = Math.round((score / 50) * 100);

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <section className="relative overflow-hidden py-24 px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
          <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-amber-400/6 blur-3xl" />
          <div className="absolute right-1/4 bottom-10 h-48 w-48 rounded-full bg-white/4 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2 text-sm font-semibold text-amber-300 mb-8">
            <Brain className="w-4 h-4" />
            Ücretsiz Seviye Tespit Sınavı
          </div>
          <h2 className="text-4xl font-black text-white mb-6 leading-tight md:text-5xl">
            YDS / YDT Seviyeni{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Şimdi Keşfet
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            50 soruluk bu sınav; kelime bilgisi, dilbilgisi ve okuduğunu anlama becerilerini ölçer. Sonunda
            gerçek seviyeni öğren, Bilal Hoca&apos;dan kişiselleştirilmiş çalışma planı al.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-12">
            {[
              { icon: "📝", label: "50 Soru" },
              { icon: "⏱️", label: "~20 Dakika" },
              { icon: "🎯", label: "A2 → C2" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-semibold text-white">{item.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep("quiz")}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-[0_16px_40px_rgba(212,168,67,0.25)] transition hover:from-amber-400 hover:to-orange-400"
          >
            Sınava Başla
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-sm text-slate-500">Kayıt gerektirmez · Tamamen ücretsiz</p>
        </div>
      </section>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (step === "quiz") {
    return (
      <section className="py-16 px-6">
        <div className="mx-auto max-w-3xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Soru {Math.min(page * PAGE_SIZE + 1, 50)}–{Math.min((page + 1) * PAGE_SIZE, 50)} / 50
              </span>
              <span className="text-sm font-semibold text-amber-400">{progress}% tamamlandı</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Section label */}
          <p className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
            {getSectionLabel(page)}
          </p>

          {/* Questions */}
          <div className="space-y-6">
            {pageQs.map((q, i) => {
              const absIdx = page * PAGE_SIZE + i;
              const selected = answers[absIdx];
              const showPassage = q.passage !== undefined && (i === 0 || q.passage !== pageQs[i - 1]?.passage);

              return (
                <div key={absIdx}>
                  {showPassage && q.passage && (
                    <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-950/40 p-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-400">
                        Okuma Parçası
                      </p>
                      <p className="text-sm leading-relaxed text-slate-300">{q.passage}</p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <p className="mb-3 text-xs font-bold text-slate-500">Soru {absIdx + 1}</p>
                    <p className="mb-5 font-medium leading-relaxed text-white">{q.q}</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {q.options.map((opt, oi) => {
                        const label = LABELS[oi];
                        const isSelected = selected === label;
                        return (
                          <button
                            key={label}
                            onClick={() => handleAnswer(absIdx, label)}
                            className={`flex items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                              isSelected
                                ? "border-amber-500/60 bg-amber-500/15 text-white"
                                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isSelected ? "bg-amber-500 text-black" : "bg-white/10 text-slate-400"
                              }`}
                            >
                              {label}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={page === 0}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-slate-400 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Önceki
            </button>

            {page < TOTAL_PAGES - 1 ? (
              <button
                onClick={handleNext}
                disabled={!pageFullyAnswered}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white transition hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sonraki <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={answeredCount < questions.length}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3 font-bold text-white transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" /> Sonuçları Gör
              </button>
            )}
          </div>

          {!pageFullyAnswered && (
            <p className="mt-3 text-center text-xs text-amber-500/70">
              Devam etmek için bu sayfadaki tüm soruları yanıtla
            </p>
          )}
        </div>
      </section>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (step === "results") {
    return (
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Trophy className="mx-auto mb-4 w-14 h-14 text-amber-400" />
          <h2 className="mb-2 text-3xl font-black text-white">Sınav Tamamlandı!</h2>
          <p className="mb-10 text-slate-400">İşte seviye analizin</p>

          <div
            className={`mb-8 rounded-3xl border p-8 ring-2 ${level.ring} ${level.bg}`}
          >
            <div className={`mb-1 text-7xl font-black ${level.color}`}>{level.code}</div>
            <div className="mb-3 text-xl font-semibold text-white">{level.name}</div>
            <div className="mb-1 text-5xl font-black text-white">
              {score}
              <span className="text-2xl font-normal text-slate-400"> / 50</span>
            </div>
            <div className="mb-5 text-sm text-slate-400">({percentage}% doğru)</div>
            <p className="leading-relaxed text-slate-300">{level.desc}</p>
          </div>

          {/* Score bar */}
          <div className="mb-10">
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${level.bar}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>A2</span>
              <span>B1</span>
              <span>B2</span>
              <span>C1</span>
              <span>C2</span>
            </div>
          </div>

          <button
            onClick={() => setStep("lead")}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-lg font-bold text-white shadow-[0_16px_40px_rgba(212,168,67,0.2)] transition hover:from-amber-400 hover:to-orange-400"
          >
            Kişisel Programımı Oluştur →
          </button>
          <p className="mt-3 text-sm text-slate-500">
            Bilal Hoca ekibi seni arayarak {level.code} seviyene özel plan sunar
          </p>
        </div>
      </section>
    );
  }

  // ── LEAD FORM ──────────────────────────────────────────────────────────────
  if (step === "lead") {
    return (
      <section className="py-20 px-6">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <div
              className={`mb-4 inline-block rounded-full border px-4 py-1 text-sm font-bold ring-1 ${level.ring} ${level.bg} ${level.color}`}
            >
              Seviyeniz: {level.code} — {score}/50
            </div>
            <h2 className="mb-2 text-2xl font-black text-white">Kişisel Planını Al</h2>
            <p className="text-sm text-slate-400">
              Bilal Hoca ekibi 24 saat içinde seni arayarak {level.code} seviyene özel programı sunar.
            </p>
          </div>

          <form onSubmit={handleLeadSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Ad</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Adın"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-slate-500 transition focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Soyad</label>
                <input
                  type="text"
                  required
                  value={form.surname}
                  onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
                  placeholder="Soyadın"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-slate-500 transition focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Telefon</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="05XX XXX XXXX"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-slate-500 transition focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">E-posta</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@ornek.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-slate-500 transition focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            {formError && <p className="text-center text-sm text-rose-400">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-lg font-bold text-white shadow-[0_16px_40px_rgba(212,168,67,0.2)] transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-60"
            >
              {submitting ? "Gönderiliyor..." : "Programımı İstiyorum →"}
            </button>
            <p className="text-center text-xs text-slate-500">
              Bilgilerin yalnızca program planlaması için kullanılır.
            </p>
          </form>
        </div>
      </section>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-6 w-16 h-16 text-emerald-400" />
        <h2 className="mb-4 text-3xl font-black text-white">Harika! Teşekkürler 🎉</h2>
        <p className="mb-6 leading-relaxed text-slate-300">
          <strong className={level.color}>{level.code} seviyesinde</strong> {score}/50 puan aldın. Bilal Hoca
          ekibi en kısa sürede sana ulaşarak seviyene özel programı sunacak.
        </p>
        <div className={`rounded-2xl border p-5 text-left ring-1 ${level.ring} ${level.bg}`}>
          <p className="text-sm leading-relaxed text-slate-300">{level.desc}</p>
        </div>
      </div>
    </section>
  );
}
