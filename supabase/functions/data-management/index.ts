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

    // Helper: require admin or guru
    async function requireAdminOrGuru() {
      const roles = await callerRoles();
      if (!roles.includes("super_admin") && !roles.includes("admin") && !roles.includes("guru")) {
        throw new Error("Forbidden");
      }
      return roles;
    }

    async function requireAdmin() {
      const roles = await callerRoles();
      if (!roles.includes("super_admin") && !roles.includes("admin")) {
        throw new Error("Forbidden");
      }
      return roles;
    }

    switch (action) {
      // ══════════════════════════════
      // STUDENTS
      // ══════════════════════════════
      case "list_students": {
        await requireAdminOrGuru();
        const { data, error: e } = await admin
          .from("students")
          .select("*, class_students(class_id, classes(id, name, academic_year))")
          .order("full_name");
        if (e) throw e;
        return json({ students: data ?? [] });
      }

      case "get_student": {
        await requireAdminOrGuru();
        const { id } = body as any;
        if (!id) return err("Missing id");
        const { data, error: e } = await admin
          .from("students")
          .select("*, class_students(class_id, classes(id, name, academic_year))")
          .eq("id", id)
          .single();
        if (e) throw e;
        return json({ student: data });
      }

      case "create_student": {
        await requireAdmin();
        const { full_name, nisn, birth_place, birth_date, gender, address, parent_name, parent_phone, enrollment_year, status, class_id } = body as any;
        if (!full_name) return err("Nama siswa wajib diisi");

        const { data, error: e } = await admin
          .from("students")
          .insert({
            full_name,
            nisn: nisn ?? "",
            birth_place: birth_place ?? "",
            birth_date: birth_date || null,
            gender: gender ?? "",
            address: address ?? "",
            parent_name: parent_name ?? "",
            parent_phone: parent_phone ?? "",
            enrollment_year: enrollment_year || null,
            status: status ?? "aktif",
          })
          .select()
          .single();
        if (e) throw e;

        // Assign to class if provided
        if (class_id && data) {
          await admin.from("class_students").insert({ class_id, student_id: data.id });
        }

        return json({ student: data });
      }

      case "update_student": {
        await requireAdmin();
        const { id, ...updates } = body as any;
        if (!id) return err("Missing id");

        const allowedFields = ["full_name", "nisn", "birth_place", "birth_date", "gender", "address", "parent_name", "parent_phone", "enrollment_year", "status", "user_id"];
        const filtered: Record<string, any> = {};
        for (const k of allowedFields) {
          if (updates[k] !== undefined) filtered[k] = updates[k];
        }

        const { data, error: e } = await admin
          .from("students")
          .update(filtered)
          .eq("id", id)
          .select()
          .single();
        if (e) throw e;
        return json({ student: data });
      }

      case "delete_student": {
        await requireAdmin();
        const { id } = body as any;
        if (!id) return err("Missing id");
        const { error: e } = await admin.from("students").delete().eq("id", id);
        if (e) throw e;
        return json({ success: true });
      }

      // ══════════════════════════════
      // TEACHERS
      // ══════════════════════════════
      case "list_teachers": {
        await requireAdminOrGuru();
        const { data, error: e } = await admin
          .from("teachers")
          .select("*")
          .order("full_name");
        if (e) throw e;
        return json({ teachers: data ?? [] });
      }

      case "get_teacher": {
        await requireAdminOrGuru();
        const { id } = body as any;
        if (!id) return err("Missing id");
        const { data, error: e } = await admin
          .from("teachers")
          .select("*")
          .eq("id", id)
          .single();
        if (e) throw e;
        return json({ teacher: data });
      }

      case "create_teacher": {
        await requireAdmin();
        const { full_name, nip, subject, education, phone, status, position } = body as any;
        if (!full_name) return err("Nama guru wajib diisi");

        const { data, error: e } = await admin
          .from("teachers")
          .insert({
            full_name,
            nip: nip ?? "",
            subject: subject ?? "",
            education: education ?? "",
            phone: phone ?? "",
            status: status ?? "aktif",
            position: position ?? "",
          })
          .select()
          .single();
        if (e) throw e;
        return json({ teacher: data });
      }

      case "update_teacher": {
        await requireAdmin();
        const { id, ...updates } = body as any;
        if (!id) return err("Missing id");

        const allowedFields = ["full_name", "nip", "subject", "education", "phone", "status", "position", "user_id"];
        const filtered: Record<string, any> = {};
        for (const k of allowedFields) {
          if (updates[k] !== undefined) filtered[k] = updates[k];
        }

        const { data, error: e } = await admin
          .from("teachers")
          .update(filtered)
          .eq("id", id)
          .select()
          .single();
        if (e) throw e;
        return json({ teacher: data });
      }

      case "delete_teacher": {
        await requireAdmin();
        const { id } = body as any;
        if (!id) return err("Missing id");
        const { error: e } = await admin.from("teachers").delete().eq("id", id);
        if (e) throw e;
        return json({ success: true });
      }

      // ══════════════════════════════
      // CLASSES
      // ══════════════════════════════
      case "list_classes": {
        await requireAdminOrGuru();
        const { data, error: e } = await admin
          .from("classes")
          .select("*, teachers:homeroom_teacher_id(id, full_name), class_students(id, student_id, students(id, full_name, nisn))")
          .order("name");
        if (e) throw e;
        return json({ classes: data ?? [] });
      }

      case "get_class": {
        await requireAdminOrGuru();
        const { id } = body as any;
        if (!id) return err("Missing id");
        const { data, error: e } = await admin
          .from("classes")
          .select("*, teachers:homeroom_teacher_id(id, full_name), class_students(id, student_id, students(id, full_name, nisn, status))")
          .eq("id", id)
          .single();
        if (e) throw e;
        return json({ class: data });
      }

      case "create_class": {
        await requireAdmin();
        const { name, academic_year, homeroom_teacher_id } = body as any;
        if (!name) return err("Nama kelas wajib diisi");

        const { data, error: e } = await admin
          .from("classes")
          .insert({
            name,
            academic_year: academic_year ?? "",
            homeroom_teacher_id: homeroom_teacher_id || null,
          })
          .select("*, teachers:homeroom_teacher_id(id, full_name)")
          .single();
        if (e) throw e;
        return json({ class: data });
      }

      case "update_class": {
        await requireAdmin();
        const { id, name, academic_year, homeroom_teacher_id } = body as any;
        if (!id) return err("Missing id");

        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (academic_year !== undefined) updates.academic_year = academic_year;
        if (homeroom_teacher_id !== undefined) updates.homeroom_teacher_id = homeroom_teacher_id || null;

        const { data, error: e } = await admin
          .from("classes")
          .update(updates)
          .eq("id", id)
          .select("*, teachers:homeroom_teacher_id(id, full_name)")
          .single();
        if (e) throw e;
        return json({ class: data });
      }

      case "delete_class": {
        await requireAdmin();
        const { id } = body as any;
        if (!id) return err("Missing id");
        const { error: e } = await admin.from("classes").delete().eq("id", id);
        if (e) throw e;
        return json({ success: true });
      }

      // ── Class student management ──
      case "add_student_to_class": {
        await requireAdmin();
        const { class_id, student_id } = body as any;
        if (!class_id || !student_id) return err("Missing class_id or student_id");
        const { error: e } = await admin
          .from("class_students")
          .insert({ class_id, student_id });
        if (e) throw e;
        return json({ success: true });
      }

      case "remove_student_from_class": {
        await requireAdmin();
        const { class_id, student_id } = body as any;
        if (!class_id || !student_id) return err("Missing class_id or student_id");
        const { error: e } = await admin
          .from("class_students")
          .delete()
          .eq("class_id", class_id)
          .eq("student_id", student_id);
        if (e) throw e;
        return json({ success: true });
      }

      // ── Sync: link student/teacher to user account ──
      case "link_student_user": {
        await requireAdmin();
        const { student_id, user_id } = body as any;
        if (!student_id || !user_id) return err("Missing student_id or user_id");
        const { error: e } = await admin
          .from("students")
          .update({ user_id })
          .eq("id", student_id);
        if (e) throw e;
        return json({ success: true });
      }

      case "link_teacher_user": {
        await requireAdmin();
        const { teacher_id, user_id } = body as any;
        if (!teacher_id || !user_id) return err("Missing teacher_id or user_id");
        const { error: e } = await admin
          .from("teachers")
          .update({ user_id })
          .eq("id", teacher_id);
        if (e) throw e;
        return json({ success: true });
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
