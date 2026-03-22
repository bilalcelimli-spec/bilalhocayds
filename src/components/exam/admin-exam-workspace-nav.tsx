import Link from "next/link";

const tabs = [
  { key: "overview", label: "Genel Bakis", suffix: "" },
  { key: "edit", label: "Konfigurasyon", suffix: "/edit" },
  { key: "parse", label: "PDF Parse", suffix: "/parse" },
  { key: "mapping", label: "Question Mapping", suffix: "/mapping" },
  { key: "questions", label: "Question Editor", suffix: "/questions" },
  { key: "pricing", label: "Pricing", suffix: "/pricing" },
  { key: "analytics", label: "Analytics", suffix: "/analytics" },
  { key: "bookings", label: "Bookings", suffix: "/bookings" },
  { key: "preview", label: "Student Preview", suffix: "/preview" },
];

type AdminExamWorkspaceNavProps = {
  examId: string;
  activeKey: string;
};

export function AdminExamWorkspaceNav({ examId, activeKey }: AdminExamWorkspaceNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;

        return (
          <Link
            key={tab.key}
            href={`/admin/exams/${examId}${tab.suffix}`}
            className={`rounded-2xl border px-4 py-2 text-sm transition ${
              isActive
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}