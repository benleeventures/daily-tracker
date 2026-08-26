-- Optional: Add foreign key constraints to auth.users
-- This migration should only be run if you have service_role key access to auth.users
-- Run this AFTER the initial schema migration succeeds

ALTER TABLE daily_entries
ADD CONSTRAINT fk_daily_entries_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE meetings
ADD CONSTRAINT fk_meetings_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
