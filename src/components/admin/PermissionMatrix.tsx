import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  usePermissions,
  useUpdatePermission,
  useAddResource,
  useDeleteResource,
} from "@/hooks/useRBAC";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const ROLE_ORDER = ["super_admin", "admin", "guru", "siswa"];
const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
};

const ACTION_ORDER = ["create", "read", "update", "delete"];
const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
};

export default function PermissionMatrix({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { data, isLoading } = usePermissions();
  const updatePerm = useUpdatePermission();
  const addResource = useAddResource();
  const deleteResource = useDeleteResource();
  const [newResName, setNewResName] = useState("");
  const [newResDesc, setNewResDesc] = useState("");

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { resources, permissions } = data;

  // Build lookup: role -> resource_id -> action -> allowed
  const permMap: Record<string, Record<string, Record<string, boolean>>> = {};
  for (const p of permissions) {
    if (!permMap[p.role]) permMap[p.role] = {};
    if (!permMap[p.role][p.resource_id]) permMap[p.role][p.resource_id] = {};
    permMap[p.role][p.resource_id][p.action] = p.allowed;
  }

  const isAllowed = (role: string, resId: string, action: string) =>
    permMap[role]?.[resId]?.[action] ?? false;

  const handleToggle = async (role: string, resourceId: string, action: string, current: boolean) => {
    if (!isSuperAdmin) {
      toast.error("Hanya Super Admin yang bisa mengubah permission");
      return;
    }
    try {
      await updatePerm.mutateAsync({ role, resourceId, action, allowed: !current });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddResource = async () => {
    if (!newResName.trim()) return;
    try {
      await addResource.mutateAsync({ name: newResName.trim(), description: newResDesc.trim() });
      setNewResName("");
      setNewResDesc("");
      toast.success("Resource berhasil ditambahkan");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteResource = async (id: string, name: string) => {
    if (!confirm(`Hapus resource "${name}"? Semua permission terkait akan dihapus.`)) return;
    try {
      await deleteResource.mutateAsync(id);
      toast.success("Resource berhasil dihapus");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Matrix */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-muted/50 z-10">Resource</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                {ROLE_ORDER.map((r) => (
                  <th key={r} className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((res) =>
                ACTION_ORDER.map((action, ai) => (
                  <tr
                    key={`${res.id}-${action}`}
                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${ai === 0 ? "border-t-2 border-t-border" : ""}`}
                  >
                    {ai === 0 && (
                      <td
                        className="px-4 py-3 font-medium sticky left-0 bg-card z-10 align-top"
                        rowSpan={ACTION_ORDER.length}
                      >
                        <div className="flex items-start gap-2">
                          <div>
                            <p className="font-semibold capitalize">{res.name}</p>
                            {res.description && (
                              <p className="text-xs text-muted-foreground">{res.description}</p>
                            )}
                          </div>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteResource(res.id, res.name)}
                              className="mt-0.5 text-muted-foreground hover:text-destructive transition-colors"
                              title="Hapus resource"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-2 text-muted-foreground">
                      {ACTION_LABELS[action] ?? action}
                    </td>
                    {ROLE_ORDER.map((role) => {
                      const allowed = isAllowed(role, res.id, action);
                      return (
                        <td key={role} className="px-3 py-2 text-center">
                          <Checkbox
                            checked={allowed}
                            onCheckedChange={() => handleToggle(role, res.id, action, allowed)}
                            disabled={!isSuperAdmin || updatePerm.isPending}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Resource */}
      {isSuperAdmin && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tambah Resource Baru
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nama resource (contoh: assignments)"
              value={newResName}
              onChange={(e) => setNewResName(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              placeholder="Deskripsi (opsional)"
              value={newResDesc}
              onChange={(e) => setNewResDesc(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleAddResource}
              disabled={!newResName.trim() || addResource.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {addResource.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
