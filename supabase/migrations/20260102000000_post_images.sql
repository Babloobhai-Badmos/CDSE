-- Optional cover image for a post.
--
-- The image file itself lives in Cloudflare R2 (uploaded from admin.html);
-- only its public URL and alt text are stored here.
--
--   supabase/migrations/20260101000000_blog.sql   (run first)
--   supabase/migrations/20260102000000_post_images.sql   (this file)
--
-- Safe to re-run.

alter table public.posts
  add column if not exists image_url text,
  add column if not exists image_alt text;

comment on column public.posts.image_url is
  'Public R2 URL of the post cover image, e.g. https://media.example.org/images/20260101-team.jpg';
comment on column public.posts.image_alt is
  'Alt text for the cover image. Falls back to the post title when empty.';
