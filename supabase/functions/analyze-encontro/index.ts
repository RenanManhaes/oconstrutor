import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { encontro_id } = await req.json();
    if (!encontro_id) return new Response(JSON.stringify({ error: "encontro_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Fetch user data for this encontro
    const [notesRes, checkRes, pillarsRes] = await Promise.all([
      supabase.from("encontro_notes").select("notes, actions").eq("user_id", user.id).eq("encontro_id", encontro_id).maybeSingle(),
      supabase.from("encontro_checklist").select("title, completed").eq("user_id", user.id).eq("encontro_id", encontro_id),
      supabase.from("journey_stages").select("id, title, description").eq("status", "active").order("sort_order"),
    ]);

    const notes = notesRes.data?.notes || "";
    const actions = notesRes.data?.actions || "";
    const checklist = checkRes.data || [];
    const pillars = pillarsRes.data || [];

    if (!notes && !actions && checklist.length === 0) {
      return new Response(JSON.stringify({ message: "No data to analyze" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pillarsList = pillars.map((p: any) => `- ${p.title} (ID: ${p.id}): ${p.description || "sem descrição"}`).join("\n");
    const checklistText = checklist.map((c: any) => `- [${c.completed ? "x" : " "}] ${c.title}`).join("\n");

    const systemPrompt = `Você é um analista de desenvolvimento pessoal da plataforma "O Construtor" de Vagner Vieira. 
Sua tarefa é analisar as ações, anotações e checklist de um aluno em um encontro e identificar quais dos 6 pilares essas ações impactam.

Os pilares são:
${pillarsList}

Para cada pilar impactado pelas ações do aluno, retorne um insight breve (1-2 frases) e um score de progresso de 0 a 100, onde:
- 0-20: mencionou o pilar mas sem ação concreta
- 21-50: definiu ações mas ainda não completou
- 51-80: completou algumas ações relacionadas
- 81-100: demonstra alto comprometimento com ações concretas completadas

Analise APENAS os pilares que realmente são impactados pelas ações. Não force todos os pilares.`;

    const userPrompt = `Anotações do aluno:
${notes || "(vazio)"}

Ações que o aluno pretende aplicar:
${actions || "(vazio)"}

Checklist de aplicação:
${checklistText || "(vazio)"}`;

    const pillarIds = pillars.map((p: any) => p.id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_pillar_insights",
              description: "Submit insights and progress scores for each impacted pillar",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pillar_id: { type: "string", enum: pillarIds, description: "UUID of the pillar" },
                        insight: { type: "string", description: "Brief insight about how the user's actions impact this pillar" },
                        progress_score: { type: "integer", minimum: 0, maximum: 100, description: "Progress score 0-100" },
                      },
                      required: ["pillar_id", "insight", "progress_score"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_pillar_insights" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI analysis failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { insights } = JSON.parse(toolCall.function.arguments);

    // Use service role to upsert insights
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    for (const ins of insights) {
      const { error } = await serviceClient.from("encontro_ai_insights").upsert(
        {
          user_id: user.id,
          encontro_id,
          pillar_id: ins.pillar_id,
          insight: ins.insight,
          progress_score: ins.progress_score,
        },
        { onConflict: "user_id,encontro_id,pillar_id" }
      );
      if (error) console.error("Upsert error:", error);
    }

    return new Response(JSON.stringify({ success: true, insights }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-encontro error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
