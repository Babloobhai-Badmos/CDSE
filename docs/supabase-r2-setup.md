# Blog, audio and storage setup (Supabase + Cloudflare R2)

The code for this is already in the repo. This guide covers the steps that need
your own accounts. Until they're done, the site keeps working from the built-in
list of 16 posts (see `js/posts.js`).

## What lives where

| Thing | Where |
|---|---|
| Post text, authors, publish state, audio link | Supabase database (`posts` table) |
| Editor logins | Supabase Auth + `editors` table |
| MP3 audio files (and later images) | Cloudflare R2 bucket |
| Text-to-speech | Azure AI Speech (swappable, see below) |
| Making the audio | Supabase Edge Function `generate-audio` |

## 1. Supabase

1. Create a project. In **SQL Editor**, run `supabase/migrations/20260101000000_blog.sql`, then `supabase/seed.sql` (adds the 16 archive posts as links to nlujcdse.in).
2. **Authentication → Providers → Email**: keep email sign-in on, and turn **off** "Allow new users to sign up". Create each editor yourself under **Authentication → Users → Add user**.
3. Make that user an editor (SQL Editor):
   ```sql
   insert into public.editors (user_id)
   select id from auth.users where email = 'editor@example.org';
   ```
4. Copy **Project URL** and the **anon / publishable** key (Project Settings → API) into `js/config.js`. These two are safe to publish. Never put the `service_role` key in the site.

Free projects pause after about a week without activity. Open the site or the
dashboard regularly, or add a scheduled ping, so the blog doesn't go offline.

## 2. Cloudflare R2

1. Bucket → **Settings → Public access**: connect a custom domain (for example `media.yourdomain.org`). The `r2.dev` address is fine for testing only.
2. **R2 → Manage API tokens**: create a token with *Object Read & Write* limited to this bucket. Note the Access Key ID, Secret, and your Account ID.

## 3. Text-to-speech (Azure)

Create an **Azure AI Speech** resource (there is a free tier; check its current
monthly allowance). Note its key and region. The default voice is
`en-IN-NeerjaNeural` (Indian English). To use a different provider, edit only
the `synthesize()` function in `supabase/functions/generate-audio/index.ts`.

## 4. Deploy the function

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set \
  AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=centralindia \
  R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=... \
  AUDIO_BASE_URL=https://media.yourdomain.org
supabase functions deploy generate-audio
```

> The function was written without access to these accounts and has **not been
> run end to end yet**. Test it with one short post first and check the file
> plays. Edge Functions have a time limit (about 2.5 minutes on the free
> plan), so a very long post may need to be split.

## 5. Publish a post with audio

1. Open `admin.html` and sign in.
2. **New post**: title, author, text (blank line between paragraphs, `## ` for headings), tick **Published**, **Save**.
3. **Generate audio**. When it says "Audio is ready", open the post: a player appears at the top.
4. Editing the text clears the old audio (it would no longer match). Press **Generate audio** again.

To use your own recording instead, paste its URL into the **Audio file URL** box and save.

## How audio is presented

- Posts with an MP3 get an accessible player: play/pause, back 15s, forward 30s, speed 0.75x–2x, seek bar, remembers your place, lock-screen controls on phones, and a download link. Nothing autoplays.
- Posts without an MP3 but with text offer the browser's built-in read-aloud as a fallback.
- Listings show a small "Audio" label on posts that have an MP3.
- If you publish AI-generated audio, say so on the page or in the About text.

## Not done yet

- The 16 archive posts still link out. To bring one onto the site (so it can have audio), paste its text into the editor, with the author's permission, and clear the external link if you wish.
- Images are still loaded from nlujcdse.in. They can move to the R2 bucket later.
- Podcast RSS feed, if wanted.
