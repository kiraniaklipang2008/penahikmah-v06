import { Loader2, BarChart3, BookOpen, Trophy } from "lucide-react";
import { useReport } from "@/hooks/useReport";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function gradeLabel(pct: number) {
  if (pct >= 90) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  return "D";
}

export default function Report() {
  const { profile } = useAuth();
  const { data, isLoading } = useReport();

  const chartData =
    data?.subjects.map((s) => ({
      name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
      "Progres Materi": s.completionPct,
      "Skor Kuis Terbaik": s.bestQuizScore ?? 0,
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Raport Online</h1>
        <p className="mt-1 text-muted-foreground">
          Ringkasan progres pembelajaran per mata pelajaran
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Belum ada data mata pelajaran.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Nama Siswa</p>
              <p className="mt-1 text-lg font-semibold">
                {profile?.full_name || "—"}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Kelas</p>
              <p className="mt-1 text-lg font-semibold">
                {profile?.class || "—"}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Progres Keseluruhan</p>
              <p className="mt-1 text-3xl font-bold text-primary">
                {data.overallCompletionPct}%
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Grafik Progres per Mata Pelajaran</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Legend />
                  <Bar
                    dataKey="Progres Materi"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Skor Kuis Terbaik"
                    fill="hsl(var(--accent))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold">
                      Mata Pelajaran
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Materi Selesai
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Progres
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Skor Kuis Terbaik
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Predikat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjects.map((s) => {
                    const score = s.bestQuizScore;
                    return (
                      <tr
                        key={s.id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-center">
                          {s.completedLessons}/{s.totalLessons}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${s.completionPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                              {s.completionPct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {score !== null ? (
                            <span
                              className={
                                score >= 70
                                  ? "text-success"
                                  : score >= 50
                                  ? "text-warning"
                                  : "text-destructive"
                              }
                            >
                              {score}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {score !== null ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                score >= 70
                                  ? "bg-success/10 text-success"
                                  : score >= 50
                                  ? "bg-warning/10 text-warning"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {gradeLabel(score)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Belum ada
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
