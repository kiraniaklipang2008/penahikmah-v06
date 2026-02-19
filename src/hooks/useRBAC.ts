import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function invokeRbac(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("rbac", {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message ?? "RBAC request failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── Current user's roles ──
export function useMyRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const data = await invokeRbac("get_my_roles");
      return data.roles as string[];
    },
  });
}

export function useIsAdmin() {
  const { data: roles, isLoading } = useMyRoles();
  const isAdmin = roles?.includes("super_admin") || roles?.includes("admin");
  const isSuperAdmin = roles?.includes("super_admin");
  return { isAdmin: !!isAdmin, isSuperAdmin: !!isSuperAdmin, roles: roles ?? [], isLoading };
}

// ── User list ──
export interface RbacUser {
  user_id: string;
  full_name: string;
  class: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

export function useUserList() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const data = await invokeRbac("list_users");
      return data.users as RbacUser[];
    },
  });
}

// ── Role management ──
export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return invokeRbac("assign_role", { target_user_id: userId, role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return invokeRbac("remove_role", { target_user_id: userId, role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

// ── Permission matrix ──
export interface RbacResource {
  id: string;
  name: string;
  description: string;
}

export interface RbacPermission {
  role: string;
  resource_id: string;
  action: string;
  allowed: boolean;
}

export function usePermissions() {
  return useQuery({
    queryKey: ["admin-permissions"],
    queryFn: async () => {
      const data = await invokeRbac("get_permissions");
      return {
        resources: data.resources as RbacResource[],
        permissions: data.permissions as RbacPermission[],
      };
    },
  });
}

export function useUpdatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      role,
      resourceId,
      action,
      allowed,
    }: {
      role: string;
      resourceId: string;
      action: string;
      allowed: boolean;
    }) => {
      return invokeRbac("update_permission", {
        role,
        resource_id: resourceId,
        permission_action: action,
        allowed,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-permissions"] });
    },
  });
}

// ── Resource management ──
export function useAddResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      return invokeRbac("add_resource", { name, description });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-permissions"] });
    },
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resourceId: string) => {
      return invokeRbac("delete_resource", { resource_id: resourceId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-permissions"] });
    },
  });
}

// ── Check single permission ──
export function useCheckPermission(resource: string, action: string) {
  return useQuery({
    queryKey: ["check-permission", resource, action],
    queryFn: async () => {
      const data = await invokeRbac("check_permission", {
        resource,
        permission_action: action,
      });
      return data.allowed as boolean;
    },
  });
}
