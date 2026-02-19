import { Download } from "lucide-react";

interface SubjectGrade {
  subject: string;
  dailyExam: number;
  midterm: number;
  finalExam: number;
  average: number;
  grade: string;
}

const grades: SubjectGrade[] = [
  { subject: "Matematika", dailyExam: 82, midterm: 85, finalExam: 80, average: 82, grade: "B+" },
  { subject: "Bahasa Indonesia", dailyExam: 90, midterm: 88, finalExam: 92, average: 90, grade: "A" },
  { subject: "Fisika", dailyExam: 75, midterm: 78, finalExam: 80, average: 78, grade: "B" },
  { subject: "Kimia", dailyExam: 70, midterm: 72, finalExam: 68, average: 70, grade: "B-" },
  { subject: "Sejarah", dailyExam: 88, midterm: 90, finalExam: 85, average: 88, grade: "A-" },
  { subject: "Bahasa Inggris", dailyExam: 85, midterm: 82, finalExam: 88, average: 85, grade: "B+" },
];

const overallAverage = Math.round(grades.reduce((s, g) => s + g.average, 0) / grades.length);

function gradeColor(avg: number) {
  if (avg >= 85) return "text-success";
  if (avg >= 75) return "text-primary";
  if (avg >= 65) return "text-warning";
  return "text-destructive";
}

export default function Report() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Raport Online</h1>
          <p className="mt-1 text-muted-foreground">Semester Ganjil 2025/2026</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Download className="h-4 w-4" />
          Unduh Raport
        </button>
      </div>

      {/* Student Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Nama Siswa</p>
          <p className="mt-1 text-lg font-semibold">Ahmad Siswa</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Kelas</p>
          <p className="mt-1 text-lg font-semibold">10-A</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Rata-rata</p>
          <p className={`mt-1 text-3xl font-bold ${gradeColor(overallAverage)}`}>{overallAverage}</p>
        </div>
      </div>

      {/* Grades Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Mata Pelajaran</th>
                <th className="px-4 py-3 text-center font-semibold">UH</th>
                <th className="px-4 py-3 text-center font-semibold">UTS</th>
                <th className="px-4 py-3 text-center font-semibold">UAS</th>
                <th className="px-4 py-3 text-center font-semibold">Rata-rata</th>
                <th className="px-4 py-3 text-center font-semibold">Predikat</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.subject} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{g.subject}</td>
                  <td className="px-4 py-3 text-center">{g.dailyExam}</td>
                  <td className="px-4 py-3 text-center">{g.midterm}</td>
                  <td className="px-4 py-3 text-center">{g.finalExam}</td>
                  <td className={`px-4 py-3 text-center font-bold ${gradeColor(g.average)}`}>{g.average}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      g.average >= 85 ? "bg-success/10 text-success" : g.average >= 75 ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                    }`}>
                      {g.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
