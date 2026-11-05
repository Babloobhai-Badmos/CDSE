// Supabase Edge Function: editor-only file upload proxy to Cloudflare R2.
//
// Called from admin.html — lets an editor pick a local file (mp3 audio,
// image, pdf) and store it in R2 without ever seeing R2 secrets or opening
// Cloudflare. Returns a public URL which admin.js then saves into the
// Supabase `posts` row (audio_url for audio, or just shown for copy/paste).
//
// Request: multipart/form-data with:
//   file: File/Blob (required, max 25MB)
//   kind: "audio" | "image" | "file" (default "file")
//   slug: optional post slug, used to build a tidy key for audio
//
// Response: { ok:true, key, publicUrl, contentType, size }
//
// Secrets (set with `supabase secrets set`, never in the website code):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
//   R2_PUBLIC_BASE_URL  public base URL of the bucket, e.g. https://media.cdsenluj.in
//                       (AUDIO_BASE_URL is still read as a fallback from older setups)
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are automatic.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED: Record<string, string[]> = {
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac", "audio/ogg", "audio/webm"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  file: [], // anything under MAX_BYTES (pdf, docx, etc.)
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name}`);
  return v;
}

// The public base URL of the bucket. One secret covers audio, images and
// PDFs — they all live in the same bucket, under audio/ images/ uploads/.
// AUDIO_BASE_URL is the old name; accepted so an existing deployment keeps
// working after this rename.
function publicBaseUrl(): string {
  const v = Deno.env.get("R2_PUBLIC_BASE_URL") || Deno.env.get("AUDIO_BASE_URL");
  if (!v) throw new Error("Missing secret R2_PUBLIC_BASE_URL");
  return v.replace(/\/$/, "");
}

function sanitize(name: string): string {
  const base = (name.split(/[\\/]/).pop() || "file").toLowerCase();
  return base.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "file";
}

function extOf(filename: string, contentType: string): string {
  const m = filename.match(/\.([a-z0-9]{2,5})$/i);
  if (m) return m[1].toLowerCase();
  if (contentType === "audio/mpeg" || contentType === "audio/mp3") return "mp3";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "bin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // 1. Only editors may upload.
  const authHeader = req.headers.get("Authorization") ?? "";
  const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });
  const who = await asUser.rpc("is_editor");
  if (who.error || who.data !== true) return json({ error: "Not allowed" }, 403);

  // 2. Parse multipart form.
  let file: File | null = null;
  let kind = "file";
  let slug = "";
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
    const k = form.get("kind");
    if (typeof k === "string" && ["audio", "image", "file"].includes(k)) kind = k;
    const s = form.get("slug");
    if (typeof s === "string") slug = s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 80);
  } catch {
    return json({ error: "Expected multipart/form-data with a 'file' field" }, 400);
  }
  if (!file) return json({ error: "'file' is required" }, 400);
  if (file.size === 0) return json({ error: "Empty file" }, 400);
  if (file.size > MAX_BYTES) return json({ error: "File too large (max 25MB)" }, 413);

  const contentType = file.type || "application/octet-stream";
  const allowed = ALLOWED[kind] || [];
  if (allowed.length && !allowed.includes(contentType)) {
    return json({ error: `Unexpected type ${contentType} for kind=${kind}` }, 415);
  }

  // 3. Build a tidy R2 key.
  const clean = sanitize(file.name);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  let key: string;
  if (kind === "audio" && slug) {
    key = `audio/${slug}.${extOf(clean, contentType)}`;
  } else if (kind === "audio") {
    key = `audio/${date}-${clean}`;
  } else if (kind === "image") {
    key = `images/${date}-${clean}`;
  } else {
    key = `uploads/${date}-${clean}`;
  }

  // 4. Upload to R2 (S3-compatible API). Secrets never leave the server.
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const r2 = new AwsClient({
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
      service: "s3",
      region: "auto",
    });
    const put = await r2.fetch(
      `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${env("R2_BUCKET")}/${key}`,
      { method: "PUT", headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" }, body: bytes },
    );
    if (!put.ok) throw new Error(`Storage upload failed ${put.status}: ${(await put.text()).slice(0, 200)}`);

    const publicUrl = `${publicBaseUrl()}/${key}?v=${Date.now()}`;
    return json({ ok: true, key, publicUrl, contentType, size: file.size });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: message }, 500);
  }
});
