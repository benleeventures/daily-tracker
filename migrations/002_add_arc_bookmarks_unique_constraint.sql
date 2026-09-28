-- Prevent duplicate bookmarks per user (needed for the Notion import's ON CONFLICT DO NOTHING)
ALTER TABLE public.arc_bookmarks ADD CONSTRAINT arc_bookmarks_user_url_unique UNIQUE (user_id, url);
