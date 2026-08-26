# How to Apply the Supabase Migration

## Quick Instructions (1 minute)

1. Go to https://supabase.com/dashboard
2. Select the Dailys project
3. Click "SQL Editor" → "New Query"
4. Copy and paste the SQL below
5. Click "Run"
6. Done!

---

## The SQL to Run

Copy everything between the `--- START ---` and `--- END ---` markers:

--- START ---

```sql
-- Daily entries table for tracking daily reflections, habits, and tasks
CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  reflection TEXT DEFAULT '',
  energy TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  habits JSONB DEFAULT '{}'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  written_to_ugmonk BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Meetings table for tracking meetings/conversations
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
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

-- RLS Policies for daily_entries
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

-- RLS Policies for meetings
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
```

--- END ---

## Step-by-Step in Supabase Dashboard

1. **Open Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Left sidebar → "SQL Editor"
   - Click "+ New Query" button

3. **Paste the SQL**
   - Clear default template
   - Paste the SQL above
   - (Don't include the "--- START ---" and "--- END ---" markers)

4. **Run the Query**
   - Click "Run" button (or Ctrl+Enter)
   - Should complete in < 2 seconds

5. **Verify Success**
   - Look for output like:
     ```
     CREATE TABLE
     CREATE TABLE
     CREATE INDEX
     CREATE INDEX
     CREATE INDEX
     CREATE INDEX
     ALTER TABLE
     ALTER TABLE
     CREATE POLICY
     CREATE POLICY
     ...
     ```

## Verify Tables Were Created

After running the migration:

1. **Table Editor**
   - Left sidebar → "Table Editor"
   - Should see `daily_entries` listed
   - Should see `meetings` listed

2. **Check Policies**
   - Left sidebar → "Authentication" → "Policies"
   - Should see 8 policies total (4 per table)

3. **Check Indexes**
   - Left sidebar → "Database" → "Indexes"
   - Should see 4 indexes total

## If Something Goes Wrong

### Error: "Relation 'daily_entries' already exists"
- This is fine! Table was already created
- Migration is idempotent (safe to re-run)

### Error: "Permission denied"
- Your Supabase user needs admin privileges
- Ask the project owner to re-run it
- Or use a service role key

### Error: "auth.uid() is null"
- This is also fine! It means no user is logged in
- Error only occurs at runtime when user tries to query
- RLS policies are correctly set up

### Error with function creation
- The `update_updated_at_column()` function might already exist
- Safe to ignore, or add `IF NOT EXISTS` (already included)

## What Gets Created

### Tables (2)
- `daily_entries` - Stores daily reflections, habits, tasks
- `meetings` - Stores meeting notes

### Indexes (4)
- `idx_daily_entries_user_id` - Fast lookup by user
- `idx_daily_entries_user_date` - Fast lookup by user + date
- `idx_meetings_user_id` - Fast lookup by user
- `idx_meetings_user_date` - Fast lookup by user + date

### RLS Policies (8)
- 4 for `daily_entries` (select, insert, update, delete)
- 4 for `meetings` (select, insert, update, delete)
- All enforce `auth.uid() = user_id` (users only see their own data)

### Trigger Function (1)
- `update_updated_at_column()` - Automatically updates `updated_at` timestamp

### Triggers (2)
- `update_daily_entries_updated_at` - Maintains `updated_at` on daily_entries
- `update_meetings_updated_at` - Maintains `updated_at` on meetings

## Alternative: Using Supabase CLI

If you prefer using the command line:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref kcyvhkkmvwegxxmmhthm

# Apply the migration
supabase migration up

# Or push from a specific directory
supabase push
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SQL won't run | Copy without "--- START/END ---" markers |
| Table already exists | This is fine, migration is safe to re-run |
| Permission denied | Need project owner/admin access |
| Can't see new tables | Refresh the Table Editor page |
| RLS policies not appearing | Refresh the Policies page |
| Indexes not showing | Refresh the Database page |

## Next Steps After Migration

1. Go back to project root
2. Run `npm run dev`
3. Navigate to http://localhost:3000
4. Should redirect to /login (because no authentication yet)
5. Sign up with test email
6. Create an entry
7. Verify it saves and loads

## Need Help?

- Migration file: `/supabase/migrations/20260826_daily_entries_schema.sql`
- Setup guide: `/SUPABASE_SETUP.md`
- Deployment guide: `/DEPLOYMENT_GUIDE.md`
- Quick start: `/QUICK_START.md`
