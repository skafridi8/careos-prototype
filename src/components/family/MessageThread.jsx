import { useEffect, useRef, useState } from "react";
import { Send, Loader2, CheckCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchMessages,
  sendMessage,
  markMessagesRead,
  subscribeToFamilyChannel,
} from "../../lib/familyApi";
import { timeAgo } from "../../lib/careData";

/**
 * Live two-way thread between the care team and a client's family.
 * Both sides render this component with their own senderRole; messages arrive
 * through Supabase Realtime (postgres_changes on the messages table), so a
 * reply from the other side appears without a refresh.
 */
export default function MessageThread({ clientId, senderRole, heightClass = "h-72" }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const otherRole = senderRole === "family" ? "team" : "family";

  useEffect(() => {
    let cancelled = false;
    fetchMessages(clientId)
      .then((data) => {
        if (cancelled) return;
        setMessages(data);
        markMessagesRead(clientId, otherRole);
      })
      .catch((err) => {
        console.error("Failed to load messages", err);
        if (!cancelled) {
          setMessages([]);
          setError("Couldn't load messages.");
        }
      });

    const unsubscribe = subscribeToFamilyChannel({
      clientId,
      onMessage: (msg) => {
        if (cancelled) return;
        setMessages((prev) => {
          if (!prev || prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_role === otherRole) markMessagesRead(clientId, otherRole);
      },
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [clientId, otherRole]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function onSend(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending || !user) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendMessage({
        clientId,
        senderId: user.id,
        senderName: profile?.full_name || user.email,
        senderRole,
        content,
      });
      setInput("");
      // Realtime will also deliver this insert; the id check dedupes it.
      setMessages((prev) => (prev?.some((m) => m.id === msg.id) ? prev : [...(prev ?? []), msg]));
    } catch (err) {
      console.error("Failed to send message", err);
      setError("Message didn't send, please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div ref={scrollRef} className={`${heightClass} space-y-2.5 overflow-y-auto rounded-xl bg-brand-50/40 p-3`}>
        {messages === null ? (
          <div className="flex items-center gap-2 text-sm text-brand-900/40">
            <Loader2 size={14} className="animate-spin" /> Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-brand-900/40">
            No messages yet — send the first one below.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === senderRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-brand-500 text-white" : "border border-brand-100 bg-white text-brand-950"
                  }`}
                >
                  <div className={`mb-0.5 text-[11px] font-medium ${mine ? "text-white/70" : "text-brand-900/40"}`}>
                    {m.sender_name || (m.sender_role === "team" ? "Care team" : "Family")} · {timeAgo(m.created_at)}
                  </div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {mine && m.read_at && (
                    <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] text-white/60">
                      <CheckCheck size={11} /> Seen
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <div className="mt-2 text-xs font-medium text-rose-500">{error}</div>}

      <form onSubmit={onSend} className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={senderRole === "family" ? "Message the care team…" : "Message the family…"}
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-950 outline-none transition placeholder:text-brand-900/30 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
}
