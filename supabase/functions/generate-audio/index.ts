// Supabase Edge Function: turn a post's text into an MP3, store it in
// Cloudflare R2, and record the public URL on the post.
//
// Called from the editor page:  supabase.functions.invoke("generate-audio", { body: { post_id } })
// Caller must be a signed-in editor (public.is_editor()).
//
// Secrets (set with `supabase secrets set`, never in the website code):
//   AZURE_SPEECH_KEY, AZURE_SPEECH_REGION   Azure AI Speech (text-to-speech)
//   AZURE_VOICE        optional, default en-IN-NeerjaNeural
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
//   AUDIO_BASE_URL     public base URL of the bucket, e.g. https://media.example.org
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// To use another voice provider, only synthesize() needs to change.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MP3_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const BITRATE = 48000;
const MAX_CHUNK_CHARS = 3000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name}`);
  return v;
}
function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Split into paragraph-sized chunks so each request stays well under the provider's limits.
function toChunks(title: string, author: string, body: string): string[] {
  const blocks = [`${title}. By ${author}.`].concat(
    body.split(/\n\s*\n/).map((b) => b.replace(/^##\s*/, "").trim()).filter(Boolean),
  );
  const chunks: string[] = [];
  let cur = "";
  for (const b of blocks) {
    if (b.length > MAX_CHUNK_CHARS) {
      // Very long paragraph: split on sentence ends.
      if (cur) cur += "\n";
      for (const sent of b.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [b]) {
        if ((cur + sent).length > MAX_CHUNK_CHARS && cur) { chunks.push(cur); cur = ""; }
        cur += sent;
      }
      continue;
    }
    if ((cur + "\n" + b).length > MAX_CHUNK_CHARS && cur) { chunks.push(cur); cur = ""; }
    cur += (cur ? "\n" : "") + b;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function synthesize(text: string): Promise<Uint8Array> {
  const region = env("AZURE_SPEECH_REGION");
  const voice = Deno.env.get("AZURE_VOICE") ?? "en-IN-NeerjaNeural";
  const ssml =
    `<speak version="1.0" xml:lang="en-IN"><voice name="${voice}">${xmlEscape(text)}</voice></speak>`;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": env("AZURE_SPEECH_KEY"),
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": MP3_FORMAT,
      "User-Agent": "cdse-audio",
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Voice service error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return new Uint8Array(await res.arrayBuffer());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // 1. Only editors may call this.
  const authHeader = req.headers.get("Authorization") ?? "";
  const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });
  const who = await asUser.rpc("is_editor");
  if (who.error || who.data !== true) return json({ error: "Not allowed" }, 403);

  let postId = "";
  try { postId = (await req.json()).post_id; } catch { /* handled below */ }
  if (!postId) return json({ error: "post_id is required" }, 400);

  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const { data: post, error } = await admin.from("posts").select("*").eq("id", postId).single();
  if (error || !post) return json({ error: "Post not found" }, 404);
  if (!post.has_body) return json({ error: "This post has no text to read" }, 400);

  await admin.from("posts").update({ audio_status: "queued", audio_error: null }).eq("id", postId);

  try {
    // 2. Text -> MP3 (chunks of MP3 frames can simply be joined end to end).
    const parts: Uint8Array[] = [];
    for (const chunk of toChunks(post.title, post.author, post.body)) parts.push(await synthesize(chunk));
    const total = parts.reduce((n, p) => n + p.length, 0);
    const mp3 = new Uint8Array(total);
    let off = 0;
    for (const p of parts) { mp3.set(p, off); off += p.length; }

    // 3. Upload to R2 (S3-compatible API).
    const key = `audio/${post.slug}.mp3`;
    const r2 = new AwsClient({
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
      service: "s3",
      region: "auto",
    });
    const put = await r2.fetch(
      `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${env("R2_BUCKET")}/${key}`,
      { method: "PUT", headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000" }, body: mp3 },
    );
    if (!put.ok) throw new Error(`Storage upload failed ${put.status}: ${(await put.text()).slice(0, 200)}`);

    // 4. Record it. The ?v= suffix makes browsers fetch the new file after a re-generation.
    const url = `${env("AUDIO_BASE_URL").replace(/\/$/, "")}/${key}?v=${Date.now()}`;
    const seconds = Math.round((total * 8) / BITRATE);
    await admin.from("posts").update({
      audio_url: url, audio_duration_seconds: seconds, audio_status: "ready", audio_error: null,
    }).eq("id", postId);
    return json({ ok: true, audio_url: url, seconds });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.from("posts").update({ audio_status: "failed", audio_error: message.slice(0, 300) }).eq("id", postId);
    return json({ error: message }, 500);
  }
});
