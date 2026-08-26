-- Daily entries table for tracking daily reflections, habits, and tasks
CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- local date as YYYY-MM-DD (stored in local timezone, not UTC)
  reflection TEXT DEFAULT '',
  energy TEXT DEFAULT '', -- emoji representation
  observations TEXT DEFAULT '',
  habits JSONB DEFAULT '{}'::jsonb, -- { habitId: boolean }
  tasks JSONB DEFAULT '[]'::jsonb, -- array of { id, text, completed }
  written_to_ugmonk BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Meetings table for tracking meetings/conversations
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- local date as YYYY-MM-DD
  person TEXT NOT NULL,
  notes TEXT DEFAULT '',
  granola_link TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON daily_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON daily_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_date ON meetings(user_id, date);

-- Enable RLS
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_entries: users can only read/write their own data
CREATE POLICY "Users can view their own daily entries"
  ON daily_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily entries"
  ON daily_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily entries"
  ON daily_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily entries"
  ON daily_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meetings: users can only read/write their own data
CREATE POLICY "Users can view their own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings"
  ON meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at on changes
CREATE TRIGGER update_daily_entries_updated_at
  BEFORE UPDATE ON daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
