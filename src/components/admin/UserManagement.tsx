import { useState } from "react";
import { Loader2, UserPlus, Shield, X } from "lucide-react";
import { useUserList, useAssignRole, useRemoveRole, type RbacUser } from "@/hooks/useRBAC";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive",
  admin: "bg-primary/10 text-primary",
  guru: "bg-info/10 text-info",
  siswa: "bg-muted text-muted-foreground",
};

const ALL_ROLES = ["super_admin", "admin", "guru", "siswa"];

export default function UserManagement({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { data: users, isLoading } = useUserList();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const handleAssign = async (userId: string, role: string) => {
    try {
      await assignRole.mutateAsync({ userId, role });
      toast.success(`Role ${ROLE_LABELS[role]} berhasil ditambahkan`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemove = async (userId: string, role: string) => {
    try {
      await removeRole.mutateAsync({ userId, role });
      toast.success(`Role ${ROLE_LABELS[role]} berhasil dihapus`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold">Nama</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Kelas</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.user_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">{u.class || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[r] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {ROLE_LABELS[r] ?? r}
                        {editingUser === u.user_id && u.roles.length > 1 && (
                          <button
                            onClick={() => handleRemove(u.user_id, r)}
                            className="ml-0.5 hover:text-destructive"
                            disabled={removeRole.isPending}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {editingUser === u.user_id ? (
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {ALL_ROLES.filter(
                        (r) => !u.roles.includes(r) && (isSuperAdmin || (r !== "super_admin" && r !== "admin"))
                      ).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleAssign(u.user_id, r)}
                          disabled={assignRole.isPending}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <UserPlus className="h-3 w-3" />
                          {ROLE_LABELS[r]}
                        </button>
                      ))}
                      <button
                        onClick={() => setEditingUser(null)}
                        className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        Selesai
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingUser(u.user_id)}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Kelola Role
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
