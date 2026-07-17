import { getSupabaseAdmin } from "../_supabaseAdmin.js";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const ALLOWED_SEVERITIES = new Set(["low", "medium", "high"]);
const ALLOWED_TYPES = new Set([
  "mobility_decline",
  "medication_refusal",
  "medication_timing",
  "mood_decline",
  "missed_visits",
  "nutrition_concern",
  "skin_integrity",
  "social_isolation",
  "other",
]);

const ANALYSIS_PROMPT = `You are a clinical risk analyst for a UK domiciliary care agency.
You will receive a client's recent care notes written by visiting carers, each with a note id and date.

Identify risk PATTERNS across the notes — trends over time, not one-off events. Look for:
declining mobility mentioned repeatedly, a medication refusal trend, timing-critical medication given late,
mood or mental-wellbeing decline, missed or skipped visits, poor eating/nutrition, skin integrity concerns,
and social isolation.

Respond with ONLY a JSON object in this exact shape:
{"insights": [{"insight_type": "<one of: mobility_decline, medication_refusal, medication_timing, mood_decline, missed_visits, nutrition_concern, skin_integrity, social_isolation, other>",
"severity": "<low | medium | high>",
"description": "<2-3 sentences: the pattern, the evidence across notes, and a suggested next action>",
"evidence_note_id": "<the id of the single most representative note>"}]}

Rules:
- Only report patterns actually supported by the notes. If the notes show a healthy, stable client, return {"insights": []}.
- At most 5 insights, ordered most severe first.
- severity reflects clinical urgency: high = needs action this week, medium = review soon, low = monitor.
- British English, professional tone, no client-blaming language.`;

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { clientId } = req.body || {};
  if (!clientId || typeof clientId !== "string") {
    res.status(400).json({ error: "clientId is required" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Only logged-in managers may trigger analysis (it rewrites the insight list).
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profile?.role !== "manager") {
    res.status(403).json({ error: "Manager access required" });
    return;
  }

  const { data: client, error: clientError } = await supabaseAdmin
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();
  if (clientError || !client) {
    res.status(404).json({ error: "Unknown client" });
    return;
  }

  const { data: notes, error: notesError } = await supabaseAdmin
    .from("care_notes")
    .select("id, note, noted_at")
    .eq("client_id", clientId)
    .order("noted_at", { ascending: false })
    .limit(40);
  if (notesError) {
    console.error("Failed to load care notes", notesError);
    res.status(500).json({ error: "Failed to load care notes" });
    return;
  }
  if (!notes?.length) {
    res.status(200).json({ insights: [], riskScore: null, message: "No care notes to analyse yet." });
    return;
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    res.status(500).json({ error: "Assistant not configured" });
    return;
  }

  let parsed;
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          {
            role: "user",
            content: `Client: ${client.name}\n\nCare notes (newest first):\n${JSON.stringify(
              notes.map((n) => ({ id: n.id, date: n.noted_at.slice(0, 10), note: n.note })),
            )}`,
          },
        ],
      }),
    });
    if (!groqRes.ok) {
      console.error("Groq API error", groqRes.status, await groqRes.text());
      res.status(502).json({ error: "AI analysis failed, please try again" });
      return;
    }
    const data = await groqRes.json();
    parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  } catch (err) {
    console.error("Groq insight analysis failed", err);
    res.status(502).json({ error: "AI analysis failed, please try again" });
    return;
  }

  const noteIds = new Set(notes.map((n) => n.id));
  const rows = (Array.isArray(parsed.insights) ? parsed.insights : [])
    .filter((i) => i && typeof i.description === "string" && i.description.trim())
    .slice(0, 5)
    .map((i) => ({
      client_id: clientId,
      insight_type: ALLOWED_TYPES.has(i.insight_type) ? i.insight_type : "other",
      description: i.description.trim().slice(0, 600),
      severity: ALLOWED_SEVERITIES.has(i.severity) ? i.severity : "medium",
      source_note_id: noteIds.has(i.evidence_note_id) ? i.evidence_note_id : null,
    }));

  try {
    // Regeneration replaces the client's open insights (resolved ones are kept
    // as history), then the weighted risk score is recomputed from live data.
    await supabaseAdmin.from("care_insights").delete().eq("client_id", clientId).eq("resolved", false);
    if (rows.length) {
      const { error: insertError } = await supabaseAdmin.from("care_insights").insert(rows);
      if (insertError) throw insertError;
    }
    const { error: rpcError } = await supabaseAdmin.rpc("refresh_risk_scores");
    if (rpcError) throw rpcError;
  } catch (err) {
    console.error("Failed to store insights", err);
    res.status(500).json({ error: "Failed to store insights" });
    return;
  }

  const { data: inserted } = await supabaseAdmin
    .from("care_insights")
    .select("*")
    .eq("client_id", clientId)
    .eq("resolved", false)
    .order("created_at", { ascending: false });
  const { data: riskScore } = await supabaseAdmin
    .from("risk_scores")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  res.status(200).json({ insights: inserted ?? [], riskScore: riskScore ?? null });
}
