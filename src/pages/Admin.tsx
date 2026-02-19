import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdmin } from "@/hooks/useRBAC";
import { Loader2, ShieldAlert } from "lucide-react";
import UserManagement from "@/components/admin/UserManagement";
import PermissionMatrix from "@/components/admin/PermissionMatrix";

export default function Admin() {
  const { isAdmin, isSuperAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive/50" />
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="mt-1 text-muted-foreground">Kelola pengguna dan hak akses sistem</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UserManagement isSuperAdmin={isSuperAdmin} />
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          <PermissionMatrix isSuperAdmin={isSuperAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
