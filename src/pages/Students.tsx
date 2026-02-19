import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, type Student } from "@/hooks/useDataManagement";
import { useIsAdmin } from "@/hooks/useRBAC";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "aktif", label: "Aktif" },
  { value: "lulus", label: "Lulus" },
  { value: "keluar", label: "Keluar" },
];

const GENDER_OPTIONS = [
  { value: "L", label: "Laki-laki" },
  { value: "P", label: "Perempuan" },
];

const STATUS_COLORS: Record<string, string> = {
  aktif: "bg-emerald-100 text-emerald-700",
  lulus: "bg-blue-100 text-blue-700",
  keluar: "bg-red-100 text-red-700",
};

function StudentForm({
  initial,
  onSubmit,
  isPending,
  onClose,
}: {
  initial?: Student;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    nisn: initial?.nisn ?? "",
    birth_place: initial?.birth_place ?? "",
    birth_date: initial?.birth_date ?? "",
    gender: initial?.gender ?? "",
    address: initial?.address ?? "",
    parent_name: initial?.parent_name ?? "",
    parent_phone: initial?.parent_phone ?? "",
    enrollment_year: initial?.enrollment_year?.toString() ?? "",
    status: initial?.status ?? "aktif",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(initial ? { id: initial.id } : {}),
      ...form,
      enrollment_year: form.enrollment_year ? parseInt(form.enrollment_year) : null,
      birth_date: form.birth_date || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nama Lengkap *</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>NISN</Label>
          <Input value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Tempat Lahir</Label>
          <Input value={form.birth_place} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Tanggal Lahir</Label>
          <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Jenis Kelamin</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tahun Masuk</Label>
          <Input type="number" value={form.enrollment_year} onChange={(e) => setForm({ ...form, enrollment_year: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Alamat</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Nama Orang Tua</Label>
          <Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>No. HP Orang Tua</Label>
          <Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? "Simpan" : "Tambah Siswa"}
        </Button>
      </div>
    </form>
  );
}

export default function Students() {
  const { data: students, isLoading } = useStudents();
  const { isAdmin } = useIsAdmin();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | undefined>();
  const [search, setSearch] = useState("");

  const filtered = (students ?? []).filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.nisn.includes(search)
  );

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await createStudent.mutateAsync(data);
      toast.success("Siswa berhasil ditambahkan");
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    try {
      await updateStudent.mutateAsync(data);
      toast.success("Data siswa berhasil diperbarui");
      setDialogOpen(false);
      setEditing(undefined);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data siswa "${name}"?`)) return;
    try {
      await deleteStudent.mutateAsync(id);
      toast.success("Data siswa berhasil dihapus");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Siswa</h1>
          <p className="mt-1 text-muted-foreground">{filtered.length} siswa terdaftar</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(undefined); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Tambah Siswa</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
              </DialogHeader>
              <StudentForm
                initial={editing}
                onSubmit={editing ? handleUpdate : handleCreate}
                isPending={editing ? updateStudent.isPending : createStudent.isPending}
                onClose={() => { setDialogOpen(false); setEditing(undefined); }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau NISN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-left font-semibold">NISN</th>
                <th className="px-4 py-3 text-left font-semibold">JK</th>
                <th className="px-4 py-3 text-left font-semibold">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold">Orang Tua</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                {isAdmin && <th className="px-4 py-3 text-center font-semibold">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="mx-auto h-10 w-10 mb-2 opacity-30" />
                    Belum ada data siswa
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{s.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.nisn || "—"}</td>
                    <td className="px-4 py-3">{s.gender === "L" ? "L" : s.gender === "P" ? "P" : "—"}</td>
                    <td className="px-4 py-3">
                      {s.class_students?.map((cs) => cs.classes?.name).filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.parent_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground"}`}>
                        {s.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditing(s); setDialogOpen(true); }}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.full_name)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
