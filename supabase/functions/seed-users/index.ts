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

const SEED_USERS = [
  {
    email: "superadmin@penahikmah.sch.id",
    password: "SuperAdmin@2026",
    full_name: "Super Administrator",
    role: "super_admin" as const,
  },
  {
    email: "admin@penahikmah.sch.id",
    password: "Admin@2026",
    full_name: "Administrator",
    role: "admin" as const,
  },
  {
    email: "guru@penahikmah.sch.id",
    password: "Guru@2026",
    full_name: "Guru Demo",
    role: "guru" as const,
  },
  {
    email: "siswa@penahikmah.sch.id",
    password: "Siswa@2026",
    full_name: "Siswa Demo",
    role: "siswa" as const,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Seed missing users (skip existing ones)

    const results: Array<{ email: string; role: string; status: string }> = [];

    for (const seedUser of SEED_USERS) {
      // Check if this specific user already exists
      const { data: { users: allUsers } } = await admin.auth.admin.listUsers();
      const alreadyExists = allUsers?.some((u: any) => u.email === seedUser.email);
      if (alreadyExists) {
        results.push({ email: seedUser.email, role: seedUser.role, status: "Already exists, skipped" });
        continue;
      }
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: seedUser.email,
        password: seedUser.password,
        email_confirm: true,
        user_metadata: { full_name: seedUser.full_name },
      });

      if (authError) {
        results.push({ email: seedUser.email, role: seedUser.role, status: `Error: ${authError.message}` });
        continue;
      }

      const userId = authData.user.id;

      // The trigger handle_new_user should create profile automatically.
      // The trigger handle_new_user_role assigns roles based on count,
      // but to be safe we ensure the correct role is set.
      // Remove any auto-assigned role and insert the correct one.
      await admin.from("user_roles").delete().eq("user_id", userId);
      const { error: roleErr } = await admin
        .from("user_roles")
        .insert({ user_id: userId, role: seedUser.role });

      if (roleErr) {
        results.push({ email: seedUser.email, role: seedUser.role, status: `User created but role failed: ${roleErr.message}` });
        continue;
      }

      // Update profile name
      await admin
        .from("profiles")
        .update({ full_name: seedUser.full_name })
        .eq("user_id", userId);

      results.push({ email: seedUser.email, role: seedUser.role, status: "OK" });
    }

    return json({
      message: "Seed completed",
      results,
      credentials: SEED_USERS.map((u) => ({
        email: u.email,
        password: u.password,
        role: u.role,
      })),
    });
  } catch (e: any) {
    console.error(e);
    return err(e.message ?? "Internal error", 500);
  }
});
