-- Table privileges for the API roles.
--
-- Row-level security filters rows; it does NOT grant table privileges. Both are
-- needed. A table created from the SQL editor does not always leave `anon` /
-- `authenticated` with SELECT, and without this the site's public read fails:
--
--   42501  permission denied for table posts
--   hint: GRANT SELECT ON public.posts TO anon;
--
-- When that happens js/posts.js cannot read the table and silently falls back
-- to the built-in 16-post list, which looks like "my new row never appears".
--
-- Safe to re-run.

grant usage on schema public to anon, authenticated;

-- Read: the RLS policy "public reads published posts" narrows this to
-- published rows only.
grant select on public.posts to anon, authenticated;

-- Write: still gated by the is_editor() policies.
grant insert, update, delete on public.posts to authenticated;

-- public.editors deliberately gets NO grants for anon/authenticated. The
-- is_editor() function is SECURITY DEFINER, so it can read the table anyway.

-- Make PostgREST pick up new tables/columns without waiting for its cache.
notify pgrst, 'reload schema';
