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

const MANAGER_MODE_ADDENDUM = `
You are now acting as the CareOS ROSTERING & OPERATIONS ASSISTANT for a care coordinator/manager who is looking
at the live Roster screen. You are not just answering questions — you can actually carry out rostering tasks and
draft communications for them by calling the tools available to you.

Rules for this mode:
- The tool_context JSON below is a live snapshot of the current rota, carers, and open carer requests. Use it to
  resolve names to ids — never invent an id that isn't in the snapshot.
- When the manager asks you to do something that matches a tool (assign/reassign/unassign a carer, mark someone
  sick/fit, auto-allocate unfilled visits, publish the rota, approve/decline a carer request, or draft a message),
  call the tool. Do not just describe what you would do — call it.
- If a request is ambiguous (e.g. which visit, which carer) ask a short clarifying question instead of guessing.
- After a tool result comes back, summarize what happened in one or two plain-English sentences.
- For drafting emails/messages/announcements, use draft_message — it does not send anything, it only returns text
  for the manager to review, so you can draft freely.
- For ANY question about a client's risk flags, AI insights, risk score, or recent care notes, ALWAYS call
  query_care_data first and answer from its result — never from memory. The result comes from the live CareOS
  database. If it returns nothing, say so plainly.
- Keep replies concise and operational; this is a working tool, not a marketing chat.`;

const CARER_MODE_ADDENDUM = `
You are now acting as the CareOS FIELD ASSISTANT for a carer using the mobile app. You can help them understand
today's visits and the client's care plan, turn a spoken/typed visit note into a structured note for the office,
and raise requests (time off, a shift swap, or flagging an issue) on their behalf using the tools available.

Rules for this mode:
- The tool_context JSON below is a snapshot of this carer's identity and today's visits. Only act on this carer's
  own visits/requests.
- When the carer describes what happened on a visit and wants it logged, call submit_visit_note.
- When the carer asks for time off, a shift swap, or wants to flag a problem, call the matching tool. Confirm key
  details (dates, which visit) if they're missing before calling it.
- After a tool result, reply with a short, warm confirmation (1-2 sentences) — this is a mobile chat, keep it brief.
- If the carer asks about a client's risk flags, current concerns, or what recent notes say, call query_care_data
  and answer from its result — it reads the live database, scoped to what this carer is allowed to see.
- You cannot change the rota yourself (no assign/publish tools here) — that's the office's job; requests just get
  sent to them.`;

// Read-only lookup of live care data (care_insights, risk_scores, care_notes in
// Supabase). Executed client-side with the logged-in user's own session, so RLS
// limits results to what that user's role may see. Available in both staff modes.
const QUERY_CARE_DATA_TOOL = {
  type: "function",
  function: {
    name: "query_care_data",
    description:
      "Read live care data from the CareOS database: the all-client risk overview, one client's open AI risk insights + risk score, or one client's recent care notes. Always use this before answering questions about risks, insights, scores, or notes.",
    parameters: {
      type: "object",
      properties: {
        query_type: {
          type: "string",
          enum: ["risk_overview", "client_insights", "recent_notes"],
          description:
            "risk_overview = every client's risk score; client_insights = one client's open insights and score; recent_notes = one client's latest care notes",
        },
        clientId: {
          type: "string",
          description: "client id from tool_context (required for client_insights and recent_notes)",
        },
      },
      required: ["query_type"],
    },
  },
};

const MANAGER_TOOLS = [
  QUERY_CARE_DATA_TOOL,
  {
    type: "function",
    function: {
      name: "assign_carer",
      description: "Assign (or reassign) a carer to a visit.",
      parameters: {
        type: "object",
        properties: {
          visitId: { type: "string", description: "id of the visit from tool_context.visits" },
          carerId: { type: "string", description: "id of the carer from tool_context.carers" },
          replaceCarerId: { type: "string", description: "id of a carer currently on the visit being replaced, if reassigning" },
        },
        required: ["visitId", "carerId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "unassign_carer",
      description: "Remove a carer from a visit.",
      parameters: {
        type: "object",
        properties: {
          visitId: { type: "string" },
          carerId: { type: "string" },
        },
        required: ["visitId", "carerId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_carer_sick",
      description: "Mark a carer off sick, freeing up their upcoming visits for reallocation.",
      parameters: {
        type: "object",
        properties: { carerId: { type: "string" } },
        required: ["carerId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_carer_fit",
      description: "Mark a previously sick carer as fit for work again.",
      parameters: {
        type: "object",
        properties: { carerId: { type: "string" } },
        required: ["carerId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "auto_allocate",
      description: "Run the AI auto-allocator to fill every currently unallocated visit with the best conflict-free carer.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_roster",
      description: "Publish the current working rota so every carer's mobile app updates to match it.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "resolve_carer_request",
      description: "Approve or decline a pending carer request (time off, shift swap, or flagged issue).",
      parameters: {
        type: "object",
        properties: {
          requestId: { type: "string", description: "id from tool_context.carerRequests" },
          resolution: { type: "string", enum: ["approved", "declined"] },
        },
        required: ["requestId", "resolution"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_message",
      description:
        "Draft a message/email/announcement (e.g. to a carer, a client's family, or the whole team). Returns text only — never sent automatically.",
      parameters: {
        type: "object",
        properties: {
          audience: { type: "string", description: "who this is for, e.g. 'Aaron Mitchell' or 'all carers'" },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["audience", "subject", "body"],
      },
    },
  },
];

const CARER_TOOLS = [
  QUERY_CARE_DATA_TOOL,
  {
    type: "function",
    function: {
      name: "submit_visit_note",
      description: "Log a structured note for a visit, sent to the office and cited in AI Care Notes.",
      parameters: {
        type: "object",
        properties: {
          visitId: { type: "string", description: "id from tool_context.visits" },
          note: { type: "string", description: "the note text, cleaned up into clear sentences" },
        },
        required: ["visitId", "note"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_time_off",
      description: "Request time off for one or more dates.",
      parameters: {
        type: "object",
        properties: {
          dates: { type: "string", description: "human-readable date or date range, e.g. '12-14 August'" },
          reason: { type: "string" },
        },
        required: ["dates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_shift_swap",
      description: "Ask the office to swap or cover a specific visit.",
      parameters: {
        type: "object",
        properties: {
          visitId: { type: "string", description: "id from tool_context.visits" },
          reason: { type: "string" },
        },
        required: ["visitId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "flag_issue",
      description: "Flag a problem or concern to the office, optionally tied to a specific visit.",
      parameters: {
        type: "object",
        properties: {
          visitId: { type: "string" },
          description: { type: "string" },
        },
        required: ["description"],
      },
    },
  },
];

function corsHeaders(res) {
  res.setHeader("Content-Type", "application/json");
}

function buildSystemPrompt(mode, toolContext) {
  let prompt = CAREOS_SYSTEM_PROMPT;
  if (mode === "manager") prompt += MANAGER_MODE_ADDENDUM;
  else if (mode === "carer") prompt += CARER_MODE_ADDENDUM;
  else if (mode === "app") prompt += APP_MODE_ADDENDUM;
  else prompt += PUBLIC_MODE_ADDENDUM;

  if ((mode === "manager" || mode === "carer") && toolContext) {
    prompt += `\n\ntool_context (live app state, JSON):\n${JSON.stringify(toolContext).slice(0, 6000)}`;
  }
  return prompt;
}

function sanitizeHistoryMessage(m) {
  if (!m || typeof m !== "object") return null;
  if (m.role === "user" || m.role === "assistant") {
    if (m.tool_calls) {
      return { role: "assistant", content: m.content ?? null, tool_calls: m.tool_calls };
    }
    if (typeof m.content !== "string") return null;
    return { role: m.role, content: m.content };
  }
  if (m.role === "tool" && typeof m.tool_call_id === "string") {
    return { role: "tool", tool_call_id: m.tool_call_id, content: String(m.content ?? "") };
  }
  return null;
}

export default async function handler(req, res) {
  corsHeaders(res);

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, history = [], sessionId, assistantMode, context: toolContext, toolResults } = req.body || {};

  const hasMessage = typeof message === "string" && message.trim();
  const hasToolResults = Array.isArray(toolResults) && toolResults.length > 0;
  if (!hasMessage && !hasToolResults) {
    res.status(400).json({ error: "message or toolResults is required" });
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

  // Tool-enabled modes require a logged-in user; anything else falls back to plain Q&A.
  const wantsTools = assistantMode === "manager" || assistantMode === "carer";
  const mode = userId ? (wantsTools ? assistantMode : "app") : "public";
  const tools = mode === "manager" ? MANAGER_TOOLS : mode === "carer" ? CARER_TOOLS : null;

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
    { role: "system", content: buildSystemPrompt(mode, toolContext) },
    ...history.map(sanitizeHistoryMessage).filter(Boolean).slice(-14),
    ...(hasMessage ? [{ role: "user", content: message.trim() }] : []),
    ...(hasToolResults
      ? toolResults
          .filter((t) => t && typeof t.tool_call_id === "string")
          .map((t) => ({ role: "tool", tool_call_id: t.tool_call_id, content: String(t.content ?? "") }))
      : []),
  ];

  let reply = null;
  let toolCalls = null;
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
        max_tokens: 500,
        ...(tools ? { tools, tool_choice: "auto" } : {}),
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error", groqRes.status, errText);
      reply =
        "Sorry, I'm having trouble reaching the assistant right now. Please try again in a moment.";
    } else {
      const data = await groqRes.json();
      const choice = data.choices?.[0]?.message;
      if (choice?.tool_calls?.length) {
        toolCalls = choice.tool_calls.map((tc) => ({
          id: tc.id,
          name: tc.function?.name,
          arguments: (() => {
            try {
              return JSON.parse(tc.function?.arguments || "{}");
            } catch {
              return {};
            }
          })(),
        }));
        reply = choice.content?.trim() || null;
      } else {
        reply = choice?.content?.trim();
        if (!reply) {
          reply = "Sorry, I didn't quite catch that. Could you rephrase your question?";
        }
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
      user_message: hasMessage ? message.trim() : "[tool result]",
      bot_response: reply ?? (toolCalls ? `[tool_calls] ${toolCalls.map((t) => t.name).join(", ")}` : ""),
    });
  } catch (err) {
    console.error("Failed to log chat message", err);
  }

  res.status(200).json({ reply, mode, toolCalls });
}
