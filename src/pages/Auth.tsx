import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Mail, Lock, User, Loader2, ShieldCheck, Shield, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { email: "superadmin@penahikmah.sch.id", password: "SuperAdmin@2026", label: "Super Admin", icon: ShieldCheck, color: "bg-red-500/10 text-red-600 border-red-200" },
  { email: "admin@penahikmah.sch.id", password: "Admin@2026", label: "Admin", icon: Shield, color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  { email: "guru@penahikmah.sch.id", password: "Guru@2026", label: "Guru", icon: BookOpen, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { email: "siswa@penahikmah.sch.id", password: "Siswa@2026", label: "Siswa", icon: Users, color: "bg-green-500/10 text-green-600 border-green-200" },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDemoLogin = async (email: string, password: string) => {
    setDemoLoading(email);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Berhasil masuk!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk dengan akun demo");
    } finally {
      setDemoLoading(null);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Berhasil masuk!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Registrasi berhasil! Silakan cek email untuk verifikasi.");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">PKBM Pena Hikmah</h1>
          <p className="mt-1 text-muted-foreground">
            {isLogin ? "Masuk ke akun kamu" : "Buat akun baru"}
          </p>
        </div>

        {/* Demo Login */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={!!demoLoading}
                onClick={() => handleDemoLogin(acc.email, acc.password)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50 ${acc.color}`}
              >
                {demoLoading === acc.email ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <acc.icon className="h-4 w-4" />
                )}
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">atau</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmad Siswa"
                  required
                  className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLogin ? "Masuk" : "Daftar"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-primary hover:underline"
          >
            {isLogin ? "Daftar" : "Masuk"}
          </button>
        </p>
      </div>
    </div>
  );
}
