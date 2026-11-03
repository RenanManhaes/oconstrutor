import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find encontros happening in the next 30-35 minutes
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 60 * 1000);
    const in35 = new Date(now.getTime() + 35 * 60 * 1000);

    const todayDate = now.toISOString().split("T")[0];
    const time30 = in30.toTimeString().slice(0, 8);
    const time35 = in35.toTimeString().slice(0, 8);

    // Get encontros today with start_time between 30 and 35 min from now
    const { data: encontros, error: encError } = await supabase
      .from("encontros")
      .select("id, title, start_time")
      .eq("status", "active")
      .eq("date", todayDate)
      .gte("start_time", time30)
      .lte("start_time", time35);

    if (encError) {
      console.error("Error fetching encontros:", encError);
      return new Response(JSON.stringify({ error: encError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!encontros || encontros.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming encontros" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get all active users (profiles)
    const { data: profiles } = await supabase.from("profiles").select("user_id").eq("status", "active");
    const userIds = (profiles || []).map(p => p.user_id);

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: "No active users" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check which notifications already sent (avoid duplicates)
    let notificationsSent = 0;

    for (const enc of encontros) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("reference_id", enc.id)
        .eq("tipo", "encontro_reminder");

      const alreadyNotified = new Set((existing || []).map(n => n.user_id));

      const newNotifications = userIds
        .filter(uid => !alreadyNotified.has(uid))
        .map(uid => ({
          user_id: uid,
          title: "Encontro em breve!",
          message: `O encontro "${enc.title}" começa às ${enc.start_time?.slice(0, 5)}. Prepare-se!`,
          tipo: "encontro_reminder",
          reference_id: enc.id,
        }));

      if (newNotifications.length > 0) {
        const { error: insError } = await supabase.from("notifications").insert(newNotifications);
        if (insError) console.error("Insert notification error:", insError);
        else notificationsSent += newNotifications.length;
      }
    }

    return new Response(JSON.stringify({ success: true, notificationsSent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-encontro error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
