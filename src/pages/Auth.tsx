import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

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
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">EduLMS</h1>
          <p className="mt-1 text-muted-foreground">
            {isLogin ? "Masuk ke akun kamu" : "Buat akun baru"}
          </p>
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
