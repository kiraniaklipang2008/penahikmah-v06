import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Zap, FlaskConical, Leaf, BookText, Globe,
  BookOpen, CheckCircle2, Circle, Clock, ChevronRight, X, Loader2,
} from "lucide-react";
import { useCourses, useToggleLesson, type Subject } from "@/hooks/useCourses";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ElementType> = {
  Calculator, Zap, FlaskConical, Leaf, BookText, Globe, BookOpen,
};

const COLOR_MAP: Record<string, string> = {
  blue:    "168 60% 38%",   // primary
  yellow:  "38 90% 55%",    // accent / warning
  green:   "145 60% 42%",   // success
  emerald: "160 60% 38%",
  red:     "340 65% 55%",
  purple:  "270 55% 55%",
};

function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const Icon = ICON_MAP[subject.icon] ?? BookOpen;
  const hsl = COLOR_MAP[subject.color] ?? COLOR_MAP.blue;
  const total = subject.lessons.length;
  const done = subject.completedCount;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group text-left w-full rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Coloured header */}
      <div
        className="flex h-24 items-end p-4"
        style={{ background: `linear-gradient(135deg, hsl(${hsl}), hsl(${hsl} / 0.65))` }}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5 text-white/90" />
          <h3 className="text-base font-bold text-white">{subject.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{subject.description}</p>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{done}/{total} pelajaran</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-2 rounded-full"
              style={{ background: `hsl(${hsl})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {progress === 100 ? "✓ Selesai" : progress === 0 ? "Belum dimulai" : "Sedang berjalan"}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.button>
  );
}

function LessonPanel({ subject, onClose }: { subject: Subject; onClose: () => void }) {
  const toggle = useToggleLesson();
  const hsl = COLOR_MAP[subject.color] ?? COLOR_MAP.blue;
  const total = subject.lessons.length;
  const done = subject.completedCount;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleToggle = (lessonId: string, completed: boolean) => {
    toggle.mutate(
      { lessonId, completed },
      {
        onError: () => toast.error("Gagal menyimpan progress"),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-5 flex items-start justify-between"
        style={{ background: `linear-gradient(135deg, hsl(${hsl}), hsl(${hsl} / 0.7))` }}
      >
        <div>
          <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Mata Pelajaran</p>
          <h2 className="text-xl font-bold text-white mt-0.5">{subject.name}</h2>
          <p className="text-xs text-white/80 mt-1">{subject.description}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress summary */}
      <div className="px-5 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{done} dari {total} pelajaran selesai</span>
          <span className="font-bold">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-2 rounded-full"
            style={{ background: `hsl(${hsl})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Lessons list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {subject.lessons.map((lesson, idx) => (
          <motion.button
            key={lesson.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleToggle(lesson.id, lesson.completed)}
            disabled={toggle.isPending}
            className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-muted/40 transition-colors disabled:opacity-60"
          >
            {lesson.completed ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: `hsl(${hsl})` }} />
            ) : (
              <Circle className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${lesson.completed ? "line-through text-muted-foreground" : ""}`}>
                {lesson.title}
              </p>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{lesson.duration_minutes} menit</span>
              </div>
            </div>
            {toggle.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0 mt-1" />}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default function Courses() {
  const { data: subjects, isLoading } = useCourses();
  const [selected, setSelected] = useState<Subject | null>(null);

  // Sync selected subject with fresh data
  const selectedFresh = subjects?.find((s) => s.id === selected?.id) ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mata Pelajaran</h1>
        <p className="mt-1 text-muted-foreground">
          Pilih mata pelajaran untuk melihat daftar pelajaran dan mencatat progress kamu.
        </p>
      </div>

      <div className={`grid gap-5 ${selectedFresh ? "lg:grid-cols-[1fr_380px]" : ""}`}>
        {/* Subject grid */}
        <div className={`grid gap-4 ${selectedFresh ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {(subjects ?? []).map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onClick={() => setSelected(selected?.id === subject.id ? null : subject)}
            />
          ))}
        </div>

        {/* Lesson detail panel */}
        <AnimatePresence>
          {selectedFresh && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <LessonPanel subject={selectedFresh} onClose={() => setSelected(null)} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
