import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts";

// Environment
const PWD_HMAC_HEX = Deno.env.get("SUDO_PASSWORD_HMAC") || ""; // hex(HMAC_SHA256(password, KEY))
const KEY_CONF = Deno.env.get("SUDO_PASSWORD_KEY") || "";       // key string; may be hex or plain text
const TOKEN_SECRET = Deno.env.get("SUDO_TOKEN_SECRET") || "";    // HS256 secret for session token
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!PWD_HMAC_HEX || !KEY_HEX || !TOKEN_SECRET) {
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

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return json(405, { error: "method" }, origin);
  if (ALLOWED.length && !ALLOWED.includes(origin)) return json(403, { error: "origin" }, origin);

  const { password } = await req.json().catch(() => ({}));
  if (!password) return json(400, { error: "password" }, origin);

  try {
    const given = await hmacHex(password, KEY_CONF);
    if (!timingSafeEqHex(given, PWD_HMAC_HEX)) return json(401, { error: "auth" }, origin);

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
