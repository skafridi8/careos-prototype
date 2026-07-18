import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, HeartPulse, Check, Ban, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateSessionId, sendChatMessage, sendToolResults } from "../../lib/chatApi";

const FALLBACK_MESSAGE =
  "Sorry, I'm having trouble responding right now. Please try again in a moment.";

function ToolCallCard({ entry, describeToolCall, onConfirm, onCancel }) {
  const { toolCall, status, resultText } = entry;

  if (toolCall.name === "draft_message") {
    const { audience, subject, body } = toolCall.arguments || {};
    return (
      <div className="max-w-[92%] rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
          <Sparkles size={12} /> Draft — {audience}
        </div>
        {subject && <div className="mb-1 font-semibold text-brand-950">{subject}</div>}
        <div className="whitespace-pre-wrap text-brand-900/80">{body}</div>
      </div>
    );
  }

  const label = describeToolCall ? describeToolCall(toolCall) : toolCall.name.replaceAll("_", " ");

  return (
    <div className="max-w-[92%] rounded-2xl border border-brand-200 bg-white p-3 text-sm shadow-sm">
      <div className="text-brand-900/80">{label}</div>
      {status === "pending" && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onConfirm(entry)}
            className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <Check size={12} /> Confirm
          </button>
          <button
            type="button"
            onClick={() => onCancel(entry)}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
          >
            <Ban size={12} /> Cancel
          </button>
        </div>
      )}
      {status === "running" && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-900/40">
          <Loader2 size={12} className="animate-spin" /> Working…
        </div>
      )}
      {(status === "done" || status === "cancelled" || status === "error") && resultText && (
        <div
          className={`mt-2 text-xs font-medium ${
            status === "error" ? "text-rose-500" : status === "cancelled" ? "text-brand-900/40" : "text-sage-600"
          }`}
        >
          {resultText}
        </div>
      )}
    </div>
  );
}

/**
 * Generic chat UI shared by the public/marketing widget, the manager assistant, and the
 * mobile carer assistant. Tool execution is fully delegated via onExecuteTool so this
 * component has no knowledge of RosterContext or any specific tool's side effects.
 */
export default function ChatWidget({
  assistantMode = "public", // 'public' | 'app' | 'manager' | 'carer'
  getContext,
  onExecuteTool, // async (toolCall) => resultText string
  autoResolveTool, // (toolName) => boolean — tools that don't need a confirm click (e.g. draft_message)
  describeToolCall, // (toolCall) => human-readable string for the confirm card
  greeting = "Hi! I'm the Tendly assistant. Ask me anything about care planning, rostering, compliance, or your account.",
  title = "Tendly Assistant",
  placeholder,
  variant = "widget", // 'widget' (floating FAB) | 'inline' (embedded panel, e.g. phone frame)
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(variant === "inline");
  const [messages, setMessages] = useState([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const sessionIdRef = useRef(null);
  const apiHistoryRef = useRef([]);

  if (!sessionIdRef.current) {
    sessionIdRef.current = getOrCreateSessionId();
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, busy]);

  function appendDisplay(entry) {
    setMessages((prev) => [...prev, entry]);
  }

  function updateToolEntry(id, patch) {
    setMessages((prev) =>
      prev.map((m) => (m.kind === "tool-call" && m.toolCall.id === id ? { ...m, ...patch } : m)),
    );
  }

  async function runTurn({ userText, toolResults }) {
    setBusy(true);
    try {
      const payload = {
        history: apiHistoryRef.current,
        sessionId: sessionIdRef.current,
        assistantMode,
        context: getContext ? getContext() : undefined,
        user,
      };
      const data = userText
        ? await sendChatMessage({ ...payload, message: userText })
        : await sendToolResults({ ...payload, toolResults });

      if (userText) {
        apiHistoryRef.current = [...apiHistoryRef.current, { role: "user", content: userText }];
      }
      if (toolResults) {
        apiHistoryRef.current = [
          ...apiHistoryRef.current,
          ...toolResults.map((t) => ({ role: "tool", tool_call_id: t.tool_call_id, content: t.content })),
        ];
      }

      if (data.toolCalls?.length) {
        apiHistoryRef.current = [
          ...apiHistoryRef.current,
          {
            role: "assistant",
            content: data.reply ?? null,
            tool_calls: data.toolCalls.map((tc) => ({
              id: tc.id,
              type: "function",
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments || {}) },
            })),
          },
        ];
        if (data.reply) appendDisplay({ role: "assistant", content: data.reply });
        for (const tc of data.toolCalls) {
          const auto = autoResolveTool?.(tc.name);
          appendDisplay({ kind: "tool-call", toolCall: tc, status: auto ? "running" : "pending" });
          if (auto) {
            await executeTool(tc);
          }
        }
      } else {
        apiHistoryRef.current = [...apiHistoryRef.current, { role: "assistant", content: data.reply }];
        appendDisplay({ role: "assistant", content: data.reply || FALLBACK_MESSAGE });
      }
    } catch (err) {
      console.error("Chat request failed", err);
      appendDisplay({ role: "assistant", content: FALLBACK_MESSAGE });
    } finally {
      setBusy(false);
    }
  }

  async function executeTool(toolCall) {
    updateToolEntry(toolCall.id, { status: "running" });
    let resultText;
    try {
      resultText = (await onExecuteTool?.(toolCall)) || "Done.";
      updateToolEntry(toolCall.id, { status: "done", resultText });
    } catch (err) {
      resultText = err?.message || "Something went wrong carrying that out.";
      updateToolEntry(toolCall.id, { status: "error", resultText });
    }
    await runTurn({ toolResults: [{ tool_call_id: toolCall.id, content: resultText }] });
  }

  function cancelTool(entry) {
    const resultText = "Cancelled by the user — no changes made.";
    updateToolEntry(entry.toolCall.id, { status: "cancelled", resultText });
    runTurn({ toolResults: [{ tool_call_id: entry.toolCall.id, content: resultText }] });
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    appendDisplay({ role: "user", content: text });
    await runTurn({ userText: text });
  }

  const panel = (
    <div
      className={
        variant === "inline"
          ? "flex h-full flex-col overflow-hidden bg-brand-50/30"
          : "mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xl sm:w-96"
      }
    >
      {variant === "widget" && (
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-400 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} />
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1 transition hover:bg-white/20"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-brand-50/30 px-3 py-3">
        {messages.map((m, i) =>
          m.kind === "tool-call" ? (
            <div key={i} className="flex justify-start">
              <ToolCallCard
                entry={m}
                describeToolCall={describeToolCall}
                onConfirm={(entry) => executeTool(entry.toolCall)}
                onCancel={cancelTool}
              />
            </div>
          ) : (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-brand-500 text-white"
                    : "border border-brand-100 bg-white text-brand-950"
                }`}
              >
                {m.content}
              </div>
            </div>
          ),
        )}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm text-brand-900/50">
              <Loader2 size={14} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-brand-100 p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder ?? (user ? "Ask about using Tendly…" : "Ask about Tendly…")}
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-950 outline-none transition placeholder:text-brand-900/30 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );

  if (variant === "inline") return panel;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && panel}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition hover:bg-brand-600"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
