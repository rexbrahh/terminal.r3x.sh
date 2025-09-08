import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify } from "https://deno.land/x/djwt@v2.9/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TOKEN_SECRET = Deno.env.get("SUDO_TOKEN_SECRET") || "";
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function getVerifyKey() {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TOKEN_SECRET || ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
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

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return json(405, { error: "method" }, origin);
  if (ALLOWED.length && !ALLOWED.includes(origin)) return json(403, { error: "origin" }, origin);

  const token = req.headers.get("x-sudo-token") || "";
  try {
    const key = await getVerifyKey();
    const payload = await verify(token, key, "HS256");
    if ((payload as Record<string, unknown>)?.scope !== "write") return json(403, { error: "scope" }, origin);
  } catch (_e) {
    return json(401, { error: "auth" }, origin);
  }

  const { path, content, prevUpdatedAt, force, allowCreate } = await req.json().catch(() => ({}));
  if (!path || typeof content !== "string") return json(400, { error: "input" }, origin);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { data: before } = await supabase
      .from("site_content")
      .select("content,updated_at")
      .eq("path", path)
      .maybeSingle();

    if (!force && prevUpdatedAt && before?.updated_at && before.updated_at !== prevUpdatedAt) {
      return json(409, { error: "conflict" }, origin);
    }

    const now = new Date().toISOString();
    let updatedAt = now;
    if (before || !allowCreate) {
      const { data, error } = await supabase
        .from("site_content")
        .update({ content, updated_at: now })
        .eq("path", path)
        .select("updated_at")
        .maybeSingle();
      if (error) throw error;
      updatedAt = data?.updated_at || now;
    } else {
      const parent = path.split("/").slice(0, -1).join("/") || null;
      const title = path.split("/").pop() || path;
      const { data, error } = await supabase
        .from("site_content")
        .insert({ path, type: "file", title, content, parent_path: parent, updated_at: now, published: true })
        .select("updated_at")
        .maybeSingle();
      if (error) throw error;
      updatedAt = data?.updated_at || now;
    }

    // Best-effort audit (no need to block on errors)
    try {
      const enc = new TextEncoder();
      const sha = await crypto.subtle.digest("SHA-256", enc.encode(content));
      await supabase.from("write_audit").insert({
        path,
        action: "save",
        size_after: content.length,
        sha_after: Array.from(new Uint8Array(sha)).map((b)=>b.toString(16).padStart(2,"0")).join(""),
        outcome: "ok",
      });
    } catch { /* ignore */ }

    return json(200, { updatedAt }, origin);
  } catch (e) {
    console.error(e);
    return json(500, { error: "server" }, origin);
  }
});
