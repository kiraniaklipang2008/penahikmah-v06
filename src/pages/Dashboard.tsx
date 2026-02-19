import { BookOpen, ClipboardCheck, TrendingUp, CheckCircle2, Loader2, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <p className="mt-2 text-3xl font-bold">
        {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data, isLoading } = useDashboard();
  const firstName = profile?.full_name?.split(" ")[0] || "User";

  const stats = [
    {
      label: "Mata Pelajaran",
      value: data?.subjectCount ?? "-",
      icon: BookOpen,
      colorClass: "text-primary",
    },
    {
      label: "Pelajaran Selesai",
      value: data?.lessonsCompleted ?? "-",
      icon: CheckCircle2,
      colorClass: "text-success",
    },
    {
      label: "Kuis Dikerjakan",
      value: data?.quizzesAttempted ?? "-",
      icon: ClipboardCheck,
      colorClass: "text-accent",
    },
    {
      label: "Rata-rata Skor",
      value: data?.averageScore !== null && data?.averageScore !== undefined
        ? `${data.averageScore}%`
        : "-",
      icon: TrendingUp,
      colorClass: "text-info",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Selamat Datang, {firstName}! 👋</h1>
        <p className="mt-1 text-muted-foreground">Berikut ringkasan pembelajaran kamu hari ini.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={isLoading} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Quiz Results */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Hasil Kuis Terakhir</h3>
            <Link to="/assessment" className="text-sm text-primary hover:underline">
              Lihat semua
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.recentResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <Trophy className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Belum ada kuis yang dikerjakan.</p>
              <Link to="/assessment" className="text-sm font-medium text-primary hover:underline">
                Mulai kuis sekarang →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentResults.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{r.quizTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.subjectName} · {r.completedAt}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      r.scorePct >= 70
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {r.scorePct}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Menu Cepat</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: "/courses", label: "Mata Pelajaran", icon: BookOpen, desc: "Lanjutkan belajar" },
              { to: "/assessment", label: "Asesmen", icon: ClipboardCheck, desc: "Kerjakan kuis" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/40 transition-colors"
              >
                <item.icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Progress summary */}
          {!isLoading && (data?.lessonsCompleted ?? 0) > 0 && (
            <div className="mt-4 rounded-lg bg-primary/8 border border-primary/20 p-3">
              <p className="text-xs font-medium text-primary">
                🎯 Kamu telah menyelesaikan {data?.lessonsCompleted} pelajaran dan mengerjakan {data?.quizzesAttempted} kuis.
                {data?.averageScore !== null ? ` Rata-rata skor kamu ${data?.averageScore}%.` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
