import { supabase } from "./supabaseClient";

const SESSION_STORAGE_KEY = "careos_chat_session_id";

export function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

async function authHeaders(user) {
  const headers = { "Content-Type": "application/json" };
  if (user) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function postChat(body, user) {
  const headers = await authHeaders(user);
  const res = await fetch("/api/chat", { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

// Send a new user message, with prior turns as history (OpenAI message shape).
export function sendChatMessage({ message, history, sessionId, assistantMode, context, user }) {
  return postChat({ message, history, sessionId, assistantMode, context }, user);
}

// Continue a turn after executing tool call(s) — no new user message, just results.
export function sendToolResults({ toolResults, history, sessionId, assistantMode, context, user }) {
  return postChat({ toolResults, history, sessionId, assistantMode, context }, user);
}
