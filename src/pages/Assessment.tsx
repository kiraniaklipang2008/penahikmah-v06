import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Zap, FlaskConical, Leaf, BookText, Globe, BookOpen,
  Clock, ChevronRight, CheckCircle2, XCircle, Trophy, RotateCcw, Loader2, ArrowLeft,
} from "lucide-react";
import { useAssessment, useSubmitQuiz, type Quiz, type Question } from "@/hooks/useAssessment";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ElementType> = {
  Calculator, Zap, FlaskConical, Leaf, BookText, Globe, BookOpen,
};

const COLOR_MAP: Record<string, string> = {
  blue:    "168 60% 38%",
  yellow:  "38 90% 55%",
  green:   "145 60% 42%",
  emerald: "160 60% 38%",
  red:     "340 65% 55%",
  purple:  "270 55% 55%",
};

// ─── Quiz Card ────────────────────────────────────────────────────────────────
function QuizCard({ quiz, onStart }: { quiz: Quiz; onStart: () => void }) {
  const Icon = ICON_MAP[quiz.subject_icon] ?? BookOpen;
  const hsl = COLOR_MAP[quiz.subject_color] ?? COLOR_MAP.blue;
  const hasBest = quiz.bestScore !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card shadow-sm overflow-hidden"
    >
      {/* Coloured header */}
      <div
        className="flex h-20 items-end p-4"
        style={{ background: `linear-gradient(135deg, hsl(${hsl}), hsl(${hsl} / 0.65))` }}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5 text-white/90" />
          <div>
            <p className="text-xs text-white/70">{quiz.subject_name}</p>
            <h3 className="text-sm font-bold text-white leading-tight">{quiz.title}</h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {quiz.duration_minutes} menit
          </span>
          <span>{quiz.totalQuestions} soal</span>
        </div>

        {hasBest && (
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs text-muted-foreground">Skor terbaik:</span>
            <span
              className="text-xs font-bold"
              style={{ color: `hsl(${hsl})` }}
            >
              {quiz.bestScore}%
            </span>
          </div>
        )}

        <button
          onClick={onStart}
          className="w-full rounded-lg py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: `hsl(${hsl})` }}
        >
          {hasBest ? "Kerjakan Lagi" : "Mulai Kuis"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  const pct = (remaining / seconds) * 100;
  const urgent = remaining <= 30;

  return (
    <div className="flex items-center gap-2">
      <Clock className={`h-4 w-4 ${urgent ? "text-destructive" : "text-muted-foreground"}`} />
      <span className={`font-mono text-sm font-bold tabular-nums ${urgent ? "text-destructive" : ""}`}>
        {m}:{s}
      </span>
      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: urgent ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

// ─── Quiz Runner ──────────────────────────────────────────────────────────────
function QuizRunner({
  quiz,
  onFinish,
  onBack,
}: {
  quiz: Quiz;
  onFinish: (score: number) => void;
  onBack: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const hsl = COLOR_MAP[quiz.subject_color] ?? COLOR_MAP.blue;

  const question: Question = quiz.questions[currentIdx];
  const totalQ = quiz.questions.length;
  const progress = ((currentIdx + 1) / totalQ) * 100;
  const selectedOption = answers[question.id];

  const handleSelect = (optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const handleNext = () => {
    if (currentIdx < totalQ - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = useCallback(() => {
    let correct = 0;
    for (const q of quiz.questions) {
      const chosen = answers[q.id];
      if (chosen && q.options.find((o) => o.id === chosen)?.is_correct) correct++;
    }
    onFinish(correct);
  }, [quiz.questions, answers, onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <Timer
          seconds={quiz.duration_minutes * 60}
          onExpire={handleSubmit}
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{quiz.title}</span>
          <span>Soal {currentIdx + 1} / {totalQ}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-2 rounded-full"
            style={{ background: `hsl(${hsl})` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border bg-card p-6 shadow-sm space-y-5"
        >
          <p className="text-base font-semibold leading-relaxed">{question.question_text}</p>

          <div className="space-y-2.5">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full text-left rounded-lg border p-3.5 text-sm transition-all ${
                    isSelected
                      ? "border-primary bg-primary/8 font-medium"
                      : "hover:border-primary/40 hover:bg-muted/40"
                  }`}
                  style={isSelected ? { borderColor: `hsl(${hsl})`, background: `hsl(${hsl} / 0.08)` } : {}}
                >
                  {option.option_text}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: `hsl(${hsl})` }}
            >
              {currentIdx < totalQ - 1 ? (
                <>Selanjutnya <ChevronRight className="h-4 w-4" /></>
              ) : (
                "Selesai"
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────
function ResultScreen({
  quiz,
  score,
  onRetry,
  onBack,
}: {
  quiz: Quiz;
  score: number;
  onRetry: () => void;
  onBack: () => void;
}) {
  const hsl = COLOR_MAP[quiz.subject_color] ?? COLOR_MAP.blue;
  const pct = Math.round((score / quiz.totalQuestions) * 100);
  const passed = pct >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto rounded-xl border bg-card shadow-sm overflow-hidden"
    >
      <div
        className="p-8 text-center"
        style={{ background: `linear-gradient(135deg, hsl(${hsl}), hsl(${hsl} / 0.65))` }}
      >
        {passed ? (
          <CheckCircle2 className="h-14 w-14 text-white mx-auto mb-3" />
        ) : (
          <XCircle className="h-14 w-14 text-white mx-auto mb-3" />
        )}
        <p className="text-white/80 text-sm font-medium">{quiz.title}</p>
        <p className="text-5xl font-bold text-white mt-1">{pct}%</p>
        <p className="text-white/80 text-sm mt-1">{score} dari {quiz.totalQuestions} benar</p>
      </div>

      <div className="p-6 space-y-4">
        <div className={`rounded-lg px-4 py-3 text-sm font-medium text-center ${
          passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        }`}>
          {passed ? "🎉 Selamat! Kamu lulus kuis ini." : "📚 Terus belajar dan coba lagi!"}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            Kembali
          </button>
          <button
            onClick={onRetry}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `hsl(${hsl})` }}
          >
            <RotateCcw className="h-4 w-4" /> Ulangi
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Assessment Page ─────────────────────────────────────────────────────
type Screen = "list" | "quiz" | "result";

export default function Assessment() {
  const { data: quizzes, isLoading } = useAssessment();
  const submitQuiz = useSubmitQuiz();

  const [screen, setScreen] = useState<Screen>("list");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [quizKey, setQuizKey] = useState(0); // forces quiz reset on retry

  const handleStart = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizKey((k) => k + 1);
    setScreen("quiz");
  };

  const handleFinish = useCallback(
    (score: number) => {
      if (!activeQuiz) return;
      setFinalScore(score);
      setScreen("result");
      submitQuiz.mutate(
        { quizId: activeQuiz.id, score, totalQuestions: activeQuiz.totalQuestions },
        { onError: () => toast.error("Gagal menyimpan skor") }
      );
    },
    [activeQuiz, submitQuiz]
  );

  const handleRetry = () => {
    if (!activeQuiz) return;
    setQuizKey((k) => k + 1);
    setScreen("quiz");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header (only on list screen) */}
      {screen === "list" && (
        <div>
          <h1 className="text-2xl font-bold">Asesmen</h1>
          <p className="mt-1 text-muted-foreground">
            Pilih kuis untuk menguji pemahaman kamu per mata pelajaran.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {screen === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {(quizzes ?? []).map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} onStart={() => handleStart(quiz)} />
            ))}
          </motion.div>
        )}

        {screen === "quiz" && activeQuiz && (
          <motion.div key={`quiz-${quizKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuizRunner
              key={quizKey}
              quiz={activeQuiz}
              onFinish={handleFinish}
              onBack={() => setScreen("list")}
            />
          </motion.div>
        )}

        {screen === "result" && activeQuiz && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultScreen
              quiz={activeQuiz}
              score={finalScore}
              onRetry={handleRetry}
              onBack={() => setScreen("list")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
