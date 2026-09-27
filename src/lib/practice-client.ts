export type PracticeModuleKey = "VOCABULARY" | "READING" | "GRAMMAR";

/** Fire-and-forget: saves practice answers for the dashboard's performance and streak. */
export function recordPracticeAnswers(module: PracticeModuleKey, answers: Array<{ itemKey: string; isCorrect: boolean }>) {
  if (answers.length === 0) return;
  const safeAnswers = answers.map((answer) => ({
    itemKey: answer.itemKey.replace(/[^\w:.-]/g, "_").slice(0, 120) || "item",
    isCorrect: answer.isCorrect,
  }));
  void fetch("/api/practice/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module, answers: safeAnswers }),
    keepalive: true,
  }).catch(() => undefined);
}
