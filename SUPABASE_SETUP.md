# Supabase Setup for Dailys App

This document explains how to set up and deploy the Supabase backend for the Dailys app.

## Current State

The app has been updated to use Supabase for data persistence instead of localStorage. All data syncs across devices automatically.

## Database Schema

### Tables

#### `daily_entries`
Stores daily reflections, habits, tasks, and energy levels.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - Reference to auth.users
- `date` (TEXT) - Local date as YYYY-MM-DD (stored in local timezone)
- `reflection` (TEXT) - Daily reflection/notes
- `energy` (TEXT) - Emoji representation of energy level
- `observations` (TEXT) - Observations for the day
- `habits` (JSONB) - Object mapping habit IDs to boolean completion status
- `tasks` (JSONB) - Array of task objects with id, text, and completed status
- `written_to_ugmonk` (BOOLEAN) - Whether written to Ugmonk service
- `created_at` (TIMESTAMP) - Created timestamp
- `updated_at` (TIMESTAMP) - Updated timestamp

**Unique Constraint:** (user_id, date) - One entry per user per day

#### `meetings`
Stores meeting notes, people met, and associated links.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - Reference to auth.users
- `date` (TEXT) - Local date as YYYY-MM-DD
- `person` (TEXT) - Person/topic name
- `notes` (TEXT) - Meeting notes
- `granola_link` (TEXT) - Link to Granola recording (optional)
- `created_at` (TIMESTAMP) - Created timestamp
- `updated_at` (TIMESTAMP) - Updated timestamp

## Row-Level Security (RLS)

Both tables have RLS enabled with policies that ensure users can only:
- VIEW their own entries and meetings
- INSERT their own entries and meetings
- UPDATE their own entries and meetings
- DELETE their own entries and meetings

RLS is enforced using `auth.uid()` to match the `user_id` column.

## Deployment Steps

### 1. Apply Migrations to Supabase

The migrations are stored in `/supabase/migrations/`:

```bash
# Using Supabase CLI
supabase migration up

# OR manually:
# 1. Go to Supabase dashboard: https://supabase.com
# 2. Navigate to SQL Editor
# 3. Copy the contents of supabase/migrations/20260826_daily_entries_schema.sql
# 4. Execute the SQL in the editor
```

### 2. Verify Tables and RLS Policies

After applying migrations, verify in the Supabase dashboard:

1. Go to **Table Editor** and confirm:
   - `daily_entries` table exists
   - `meetings` table exists
   - All columns are present

2. Go to **Authentication > Policies** and confirm:
   - 4 policies exist for `daily_entries` (select, insert, update, delete)
   - 4 policies exist for `meetings` (select, insert, update, delete)

## Environment Variables

Ensure these are set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://kcyvhkkmvwegxxmmhthm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Data Model Details

### Habits Storage (JSONB)

Habits are stored as a JSON object mapping habit IDs to boolean values:

```json
{
  "surf": true,
  "write": false,
  "meditate": true,
  "supplements": true,
  "biofeedback": false
}
```

### Tasks Storage (JSONB)

Tasks are stored as a JSON array of objects:

```json
[
  {
    "id": "1234567890",
    "text": "Complete project report",
    "completed": true
  },
  {
    "id": "1234567891",
    "text": "Schedule meeting with team",
    "completed": false
  }
]
```

### Date Handling

**Important:** Dates are stored as local date strings (YYYY-MM-DD) in the `date` column, NOT as timestamps. This ensures:
- No timezone conversion issues
- Entries appear on the correct local date for the user
- Cross-device sync works correctly

The app uses `lib/local-date.ts` to ensure dates are always handled in the user's local timezone.

## Testing Cross-Device Sync

1. **Desktop Device:**
   - Log in at https://dailys.app
   - Create/edit an entry
   - Add a habit or task

2. **Mobile Device:**
   - Log in to the same account
   - Navigate to the same date
   - Verify data from desktop appears immediately

3. **Data Persistence:**
   - Close the app on mobile
   - Reopen it
   - Verify data persists

## Troubleshooting

### "No rows returned" error
- Normal when loading an entry that doesn't exist yet
- The app handles this gracefully by creating a new entry on first save

### RLS Policy errors
- Ensure user is authenticated (`auth.uid()` is set)
- Check that `user_id` column matches the authenticated user's ID
- Verify RLS is enabled on the table

### Date mismatches
- Ensure dates are stored as YYYY-MM-DD strings
- Don't store timestamps in the `date` column
- Use `getLocalDateString()` from `lib/local-date.ts`

### Performance
- Indexes on (user_id, date) columns enable fast queries
- Auto-save debounces text changes (2 second delay)
- Meetings and entries load independently

## Migration from localStorage

The app automatically syncs existing localStorage entries to Supabase on first login:
- Existing entries are NOT automatically migrated
- Users should manually copy important data if needed
- New data is stored in Supabase and syncs across devices

## Future Enhancements

- [ ] Implement data export/backup
- [ ] Add delete account functionality
- [ ] Implement offline-first with sync
- [ ] Add sharing/collaboration features
- [ ] Implement data retention policies
