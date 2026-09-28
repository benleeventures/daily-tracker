-- Create arc_bookmarks table for the Arc bookmarks app
CREATE TABLE IF NOT EXISTS public.arc_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT NOT NULL CHECK (category IN ('Dailys', 'Ben Lee Coaching', 'General')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_arc_bookmarks_user_id ON public.arc_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_arc_bookmarks_category ON public.arc_bookmarks(category);

-- Enable RLS
ALTER TABLE public.arc_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON public.arc_bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS policy: users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
  ON public.arc_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policy: users can update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
  ON public.arc_bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policy: users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON public.arc_bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_arc_bookmarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_arc_bookmarks_updated_at
  BEFORE UPDATE ON public.arc_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_arc_bookmarks_updated_at();
