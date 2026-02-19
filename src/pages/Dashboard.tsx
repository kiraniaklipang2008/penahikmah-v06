import { BookOpen, ClipboardCheck, FileBarChart, TrendingUp, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Mata Pelajaran", value: "6", icon: BookOpen, color: "text-primary" },
  { label: "Asesmen Aktif", value: "3", icon: ClipboardCheck, color: "text-accent" },
  { label: "Rata-rata Nilai", value: "82", icon: TrendingUp, color: "text-success" },
  { label: "Teman Sekelas", value: "32", icon: Users, color: "text-info" },
];

const recentActivities = [
  { title: "Ujian Matematika Bab 3", subject: "Matematika", date: "18 Feb 2026", score: 85 },
  { title: "Kuis Bahasa Indonesia", subject: "Bahasa Indonesia", date: "17 Feb 2026", score: 90 },
  { title: "Tugas Fisika - Hukum Newton", subject: "Fisika", date: "15 Feb 2026", score: 78 },
];

const upcomingAssessments = [
  { title: "Ujian Tengah Semester Kimia", subject: "Kimia", date: "25 Feb 2026" },
  { title: "Kuis Sejarah Bab 4", subject: "Sejarah", date: "22 Feb 2026" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Selamat Datang, Ahmad! 👋</h1>
        <p className="mt-1 text-muted-foreground">Berikut ringkasan pembelajaran kamu hari ini.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Aktivitas Terakhir</h3>
            <Link to="/report" className="text-sm text-primary hover:underline">Lihat semua</Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentActivities.map((a) => (
              <div key={a.title} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.subject} · {a.date}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  a.score >= 85 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}>
                  {a.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Asesmen Mendatang</h3>
            <Link to="/assessment" className="text-sm text-primary hover:underline">Lihat semua</Link>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingAssessments.map((a) => (
              <div key={a.title} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.subject} · {a.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
