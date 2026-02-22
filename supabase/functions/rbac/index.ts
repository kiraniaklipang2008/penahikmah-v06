import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return err("Missing auth", 401);

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return err("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const { action } = body as { action: string };

    // Helper: get caller's roles
    async function callerRoles(): Promise<string[]> {
      const { data } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.role);
    }

    // Helper: check if caller is super_admin or admin
    async function requireAdmin() {
      const roles = await callerRoles();
      if (!roles.includes("super_admin") && !roles.includes("admin")) {
        throw new Error("Forbidden");
      }
      return roles;
    }

    async function requireSuperAdmin() {
      const roles = await callerRoles();
      if (!roles.includes("super_admin")) {
        throw new Error("Forbidden: super_admin required");
      }
      return roles;
    }

    switch (action) {
      // ── Get current user's roles ──
      case "get_my_roles": {
        const roles = await callerRoles();
        return json({ roles });
      }

      // ── List all users with their roles ──
      case "list_users": {
        await requireAdmin();
        // Get all profiles
        const { data: profiles, error: pErr } = await admin
          .from("profiles")
          .select("user_id, full_name, class, avatar_url, created_at");
        if (pErr) throw pErr;

        // Get all user_roles
        const { data: allRoles, error: rErr } = await admin
          .from("user_roles")
          .select("user_id, role");
        if (rErr) throw rErr;

        const roleMap: Record<string, string[]> = {};
        for (const r of allRoles ?? []) {
          if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
          roleMap[r.user_id].push(r.role);
        }

        // Get emails from auth.users via admin
        const { data: { users: authUsers }, error: auErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
        if (auErr) throw auErr;

        const emailMap: Record<string, string> = {};
        for (const u of authUsers ?? []) {
          emailMap[u.id] = u.email ?? "";
        }

        const users = (profiles ?? []).map((p: any) => ({
          ...p,
          email: emailMap[p.user_id] ?? "",
          roles: roleMap[p.user_id] ?? ["siswa"],
        }));

        return json({ users });
      }

      // ── Assign role to user ──
      case "assign_role": {
        const { target_user_id, role } = body as any;
        if (!target_user_id || !role) return err("Missing target_user_id or role");

        // Only super_admin can assign super_admin/admin roles
        const callerR = await callerRoles();
        if ((role === "super_admin" || role === "admin") && !callerR.includes("super_admin")) {
          return err("Only super_admin can assign admin roles", 403);
        }
        if (!callerR.includes("super_admin") && !callerR.includes("admin")) {
          return err("Forbidden", 403);
        }

        const { error: insErr } = await admin
          .from("user_roles")
          .upsert({ user_id: target_user_id, role }, { onConflict: "user_id,role" });
        if (insErr) throw insErr;

        return json({ success: true });
      }

      // ── Remove role from user ──
      case "remove_role": {
        const { target_user_id, role } = body as any;
        if (!target_user_id || !role) return err("Missing target_user_id or role");

        const callerR = await callerRoles();
        if ((role === "super_admin" || role === "admin") && !callerR.includes("super_admin")) {
          return err("Only super_admin can remove admin roles", 403);
        }
        if (!callerR.includes("super_admin") && !callerR.includes("admin")) {
          return err("Forbidden", 403);
        }

        // Don't allow removing last role
        const { data: currentRoles } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", target_user_id);
        if ((currentRoles ?? []).length <= 1) {
          return err("Cannot remove last role");
        }

        const { error: delErr } = await admin
          .from("user_roles")
          .delete()
          .eq("user_id", target_user_id)
          .eq("role", role);
        if (delErr) throw delErr;

        return json({ success: true });
      }

      // ── Get permission matrix ──
      case "get_permissions": {
        await requireAdmin();

        const { data: resources } = await admin
          .from("resources")
          .select("id, name, description")
          .order("name");

        const { data: perms } = await admin
          .from("role_permissions")
          .select("role, resource_id, action, allowed");

        return json({ resources: resources ?? [], permissions: perms ?? [] });
      }

      // ── Update permission ──
      case "update_permission": {
        await requireSuperAdmin();
        const { role, resource_id, permission_action, allowed } = body as any;
        if (!role || !resource_id || !permission_action || allowed === undefined) {
          return err("Missing fields");
        }

        const { error: upErr } = await admin
          .from("role_permissions")
          .upsert(
            { role, resource_id, action: permission_action, allowed },
            { onConflict: "role,resource_id,action" }
          );
        if (upErr) throw upErr;

        return json({ success: true });
      }

      // ── Add custom resource ──
      case "add_resource": {
        await requireSuperAdmin();
        const { name, description } = body as any;
        if (!name) return err("Missing resource name");

        const { data: res, error: resErr } = await admin
          .from("resources")
          .insert({ name, description: description ?? "" })
          .select()
          .single();
        if (resErr) throw resErr;

        // Create default permission entries for all roles
        const roles: string[] = ["super_admin", "admin", "guru", "siswa"];
        const actions = ["create", "read", "update", "delete"];
        const entries = roles.flatMap((role) =>
          actions.map((action) => ({
            role,
            resource_id: res.id,
            action,
            allowed: role === "super_admin",
          }))
        );

        await admin.from("role_permissions").insert(entries);

        return json({ resource: res });
      }

      // ── Delete resource ──
      case "delete_resource": {
        await requireSuperAdmin();
        const { resource_id } = body as any;
        if (!resource_id) return err("Missing resource_id");

        const { error: delErr } = await admin
          .from("resources")
          .delete()
          .eq("id", resource_id);
        if (delErr) throw delErr;

        return json({ success: true });
      }

      // ── Check permission (for any caller) ──
      case "check_permission": {
        const { resource, permission_action } = body as any;
        if (!resource || !permission_action) return err("Missing resource or action");

        const { data } = await admin.rpc("has_permission", {
          _user_id: user.id,
          _resource: resource,
          _action: permission_action,
        });

        return json({ allowed: !!data });
      }

      // ── Get all quiz results for feedback (guru/admin) ──
      case "get_quiz_results_for_feedback": {
        const roles = await callerRoles();
        if (!roles.includes("super_admin") && !roles.includes("admin") && !roles.includes("guru")) {
          return err("Forbidden", 403);
        }

        const { data: results, error: qrErr } = await admin
          .from("quiz_results")
          .select("id, quiz_id, user_id, score, total_questions, completed_at")
          .order("completed_at", { ascending: false });
        if (qrErr) throw qrErr;

        // Get profiles for student names
        const { data: profiles } = await admin
          .from("profiles")
          .select("user_id, full_name");
        const nameMap: Record<string, string> = {};
        for (const p of profiles ?? []) nameMap[p.user_id] = p.full_name;

        // Get quiz info
        const { data: quizzes } = await admin
          .from("quizzes")
          .select("id, title, subject_id, subjects(name)");
        const quizMap: Record<string, { title: string; subject_name: string }> = {};
        for (const q of quizzes ?? []) {
          quizMap[q.id] = { title: q.title, subject_name: (q as any).subjects?.name ?? "" };
        }

        // Get existing feedback
        const resultIds = (results ?? []).map((r: any) => r.id);
        let feedbackMap: Record<string, any> = {};
        if (resultIds.length > 0) {
          const { data: feedbacks } = await admin
            .from("quiz_feedback")
            .select("*")
            .in("quiz_result_id", resultIds);
          for (const fb of feedbacks ?? []) {
            feedbackMap[fb.quiz_result_id] = fb;
          }
        }

        const mapped = (results ?? []).map((r: any) => ({
          ...r,
          student_name: nameMap[r.user_id] ?? "Unknown",
          quiz_title: quizMap[r.quiz_id]?.title ?? "",
          subject_name: quizMap[r.quiz_id]?.subject_name ?? "",
          feedback: feedbackMap[r.id] ?? null,
        }));

        return json({ results: mapped });
      }

      default:
        return err(`Unknown action: ${action}`);
    }
  } catch (e: any) {
    console.error(e);
    if (e.message === "Forbidden" || e.message?.includes("Forbidden")) {
      return err(e.message, 403);
    }
    return err(e.message ?? "Internal error", 500);
  }
});
