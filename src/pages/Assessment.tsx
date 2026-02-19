import { useState } from "react";
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";

type AssessmentStatus = "available" | "completed" | "upcoming";

interface Assessment {
  id: number;
  title: string;
  subject: string;
  date: string;
  duration: string;
  questions: number;
  status: AssessmentStatus;
  score?: number;
}

const assessments: Assessment[] = [
  { id: 1, title: "Ujian Harian Bab 3", subject: "Matematika", date: "19 Feb 2026", duration: "60 menit", questions: 20, status: "available" },
  { id: 2, title: "Kuis Struktur Atom", subject: "Kimia", date: "20 Feb 2026", duration: "30 menit", questions: 15, status: "available" },
  { id: 3, title: "UTS Sejarah", subject: "Sejarah", date: "25 Feb 2026", duration: "90 menit", questions: 40, status: "upcoming" },
  { id: 4, title: "Ujian Harian Bab 2", subject: "Matematika", date: "12 Feb 2026", duration: "60 menit", questions: 20, status: "completed", score: 85 },
  { id: 5, title: "Kuis Bahasa Indonesia", subject: "Bahasa Indonesia", date: "10 Feb 2026", duration: "30 menit", questions: 15, status: "completed", score: 90 },
  { id: 6, title: "Tugas Hukum Newton", subject: "Fisika", date: "8 Feb 2026", duration: "45 menit", questions: 10, status: "completed", score: 78 },
];

const statusConfig = {
  available: { label: "Tersedia", icon: AlertTriangle, badgeClass: "bg-warning/10 text-warning" },
  completed: { label: "Selesai", icon: CheckCircle2, badgeClass: "bg-success/10 text-success" },
  upcoming: { label: "Mendatang", icon: Clock, badgeClass: "bg-info/10 text-info" },
};

const filters: { label: string; value: AssessmentStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Tersedia", value: "available" },
  { label: "Selesai", value: "completed" },
  { label: "Mendatang", value: "upcoming" },
];

export default function Assessment() {
  const [filter, setFilter] = useState<AssessmentStatus | "all">("all");
  const filtered = filter === "all" ? assessments : assessments.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Asesmen</h1>
        <p className="mt-1 text-muted-foreground">Kelola dan kerjakan asesmen kamu.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((a) => {
          const cfg = statusConfig[a.status];
          return (
            <div key={a.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  a.status === "completed" ? "bg-success/10" : a.status === "available" ? "bg-warning/10" : "bg-info/10"
                }`}>
                  {a.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : a.status === "available" ? (
                    <Circle className="h-5 w-5 text-warning" />
                  ) : (
                    <Clock className="h-5 w-5 text-info" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.subject} · {a.date} · {a.duration} · {a.questions} soal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {a.score !== undefined && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    a.score >= 85 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {a.score}
                  </span>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.badgeClass}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
