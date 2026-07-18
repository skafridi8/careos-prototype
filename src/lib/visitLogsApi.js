import { supabase } from "./supabaseClient";

// GPS visit verification (Feature Area 4). Check-ins/outs are real rows in
// visit_logs with browser-geolocation coordinates; the office live board and
// the family portal both react to the same inserts over Supabase Realtime.

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// Browser geolocation as a promise. Resolves null (rather than rejecting) if
// permission is denied or times out, so a check-in still records with a
// "location unavailable" row instead of blocking the carer.
export function getPosition(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
}

// Real check-in/check-out write: requests geolocation, then inserts the event.
export async function logVisitEvent({ visitId, carerId, eventType }) {
  const coords = await getPosition();
  const { data, error } = await supabase
    .from("visit_logs")
    .insert({
      visit_id: visitId,
      carer_id: carerId,
      event_type: eventType,
      recorded_at: new Date().toISOString(),
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// All of today's events for one visit (both carers on a double-up).
export async function fetchTodaysLogsForVisit(visitId) {
  const { data, error } = await supabase
    .from("visit_logs")
    .select("id, carer_id, event_type, recorded_at, latitude, longitude")
    .eq("visit_id", visitId)
    .gte("recorded_at", startOfTodayIso())
    .order("recorded_at");
  if (error) throw error;
  return data ?? [];
}

// Today's events across all carers, newest first — powers the live board.
export async function fetchTodaysLogs() {
  const { data, error } = await supabase
    .from("visit_logs")
    .select("id, visit_id, carer_id, event_type, recorded_at, latitude, longitude, visits (client_id, visit_type), carers (name)")
    .gte("recorded_at", startOfTodayIso())
    .order("recorded_at", { ascending: false })
    .limit(120);
  if (error) throw error;
  return data ?? [];
}

// Live inserts. Same JWT-before-subscribe rule as the family portal: without
// setAuth, RLS-checked postgres_changes events are silently dropped.
export function subscribeToVisitLogInserts(onInsert) {
  const channel = supabase
    .channel(`visit-logs-live-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "visit_logs" },
      (payload) => onInsert?.(payload.new),
    );
  supabase.auth.getSession().then(({ data }) => {
    const token = data?.session?.access_token;
    if (token) supabase.realtime.setAuth(token);
    channel.subscribe();
  });
  return () => supabase.removeChannel(channel);
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Continuity + proximity stats for the carer-suggestion engine, derived from
// 30 days of GPS-verified history:
//  - visits30d[carerId][clientId] = check-in count (continuity with the client)
//  - lastPosition[carerId] = most recent coordinates seen today (proximity)
//  - clientCoords[clientId] = home coordinates from the clients table
export async function fetchLiveSuggestionStats() {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [logsRes, clientsRes] = await Promise.all([
    supabase
      .from("visit_logs")
      .select("carer_id, event_type, recorded_at, latitude, longitude, visits (client_id)")
      .eq("event_type", "check_in")
      .gte("recorded_at", since.toISOString())
      .order("recorded_at", { ascending: false })
      .limit(3000),
    supabase.from("clients").select("id, latitude, longitude"),
  ]);
  if (logsRes.error) throw logsRes.error;
  if (clientsRes.error) throw clientsRes.error;

  const visits30d = {};
  const lastPosition = {};
  const todayIso = startOfTodayIso();
  for (const log of logsRes.data ?? []) {
    const clientId = log.visits?.client_id;
    if (clientId) {
      visits30d[log.carer_id] ??= {};
      visits30d[log.carer_id][clientId] = (visits30d[log.carer_id][clientId] || 0) + 1;
    }
    if (!lastPosition[log.carer_id] && log.recorded_at >= todayIso && log.latitude != null) {
      lastPosition[log.carer_id] = { latitude: log.latitude, longitude: log.longitude };
    }
  }
  const clientCoords = Object.fromEntries(
    (clientsRes.data ?? []).map((c) => [c.id, { latitude: c.latitude, longitude: c.longitude }]),
  );
  return { visits30d, lastPosition, clientCoords };
}
