import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, School, Search, UserPlus, X } from "lucide-react";
import {
  useClasses, useCreateClass, useUpdateClass, useDeleteClass,
  useTeachers, useStudents, useAddStudentToClass, useRemoveStudentFromClass,
  type ClassData,
} from "@/hooks/useDataManagement";
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

function ClassForm({
  initial,
  teachers,
  onSubmit,
  isPending,
  onClose,
}: {
  initial?: ClassData;
  teachers: { id: string; full_name: string }[];
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    academic_year: initial?.academic_year ?? "",
    homeroom_teacher_id: initial?.homeroom_teacher_id ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(initial ? { id: initial.id } : {}),
      ...form,
      homeroom_teacher_id: form.homeroom_teacher_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nama Kelas *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: 10A" required />
        </div>
        <div className="space-y-2">
          <Label>Tahun Ajaran</Label>
          <Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="Contoh: 2025/2026" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Wali Kelas</Label>
          <Select value={form.homeroom_teacher_id} onValueChange={(v) => setForm({ ...form, homeroom_teacher_id: v })}>
            <SelectTrigger><SelectValue placeholder="Pilih wali kelas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tidak ada</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? "Simpan" : "Tambah Kelas"}
        </Button>
      </div>
    </form>
  );
}

function ClassStudentManager({ classData, isAdmin }: { classData: ClassData; isAdmin: boolean }) {
  const { data: allStudents } = useStudents();
  const addStudent = useAddStudentToClass();
  const removeStudent = useRemoveStudentFromClass();
  const [adding, setAdding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");

  const enrolledIds = new Set(classData.class_students.map((cs) => cs.student_id));
  const available = (allStudents ?? []).filter((s) => !enrolledIds.has(s.id) && s.status === "aktif");

  const handleAdd = async () => {
    if (!selectedStudent) return;
    try {
      await addStudent.mutateAsync({ classId: classData.id, studentId: selectedStudent });
      toast.success("Siswa berhasil ditambahkan ke kelas");
      setSelectedStudent("");
      setAdding(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemove = async (studentId: string, name: string) => {
    if (!confirm(`Keluarkan "${name}" dari kelas ini?`)) return;
    try {
      await removeStudent.mutateAsync({ classId: classData.id, studentId });
      toast.success("Siswa berhasil dikeluarkan dari kelas");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Siswa ({classData.class_students.length})
        </p>
        {isAdmin && (
          <button onClick={() => setAdding(!adding)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <UserPlus className="h-3 w-3" /> Tambah
          </button>
        )}
      </div>
      {adding && (
        <div className="flex gap-2">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
            <SelectContent>
              {available.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8" onClick={handleAdd} disabled={addStudent.isPending || !selectedStudent}>
            {addStudent.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Tambah"}
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {classData.class_students.map((cs) => (
          <span key={cs.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
            {cs.students.full_name}
            {isAdmin && (
              <button onClick={() => handleRemove(cs.student_id, cs.students.full_name)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {classData.class_students.length === 0 && (
          <span className="text-xs text-muted-foreground">Belum ada siswa</span>
        )}
      </div>
    </div>
  );
}

export default function Classes() {
  const { data: classes, isLoading } = useClasses();
  const { data: teachers } = useTeachers();
  const { isAdmin } = useIsAdmin();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassData | undefined>();
  const [search, setSearch] = useState("");

  const filtered = (classes ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.academic_year.includes(search)
  );

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await createClass.mutateAsync(data);
      toast.success("Kelas berhasil ditambahkan");
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    try {
      await updateClass.mutateAsync(data);
      toast.success("Data kelas berhasil diperbarui");
      setDialogOpen(false);
      setEditing(undefined);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kelas "${name}"?`)) return;
    try {
      await deleteClass.mutateAsync(id);
      toast.success("Kelas berhasil dihapus");
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
          <h1 className="text-2xl font-bold">Data Kelas</h1>
          <p className="mt-1 text-muted-foreground">{filtered.length} kelas terdaftar</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(undefined); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Tambah Kelas</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
              </DialogHeader>
              <ClassForm
                initial={editing}
                teachers={(teachers ?? []).filter((t) => t.status === "aktif")}
                onSubmit={editing ? handleUpdate : handleCreate}
                isPending={editing ? updateClass.isPending : createClass.isPending}
                onClose={() => { setDialogOpen(false); setEditing(undefined); }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama kelas atau tahun ajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground shadow-sm">
          <School className="mx-auto h-10 w-10 mb-2 opacity-30" />
          Belum ada data kelas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Kelas {c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.academic_year || "—"}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(c); setDialogOpen(true); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Wali Kelas: </span>
                <span className="font-medium">{c.teachers?.full_name ?? "—"}</span>
              </div>
              <ClassStudentManager classData={c} isAdmin={isAdmin} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
