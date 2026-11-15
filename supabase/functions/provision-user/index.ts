// Project E.D.E.N. — Edge Function `provision-user`: el Admin crea cuentas con cualquier rol desde MOD-06.
//
// - La clave service_role solo existe aquí (variable de entorno de Supabase); nunca llega al navegador.
// - Quien llama debe tener sesión y rol 'admin' en user_profiles; si no, 403.
// - Crea el usuario ya confirmado; el trigger handle_new_user deja 'paciente' y aquí se fija el rol pedido.
// Despliegue: supabase functions deploy provision-user   (verify_jwt activado: exige token de usuario)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ROLES = ["paciente", "doctor", "programador", "admin"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const asService = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  // 1. ¿Quién llama? (token del usuario con sesión)
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${jwt}` } });
  if (!who.ok) return json(401, { error: "Session expired. Sign in again." });
  const caller = await who.json();

  // 2. Solo admin
  const prof = await asService(`/rest/v1/user_profiles?select=role&id=eq.${encodeURIComponent(caller.id)}`);
  const [callerProfile] = prof.ok ? await prof.json() : [];
  if (callerProfile?.role !== "admin") return json(403, { error: "Only an admin can create crew accounts." });

  // 3. Validar datos
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON body." }); }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "paciente");
  const full_name = String(body.full_name ?? "").trim().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "A valid email is required." });
  if (password.length < 6) return json(400, { error: "Password must be at least 6 characters." });
  if (!ROLES.includes(role)) return json(400, { error: `Role must be one of: ${ROLES.join(", ")}.` });

  // 4. Crear la cuenta (confirmada) → el trigger crea el perfil 'paciente'
  const created = await asService("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name } }),
  });
  const user = await created.json().catch(() => ({}));
  if (!created.ok) {
    const msg = user.msg || user.message || user.error_description || "Could not create the account.";
    return json(created.status === 422 ? 409 : 400, { error: msg });
  }

  // 5. Fijar el rol elegido por el Admin (service_role, del lado del servidor)
  const up = await asService("/rest/v1/user_profiles?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ id: user.id, role, full_name: full_name || null }),
  });
  if (!up.ok) {
    await asService(`/auth/v1/admin/users/${user.id}`, { method: "DELETE" }); // no dejar cuentas a medias
    return json(500, { error: "Account created but role assignment failed; the account was rolled back." });
  }
  const [profile] = await up.json();
  return json(200, { user: { id: user.id, email: user.email }, profile });
});
