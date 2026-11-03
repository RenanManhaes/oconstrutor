import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    // ── Public action: self_register (no auth required) ──
    if (action === "self_register") {
      const { email, password, full_name, phone } = body;
      if (!email || !password || !full_name) {
        return new Response(JSON.stringify({ error: "Nome, email e senha são obrigatórios." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
        ban_duration: "876000h",
      });
      if (createErr) {
        const msg = createErr.message.includes("already been registered")
          ? "Este email já está cadastrado. Entre em contato com o administrador."
          : createErr.message;
        return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Update profile to pending
      await adminClient.from("profiles").update({ status: "pending", phone, full_name }).eq("user_id", newUser.user.id);
      // Assign cliente role
      await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "cliente" });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── All other actions require admin auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "approve_user") {
      const { user_id } = body;
      await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
      await adminClient.from("profiles").update({ status: "active" }).eq("user_id", user_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create_user") {
      const { email, password, full_name, phone } = body;
      
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (phone && newUser.user) {
        await adminClient.from("profiles").update({ phone, full_name }).eq("user_id", newUser.user.id);
      }

      await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "cliente" });

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send_invite") {
      const { user_id } = body;
      const { data: { user: targetUser }, error: getUserErr } = await adminClient.auth.admin.getUserById(user_id);
      if (getUserErr || !targetUser) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const email = targetUser.email;
      if (!email) {
        return new Response(JSON.stringify({ error: "Usuário sem email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error: sendErr } = await adminClient.auth.resetPasswordForEmail(email, {
        redirectTo: "https://oconstrutor.empresaprospera.com.br/reset-password",
      });
      if (sendErr) {
        return new Response(JSON.stringify({ error: sendErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "block_user") {
      const { user_id } = body;
      await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "876000h" });
      await adminClient.from("profiles").update({ status: "blocked" }).eq("user_id", user_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "unblock_user") {
      const { user_id } = body;
      await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
      await adminClient.from("profiles").update({ status: "active" }).eq("user_id", user_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "reset_password") {
      const { user_id, new_password } = body;
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list_users") {
      const { data: profiles, error } = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: roles } = await adminClient.from("user_roles").select("user_id, role");
      const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

      const enriched = profiles?.map((p) => {
        const authUser = authUsers?.find((u) => u.id === p.user_id);
        const userRole = roles?.find((r) => r.user_id === p.user_id);
        return {
          ...p,
          email: authUser?.email || "",
          role: userRole?.role || "cliente",
          last_sign_in: authUser?.last_sign_in_at,
          banned: !!authUser?.banned_until && new Date(authUser.banned_until) > new Date(),
        };
      });

      return new Response(JSON.stringify({ users: enriched }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete_user") {
      const { user_id } = body;
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "convert_guest_to_client") {
      const { guest_signup_id, password } = body;
      if (!guest_signup_id || !password || password.length < 6) {
        return new Response(JSON.stringify({ error: "Inscrição e senha (mín. 6 caracteres) são obrigatórios." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: guest, error: guestErr } = await adminClient
        .from("guest_signups")
        .select("id, email, full_name, phone, status, converted_user_id")
        .eq("id", guest_signup_id)
        .maybeSingle();

      if (guestErr || !guest) {
        return new Response(JSON.stringify({ error: "Inscrição não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (guest.status === "converted" && guest.converted_user_id) {
        return new Response(JSON.stringify({ error: "Esta inscrição já foi convertida em cliente." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Create auth user
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: guest.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: guest.full_name },
      });
      if (createErr || !newUser?.user) {
        const msg = createErr?.message?.includes("already been registered")
          ? "Já existe um usuário com este email. Use a tela de Usuários."
          : (createErr?.message || "Erro ao criar usuário");
        return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Update profile with phone/name
      await adminClient.from("profiles").update({
        full_name: guest.full_name,
        phone: guest.phone,
        status: "active",
      }).eq("user_id", newUser.user.id);

      // Assign cliente role
      await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "cliente" });

      // Mark guest as converted
      await adminClient.from("guest_signups").update({
        status: "converted",
        converted_user_id: newUser.user.id,
      }).eq("id", guest_signup_id);

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
