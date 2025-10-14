import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment
const PWD_HMAC_HEX = Deno.env.get("SUDO_PASSWORD_HMAC") || ""; // hex(HMAC_SHA256(password, KEY))
const KEY_CONF = Deno.env.get("SUDO_PASSWORD_KEY") || ""; // key string; may be hex or plain text
const TOKEN_SECRET = Deno.env.get("SUDO_TOKEN_SECRET") || ""; // HS256 secret for session token
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RATE_LIMIT_WINDOW_SECONDS = Number(Deno.env.get("SUDO_RATE_WINDOW_SECONDS") || "60");
const RATE_LIMIT_MAX_ATTEMPTS = Number(Deno.env.get("SUDO_RATE_MAX_ATTEMPTS") || "5");
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!PWD_HMAC_HEX || !KEY_CONF || !TOKEN_SECRET) {
  console.error("Missing env: SUDO_PASSWORD_HMAC, SUDO_PASSWORD_KEY, or SUDO_TOKEN_SECRET");
}

async function getJwtKey() {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TOKEN_SECRET || ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function corsHeaders(origin: string) {
  return {
    "content-type": "application/json",
    "access-control-allow-origin": origin || "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization, x-sudo-token",
    "vary": "Origin",
  } as Record<string, string>;
}

function json(status: number, body: unknown, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

function hexToBytes(hex: string) {
  return Uint8Array.from(hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || []);
}

function parseKey(input: string): Uint8Array {
  const isHex = /^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0;
  return isHex ? hexToBytes(input) : new TextEncoder().encode(input);
}

async function hmacHex(message: string, keyConf: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    parseKey(keyConf),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const forwardedIp = forwarded.split(",")[0]?.trim();
  return (
    req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || (forwardedIp || "")
  );
}

async function hashIdentifier(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function computeFingerprint(req: Request) {
  const ip = getClientIp(req) || "unknown-ip";
  const ua = req.headers.get("user-agent") || "";
  return await hashIdentifier(`${ip}|${ua}`);
}

async function recordAttempt(
  supabase: any,
  payload: { fingerprint: string; origin: string; outcome: string; blocked?: boolean },
) {
  if (!supabase) return;
  try {
    await supabase.from("sudo_attempts").insert({
      fingerprint: payload.fingerprint,
      origin: payload.origin || null,
      outcome: payload.outcome,
      blocked: payload.blocked ?? false,
    });
  } catch (e) {
    console.error("sudo-login: attempt log failed", e);
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return json(405, { error: "method" }, origin);
  if (ALLOWED.length && !ALLOWED.includes(origin)) return json(403, { error: "origin" }, origin);

  const supabase = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

  let fingerprint = "";
  try {
    fingerprint = await computeFingerprint(req);
  } catch (e) {
    console.error("sudo-login: fingerprint failed", e);
  }

  if (supabase && fingerprint) {
    const windowStartIso = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
    try {
      const { count, error } = await supabase
        .from("sudo_attempts")
        .select("id", { count: "exact", head: true })
        .eq("fingerprint", fingerprint)
        .gte("created_at", windowStartIso);
      if (!error && typeof count === "number" && count >= RATE_LIMIT_MAX_ATTEMPTS) {
        await recordAttempt(supabase, { fingerprint, origin, outcome: "blocked", blocked: true });
        return json(429, { error: "rate_limit", retryAfter: RATE_LIMIT_WINDOW_SECONDS }, origin);
      }
      if (error) console.error("sudo-login: rate limit query failed", error);
    } catch (e) {
      console.error("sudo-login: rate limit lookup failed", e);
    }
  }

  const { password } = await req.json().catch(() => ({}));
  if (!password) return json(400, { error: "password" }, origin);

  try {
    const given = await hmacHex(password, KEY_CONF);
    const success = timingSafeEqHex(given, PWD_HMAC_HEX);
    if (fingerprint && supabase) {
      await recordAttempt(supabase, {
        fingerprint,
        origin,
        outcome: success ? "success" : "failure",
      });
    }
    if (!success) return json(401, { error: "auth" }, origin);

    const jti = crypto.randomUUID();
    const exp = getNumericDate(10 * 60); // 10 minutes
    const key = await getJwtKey();
    const token = await create({ alg: "HS256", typ: "JWT" }, { scope: "write", jti, exp }, key);
    return json(200, { token, exp: exp * 1000 }, origin);
  } catch (e) {
    console.error(e);
    return json(500, { error: "server" }, origin);
  }
});
