import { useState, useRef } from "react";
import { Loader2, Plus, Pencil, Trash2, Users, Search, Download, Upload, FileDown } from "lucide-react";
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, useExportTeachers, useImportTeachers, type Teacher } from "@/hooks/useDataManagement";
import { useIsAdmin } from "@/hooks/useRBAC";
import { toast } from "sonner";
import { exportToCsv, downloadTemplate, parseCsv, TEACHER_CSV_HEADERS } from "@/lib/csv";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_OPTIONS = [
  { value: "aktif", label: "Aktif" },
  { value: "nonaktif", label: "Nonaktif" },
];

const STATUS_COLORS: Record<string, string> = {
  aktif: "bg-emerald-100 text-emerald-700",
  nonaktif: "bg-red-100 text-red-700",
};

function TeacherForm({
  initial,
  onSubmit,
  isPending,
  onClose,
}: {
  initial?: Teacher;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    nip: initial?.nip ?? "",
    subject: initial?.subject ?? "",
    education: initial?.education ?? "",
    phone: initial?.phone ?? "",
    status: initial?.status ?? "aktif",
    position: initial?.position ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(initial ? { id: initial.id } : {}),
      ...form,
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
          <Label>NIP/NUPTK</Label>
          <Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Mata Pelajaran</Label>
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Pendidikan Terakhir</Label>
          <Input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>No. HP</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Jabatan</Label>
          <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
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
          {initial ? "Simpan" : "Tambah Guru"}
        </Button>
      </div>
    </form>
  );
}

export default function Teachers() {
  const { data: teachers, isLoading } = useTeachers();
  const { isAdmin } = useIsAdmin();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const exportTeachers = useExportTeachers();
  const importTeachers = useImportTeachers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | undefined>();
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = (teachers ?? []).filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.nip.includes(search)
  );

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await createTeacher.mutateAsync(data);
      toast.success("Guru berhasil ditambahkan");
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    try {
      await updateTeacher.mutateAsync(data);
      toast.success("Data guru berhasil diperbarui");
      setDialogOpen(false);
      setEditing(undefined);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data guru "${name}"?`)) return;
    try {
      await deleteTeacher.mutateAsync(id);
      toast.success("Data guru berhasil dihapus");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExport = async () => {
    try {
      const rows = await exportTeachers.mutateAsync();
      exportToCsv("data-guru.csv", rows);
      toast.success("Data guru berhasil di-export");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { toast.error("File CSV kosong atau format salah"); return; }
      const count = await importTeachers.mutateAsync(rows);
      toast.success(`${count} guru berhasil di-import`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Guru</h1>
          <p className="mt-1 text-muted-foreground">{filtered.length} guru terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />Export / Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport} disabled={exportTeachers.isPending}>
                <Download className="mr-2 h-4 w-4" />Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadTemplate("template-guru.csv", TEACHER_CSV_HEADERS)}>
                <FileDown className="mr-2 h-4 w-4" />Download Template
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={importTeachers.isPending}>
                  <Upload className="mr-2 h-4 w-4" />Import CSV
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(undefined); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Tambah Guru</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Guru" : "Tambah Guru Baru"}</DialogTitle>
              </DialogHeader>
              <TeacherForm
                initial={editing}
                onSubmit={editing ? handleUpdate : handleCreate}
                isPending={editing ? updateTeacher.isPending : createTeacher.isPending}
                onClose={() => { setDialogOpen(false); setEditing(undefined); }}
              />
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau NIP..."
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
                <th className="px-4 py-3 text-left font-semibold">NIP/NUPTK</th>
                <th className="px-4 py-3 text-left font-semibold">Mata Pelajaran</th>
                <th className="px-4 py-3 text-left font-semibold">Jabatan</th>
                <th className="px-4 py-3 text-left font-semibold">No. HP</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                {isAdmin && <th className="px-4 py-3 text-center font-semibold">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="mx-auto h-10 w-10 mb-2 opacity-30" />
                    Belum ada data guru
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{t.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.nip || "—"}</td>
                    <td className="px-4 py-3">{t.subject || "—"}</td>
                    <td className="px-4 py-3">{t.position || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[t.status] ?? "bg-muted text-muted-foreground"}`}>
                        {t.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditing(t); setDialogOpen(true); }}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, t.full_name)}
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
