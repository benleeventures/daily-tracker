# Dailys App: Supabase Setup & Deployment Guide

This guide walks through deploying the Supabase backend for the Dailys app.

## Prerequisites

- Supabase project created at https://supabase.com
- `.env.local` configured with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 1: Apply Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com → Your Project → SQL Editor
2. Create a new query
3. Copy the entire contents of `supabase/migrations/20260826_daily_entries_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

### Option B: Using Supabase CLI

```bash
# Install CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref kcyvhkkmvwegxxmmhthm

# Apply migrations
supabase migration up
```

## Step 2: Verify Schema

In Supabase Dashboard:

1. **Table Editor** → Verify tables exist:
   - ✓ `daily_entries` (10 columns)
   - ✓ `meetings` (6 columns)

2. **Authentication > RLS Policies** → Verify policies:
   - ✓ 4 policies on `daily_entries`
   - ✓ 4 policies on `meetings`

3. **Database > Indexes** → Verify indexes:
   - ✓ `idx_daily_entries_user_id`
   - ✓ `idx_daily_entries_user_date`
   - ✓ `idx_meetings_user_id`
   - ✓ `idx_meetings_user_date`

## Step 3: Test Locally

### Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000

### Test Login Flow

1. Navigate to `/login`
2. Click "Sign Up"
3. Enter test email and password
4. Submit (Supabase will send confirmation email)
5. Verify confirmation link works
6. After confirmation, should redirect to `/`

### Test Data Sync (Single Device)

1. Log in with your test account
2. Create a daily entry:
   - Add reflection text
   - Toggle habits
   - Add a task
   - Click "Save entry"
   - Verify "Saved ✓" appears

3. Navigate to different date using arrows
4. Come back to today
   - Verify all data still exists

5. Refresh page
   - Verify data persists (loaded from Supabase)

### Test Cross-Device Sync

**Device 1 (Desktop):**
```bash
npm run dev
# Navigate to http://localhost:3000
# Log in
# Create/edit entry for today
# Add a task: "Cross-device sync test"
```

**Device 2 (Mobile/Tablet on same network):**
```bash
# Get your local IP: ipconfig getifaddr en0 (macOS) or hostname -I (Linux)
# Open http://<YOUR_IP>:3000 on mobile
# Log in with same credentials
# Navigate to today's date
# Verify task appears
```

### Test Meetings

1. Click "Meetings" tab
2. Add a meeting:
   - Person: "Test Person"
   - Notes: "Test meeting notes"
   - Granola link: (optional)
3. Verify appears in list
4. Refresh page → Verify data persists
5. Edit meeting → Update → Verify changes save
6. Delete meeting → Verify removed

### Test Auto-Save

1. Click in reflection textarea
2. Type text (don't click save)
3. Wait 2+ seconds
4. Refresh page
5. Verify typed text appears (was auto-saved)

## Step 4: Test Authentication Edge Cases

### No Redirect to Login
1. Clear all cookies/localStorage
2. Try to access `/` directly
3. Should redirect to `/login`

### Session Persistence
1. Log in successfully
2. Close browser tab
3. Reopen http://localhost:3000
4. Should stay logged in

### Logout (if implemented)
1. Log in
2. Click logout
3. Should redirect to `/login`

## Step 5: Deploy to Vercel

### Via Git Push:

```bash
# Commit and push to main
git add .
git commit -m "Add Supabase backend for Dailys app"
git push origin main

# Vercel will auto-deploy
# Check https://vercel.com/dashboard
```

### Verify Production Deployment:

1. Check deployment URL in Vercel
2. Sign up with test account
3. Create entry
4. Verify auto-saves
5. Refresh page
6. Verify data persists

## Step 6: Test Cross-Device Sync in Production

1. **Desktop:** Log in at https://dailys.vercel.app (or your domain)
2. **Mobile:** Log in on mobile at same URL
3. **Desktop:** Create an entry/task
4. **Mobile:** Refresh page
5. Verify entry/task appears immediately

## Troubleshooting

### "Permission denied" errors
- **Cause:** RLS policies not applied
- **Fix:** Re-run the migration SQL in Supabase Dashboard
- **Verify:** Check that 8 policies exist (4 per table)

### Entries not saving
- **Cause:** Missing `user_id` in session
- **Fix:** Verify user is authenticated via Supabase Auth
- **Check:** Open browser console → look for auth errors

### Entries not loading after refresh
- **Cause:** RLS SELECT policy missing
- **Fix:** Re-apply migrations
- **Verify:** Can query `daily_entries` in SQL Editor

### Cross-device sync not working
- **Cause:** Different user IDs
- **Fix:** Verify you're logged in with same account
- **Cause:** Date mismatch (timezone issue)
- **Fix:** Check dates are stored as YYYY-MM-DD (local)

### "No rows returned" in console
- **This is normal!** It means there's no entry for that date yet
- The app creates a new entry on first save

## Data Structure Reference

### Daily Entry
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "auth-user-id",
  "date": "2026-08-26",
  "reflection": "Great day today...",
  "energy": "🤩",
  "observations": "Some observations...",
  "habits": {
    "surf": true,
    "write": false,
    "meditate": true,
    "supplements": true,
    "biofeedback": false
  },
  "tasks": [
    {
      "id": "1234567890",
      "text": "Complete report",
      "completed": true
    },
    {
      "id": "1234567891",
      "text": "Call Ben",
      "completed": false
    }
  ],
  "written_to_ugmonk": true,
  "created_at": "2026-08-26T10:30:00Z",
  "updated_at": "2026-08-26T15:45:00Z"
}
```

### Meeting
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "auth-user-id",
  "date": "2026-08-26",
  "person": "Renso",
  "notes": "Discussed F&B inventory strategy",
  "granola_link": "https://granola.app/...",
  "created_at": "2026-08-26T14:00:00Z",
  "updated_at": "2026-08-26T14:30:00Z"
}
```

## Performance Notes

- **Auto-save:** Debounced to 2 seconds (saves after user stops typing)
- **Habits & Tasks:** Saved immediately on toggle/edit
- **Indexes:** All queries use (user_id, date) index for fast access
- **RLS:** Enforced at DB level (encrypted in transit via HTTPS)

## Security Considerations

- ✓ RLS prevents users from accessing other users' data
- ✓ Passwords hashed by Supabase Auth
- ✓ All queries include user_id check
- ✓ Anon key only allows authenticated users
- ✓ Dates stored as local strings (no timezone exploitation)

## Next Steps

1. User testing across devices
2. Set up data export/backup
3. Implement delete account flow
4. Add offline-first with sync (PWA)
5. Analytics tracking

## Support

For issues:
1. Check browser console for errors
2. Check Supabase Dashboard → Logs
3. Verify RLS policies are in place
4. Check that `user_id` matches authenticated user
5. Verify dates are in YYYY-MM-DD format
