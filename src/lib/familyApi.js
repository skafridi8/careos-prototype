import { supabase } from "./supabaseClient";

// Data access for the Family Portal (family_members, messages, visits,
// visit_logs, care_notes — created by supabase/phase0-schema.sql). Every
// query runs through the logged-in user's session: RLS guarantees a family
// account only ever receives rows for its own linked client, and only the
// categories the manager has marked shareable.

// Monday-based offset matching visits.day_offset (0 = Monday .. 6 = Sunday).
export function todayOffset() {
  return (new Date().getDay() + 6) % 7;
}

export function formatClockTime(pgTime) {
  return typeof pgTime === "string" ? pgTime.slice(0, 5) : "";
}

export async function fetchMyFamilyLink() {
  const { data, error } = await supabase
    .from("family_members")
    .select("client_id, relationship, clients (id, name, location, share_care_notes, share_visit_status)")
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Today's schedule for a client, with the carers assigned to each visit.
export async function fetchTodaysVisits(clientId) {
  const { data, error } = await supabase
    .from("visits")
    .select("id, visit_type, scheduled_start, scheduled_end, requires_two, visit_assignments (carer_id, carers (name))")
    .eq("client_id", clientId)
    .eq("day_offset", todayOffset())
    .order("scheduled_start");
  if (error) throw error;
  return data ?? [];
}

// Today's check-in/check-out events for a set of visit ids.
export async function fetchTodaysVisitLogs(visitIds) {
  if (!visitIds.length) return [];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("visit_logs")
    .select("visit_id, carer_id, event_type, recorded_at")
    .in("visit_id", visitIds)
    .gte("recorded_at", startOfDay.toISOString())
    .order("recorded_at");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSharedCareNotes(clientId, limit = 12) {
  const { data, error } = await supabase
    .from("care_notes")
    .select("id, note, noted_at, carers (name)")
    .eq("client_id", clientId)
    .order("noted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchMessages(clientId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage({ clientId, senderId, senderName, senderRole, content }) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      client_id: clientId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      content,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Mark messages from the other side as read (drives "seen" indicators).
export async function markMessagesRead(clientId, otherRole) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("sender_role", otherRole)
    .is("read_at", null);
}

// Manager only (enforced by RLS): flip what the family portal may show.
export async function updateSharingFlags(clientId, flags) {
  const { error } = await supabase.from("clients").update(flags).eq("id", clientId);
  if (error) throw error;
}

export async function fetchClientSharing(clientId) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, share_care_notes, share_visit_status")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchFamilyMembersForClient(clientId) {
  const { data, error } = await supabase
    .from("family_members")
    .select("id, relationship, profiles (full_name, email)")
    .eq("client_id", clientId);
  if (error) throw error;
  return data ?? [];
}

// Live subscription used by both sides of the portal. postgres_changes events
// are filtered by RLS on the server, so a family subscriber only receives
// events for rows their policies allow them to select.
export function subscribeToFamilyChannel({ clientId, onMessage, onVisitLog }) {
  const channel = supabase
    .channel(`family-portal-${clientId}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${clientId}` },
      (payload) => onMessage?.(payload.new),
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "visit_logs" },
      (payload) => onVisitLog?.(payload.new),
    );
  // The Realtime socket must carry the user's JWT before subscribing, otherwise
  // RLS-checked postgres_changes events are silently dropped for this client.
  supabase.auth.getSession().then(({ data }) => {
    const token = data?.session?.access_token;
    if (token) supabase.realtime.setAuth(token);
    channel.subscribe();
  });
  return () => supabase.removeChannel(channel);
}
