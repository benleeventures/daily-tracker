-- Add missing columns to daily_entries table

ALTER TABLE daily_entries
ADD COLUMN IF NOT EXISTS tasks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS written_to_ugmonk boolean DEFAULT false;