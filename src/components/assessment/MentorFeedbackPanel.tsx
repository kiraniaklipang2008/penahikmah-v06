import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, CheckCircle2, Edit3, User, BookOpen } from "lucide-react";
import { useAllQuizResults, useUpsertFeedback, type QuizResultWithStudent } from "@/hooks/useQuizFeedback";
import { toast } from "sonner";

function FeedbackForm({
  result,
  onClose,
}: {
  result: QuizResultWithStudent;
  onClose: () => void;
}) {
  const [comment, setComment] = useState(result.feedback?.comment ?? "");
  const [adjustedScore, setAdjustedScore] = useState<string>(
    result.feedback?.adjusted_score?.toString() ?? ""
  );
  const upsert = useUpsertFeedback();

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast.error("Komentar tidak boleh kosong");
      return;
    }
    const scoreVal = adjustedScore.trim() ? parseInt(adjustedScore) : null;
    if (scoreVal !== null && (isNaN(scoreVal) || scoreVal < 0 || scoreVal > result.total_questions)) {
      toast.error(`Nilai harus antara 0 - ${result.total_questions}`);
      return;
    }
    upsert.mutate(
      { quizResultId: result.id, comment, adjustedScore: scoreVal },
      {
        onSuccess: () => {
          toast.success("Feedback berhasil disimpan");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const origPct = Math.round((result.score / result.total_questions) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {result.student_name}
          </span>
          <span>Skor: {result.score}/{result.total_questions} ({origPct}%)</span>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Komentar Mentor</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tulis komentar atau masukan untuk siswa..."
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">
            Nilai Manual (opsional, 0-{result.total_questions})
          </label>
          <input
            type="number"
            value={adjustedScore}
            onChange={(e) => setAdjustedScore(e.target.value)}
            placeholder={`Kosongkan untuk gunakan skor asli (${result.score})`}
            min={0}
            max={result.total_questions}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={upsert.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {upsert.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Simpan
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MentorFeedbackPanel() {
  const { data: results, isLoading } = useAllQuizResults();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subjects = [...new Set((results ?? []).map((r) => r.subject_name))].sort();
  const filtered = filterSubject === "all"
    ? results ?? []
    : (results ?? []).filter((r) => r.subject_name === filterSubject);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Feedback Mentor
          </h2>
          <p className="text-sm text-muted-foreground">Berikan komentar dan nilai manual untuk hasil kuis siswa</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
        >
          <option value="all">Semua Mata Pelajaran</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground text-sm">Belum ada hasil kuis.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((result) => {
            const pct = Math.round((result.score / result.total_questions) * 100);
            const hasFeedback = !!result.feedback;
            const adjPct = result.feedback?.adjusted_score != null
              ? Math.round((result.feedback.adjusted_score / result.total_questions) * 100)
              : null;

            return (
              <div key={result.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{result.student_name}</span>
                      {hasFeedback && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Sudah dinilai
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {result.subject_name} — {result.quiz_title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Skor: <strong className={pct >= 70 ? "text-success" : "text-destructive"}>{pct}%</strong> ({result.score}/{result.total_questions})</span>
                      {adjPct !== null && (
                        <span>Nilai Manual: <strong className="text-primary">{adjPct}%</strong></span>
                      )}
                      <span>{new Date(result.completed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {hasFeedback && result.feedback?.comment && (
                      <p className="mt-1 text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                        "{result.feedback.comment}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setEditingId(editingId === result.id ? null : result.id)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    {hasFeedback ? "Edit" : "Beri Feedback"}
                  </button>
                </div>

                <AnimatePresence>
                  {editingId === result.id && (
                    <FeedbackForm
                      result={result}
                      onClose={() => setEditingId(null)}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
