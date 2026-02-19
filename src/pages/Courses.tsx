import { BookOpen } from "lucide-react";

const courses = [
  { id: 1, name: "Matematika", teacher: "Pak Budi", progress: 72, chapters: 12, color: "168 60% 38%" },
  { id: 2, name: "Bahasa Indonesia", teacher: "Bu Sari", progress: 85, chapters: 10, color: "38 90% 55%" },
  { id: 3, name: "Fisika", teacher: "Pak Agus", progress: 60, chapters: 14, color: "210 70% 55%" },
  { id: 4, name: "Kimia", teacher: "Bu Rina", progress: 45, chapters: 11, color: "145 60% 42%" },
  { id: 5, name: "Sejarah", teacher: "Pak Hadi", progress: 90, chapters: 8, color: "340 65% 55%" },
  { id: 6, name: "Bahasa Inggris", teacher: "Bu Diana", progress: 68, chapters: 10, color: "270 55% 55%" },
];

export default function Courses() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mata Pelajaran</h1>
        <p className="mt-1 text-muted-foreground">Daftar mata pelajaran semester ini.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="group rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md overflow-hidden">
            <div
              className="flex h-28 items-end p-4"
              style={{ background: `linear-gradient(135deg, hsl(${c.color}), hsl(${c.color} / 0.7))` }}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
                <h3 className="text-lg font-bold text-primary-foreground">{c.name}</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">{c.teacher} · {c.chapters} Bab</p>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{c.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
