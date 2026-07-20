import { getSupabaseAdmin } from "../_supabaseAdmin.js";

function randomPassword() {
  return `Tendly-${Math.random().toString(36).slice(2, 10)}!`;
}

// Manager-only: create a real Supabase auth account with role "family",
// link it to one client in family_members, and hand back a one-time
// password to share with them. Mirrors the manual steps used to set up the
// demo family account (see supabase/phase0-schema.sql), so any client can
// get a family login without touching SQL.
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { clientId, fullName, email, relationship } = req.body || {};
  if (!clientId || !fullName || !email) {
    res.status(400).json({ error: "clientId, fullName and email are required" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();

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
  const { data: requester } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (requester?.role !== "manager") {
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

  const password = randomPassword();
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "family", full_name: fullName },
  });
  if (createError) {
    const status = createError.status === 422 || /already registered/i.test(createError.message) ? 409 : 500;
    res.status(status).json({ error: createError.message });
    return;
  }

  const newUserId = created.user.id;
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: newUserId, role: "family", full_name: fullName, email });
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    res.status(500).json({ error: profileError.message });
    return;
  }

  const { error: linkError } = await supabaseAdmin
    .from("family_members")
    .insert({ profile_id: newUserId, client_id: clientId, relationship: relationship || null });
  if (linkError) {
    await supabaseAdmin.from("profiles").delete().eq("id", newUserId);
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    res.status(500).json({ error: linkError.message });
    return;
  }

  res.status(200).json({ email, password, clientName: client.name });
}
