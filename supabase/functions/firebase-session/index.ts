import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { createRemoteJWKSet, jwtVerify, decodeJwt } from "npm:jose@6.1.3";

// This endpoint authenticates Firebase tokens itself, before any privileged call.
const project = "caffe-bigger-cuentas-2026";
const keys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);
const origins = new Set([
  "https://caffebigger.vercel.app",
  "http://localhost:3000",
  "http://localhost:18799",
]);
const url = Deno.env.get("SUPABASE_URL")!;
function envKey(name: string, fallback: string) {
  const values = Deno.env.get(name);
  return values ? JSON.parse(values).default : Deno.env.get(fallback);
}
function checked<T extends { error: unknown; data: unknown }>(
  result: T,
): T["data"] {
  if (result.error) throw new Error("database");
  return result.data;
}
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (origin && origins.has(origin))
    headers["Access-Control-Allow-Origin"] = origin;
  headers["Access-Control-Allow-Headers"] =
    "content-type,apikey,authorization,x-client-info";
  headers["Access-Control-Allow-Methods"] = "POST,OPTIONS";
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers });
  if (origin && !origins.has(origin))
    return reply(403, { error: "Origen no autorizado." });
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST")
    return reply(405, { error: "Método no permitido." });
  if (Number(req.headers.get("content-length") || 0) > 16000)
    return reply(413, { error: "Solicitud demasiado grande." });
  let payload;
  let body;
  try {
    const text = await req.text();
    if (text.length > 16000)
      return reply(413, { error: "Solicitud demasiado grande." });
    body = JSON.parse(text);
    if (typeof body.idToken !== "string" || body.idToken.length > 12000)
      throw new Error("token");
    ({ payload } = await jwtVerify(body.idToken, keys, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${project}`,
      audience: project,
    }));
    if (
      !payload.sub ||
      payload.sub.length > 128 ||
      typeof payload.email !== "string" ||
      payload.email_verified !== true ||
      typeof payload.exp !== "number" ||
      typeof payload.auth_time !== "number"
    )
      throw new Error("identity");
  } catch {
    return reply(401, {
      error: "La sesión no es válida. Confirma tu correo y vuelve a ingresar.",
    });
  }
  try {
    const admin = createClient(
      url,
      envKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
    const lookup = async () =>
      checked(
        await admin.rpc("firebase_lookup", {
          p_uid: payload.sub,
          p_email: payload.email,
        }),
      );
    let account: any = await lookup();
    if (!account) {
      const grant = checked(
        await admin.rpc("firebase_registration_grant", {
          p_uid: payload.sub,
          p_email: payload.email,
        }),
      );
      const created = await admin.auth.admin.createUser({
        email: payload.email as string,
        email_confirm: true,
        app_metadata: {
          bigger_identity_provider: "firebase",
          firebase_uid: payload.sub,
        },
        user_metadata: {
          bigger_registration_uid: payload.sub,
          bigger_registration_token: grant,
          display_name:
            typeof payload.name === "string" ? payload.name.slice(0, 100) : "",
        },
      });
      if (created.error) {
        account = await lookup();
        if (!account) throw new Error("create");
      } else {
        // The bootstrap proof is consumed by the INSERT trigger; remove it
        // from the profile as well. It never becomes an authorization claim.
        const cleaned = await admin.auth.admin.updateUserById(
          created.data.user.id,
          {
            user_metadata: {
              bigger_registration_uid: null,
              bigger_registration_token: null,
            },
          },
        );
        if (cleaned.error) throw new Error("profile");
        account = {
          user_id: created.data.user.id,
          email: created.data.user.email,
          disabled: false,
        };
      }
    }
    if (account.disabled)
      return reply(403, {
        error: "El administrador deshabilitó el acceso de esta cuenta.",
      });
    checked(
      await admin.rpc("firebase_link", {
        p_uid: payload.sub,
        p_user_id: account.user_id,
        p_email: account.email,
      }),
    );
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: account.email,
    });
    if (link.error) throw new Error("link");
    // Isolate the user client so verifyOtp cannot replace the admin credentials.
    const publicClient = createClient(
      url,
      envKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY")!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
    const result = await publicClient.auth.verifyOtp({
      token_hash: link.data.properties.hashed_token,
      type: "email",
    });
    if (
      result.error ||
      !result.data.session ||
      result.data.user?.id !== account.user_id
    )
      throw new Error("session");
    const session = result.data.session,
      claims = decodeJwt(session.access_token);
    const expires = Math.min(payload.exp!, session.expires_at!);
    checked(
      await admin.rpc("firebase_record_session", {
        p_user_id: account.user_id,
        p_session_id: claims.session_id,
        p_expires_at: new Date(expires * 1000).toISOString(),
      }),
    );
    if (body.revokeOthers === true) {
      if (Date.now() / 1000 - (payload.auth_time as number) > 300)
        throw new Error("recent login");
      const { error } = await admin.auth.admin.signOut(
        session.access_token,
        "others",
      );
      if (error) throw new Error("revoke");
    }
    return reply(200, {
      access_token: session.access_token,
      expires_at: expires,
      user: { id: account.user_id, email: account.email },
    });
  } catch {
    // No tokens, passwords, generated links or database errors are logged.
    return reply(503, {
      error: "No pudimos abrir tu espacio de compras. Inténtalo nuevamente.",
    });
  }
});
