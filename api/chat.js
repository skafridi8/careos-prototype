import { getSupabaseAdmin } from "./_supabaseAdmin.js";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const CAREOS_SYSTEM_PROMPT = `You are the CareOS assistant, embedded as a chat widget on the CareOS website.

CareOS is a unified care-management platform for UK domiciliary and residential care agencies. Its core idea:
care planning, rostering, and compliance are usually three separate, disconnected tools — CareOS replaces them
with one shared data record, so information entered in one place (e.g. a carer's note) is instantly reflected
everywhere else (e.g. the compliance dashboard).

Core features you can describe:
- Care Planning: structured, living care plans per client, editable by managers and carers.
- AI Care Notes: turns a carer's free-text visit notes into a structured, editable care plan update automatically.
- Rostering: a visual scheduling calendar with AI-assisted carer suggestions, conflict detection (double-booking,
  missing skills, travel time between visits, availability, preferences), and one-click auto-allocation.
- Compliance: tracks carer training/competencies and certification expiry per client condition (e.g. dementia,
  diabetes), with alerts before things lapse.
- Records: timesheets, client intake, and carer training logs, submitted directly by carers and managers.
- A mobile app for carers to view their published rota and log visits from the field.

Subscriptions: CareOS offers Monthly and Yearly paid plans for agencies. Point visitors to the "Subscribe" page
for exact current pricing and to start a subscription — do not invent specific prices yourself.

Getting started: agencies sign up, a manager creates carer and client profiles, then builds care plans and a
roster. Individual carers get their own login to log hours, training, and notes.

Behavior rules:
- Only describe features listed above. If asked about something CareOS doesn't do, say it's not currently
  offered rather than guessing.
- Keep answers short and conversational (2-4 sentences), suitable for a small chat widget.
- If the user is logged into the app (see mode below), prioritize helping them use the product itself
  (e.g. "how do I add a client", "where is my roster") over general sales/marketing content.
- If the user is a public visitor, focus on what CareOS is, its features, and how to get started/subscribe.
- Never claim to access, view, or change the user's actual data — you have no access to their account.`;

const APP_MODE_ADDENDUM = `
The current visitor is logged into the CareOS app. Common in-app help:
- Add a client: Clients tab -> "New client" / client intake form.
- View or edit the roster: Roster tab in the sidebar.
- Log training or timesheets: Records tab -> the relevant form.
- Generate AI care notes: AI tab, pick a client, generate a draft, then apply it in the care plan editor.
- Compliance alerts: Compliance tab shows expiring training and open issues.`;

const PUBLIC_MODE_ADDENDUM = `
The current visitor is a public, logged-out visitor to the marketing site. Focus on explaining CareOS, its
features, and directing them to sign up or the Subscribe page for pricing.`;

function corsHeaders(res) {
  res.setHeader("Content-Type", "application/json");
}

export default async function handler(req, res) {
  corsHeaders(res);

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, history = [], sessionId } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Determine login state from the Supabase access token, if the client sent one.
  let userId = null;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user) {
      userId = data.user.id;
    }
  }
  const mode = userId ? "app" : "public";

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.error("GROQ_API_KEY is not set");
    res.status(200).json({
      reply:
        "Sorry, the assistant isn't configured yet. Please try again later or contact support directly.",
      mode,
    });
    return;
  }

  const messages = [
    { role: "system", content: CAREOS_SYSTEM_PROMPT + (mode === "app" ? APP_MODE_ADDENDUM : PUBLIC_MODE_ADDENDUM) },
    ...history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-10),
    { role: "user", content: message.trim() },
  ];

  let reply;
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 400,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error", groqRes.status, errText);
      reply =
        "Sorry, I'm having trouble reaching the assistant right now. Please try again in a moment.";
    } else {
      const data = await groqRes.json();
      reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        reply = "Sorry, I didn't quite catch that. Could you rephrase your question?";
      }
    }
  } catch (err) {
    console.error("Groq request failed", err);
    reply = "Sorry, I'm having trouble reaching the assistant right now. Please try again in a moment.";
  }

  try {
    await supabaseAdmin.from("chat_logs").insert({
      session_id: sessionId,
      user_id: userId,
      mode,
      user_message: message.trim(),
      bot_response: reply,
    });
  } catch (err) {
    console.error("Failed to log chat message", err);
  }

  res.status(200).json({ reply, mode });
}
