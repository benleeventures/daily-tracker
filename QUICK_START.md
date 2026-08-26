# Dailys App: Quick Start Guide

## TL;DR - Apply Supabase Schema in 2 Minutes

### 1. Copy Migration SQL

The migration file is at: `supabase/migrations/20260826_daily_entries_schema.sql`

### 2. Go to Supabase Dashboard

- URL: https://supabase.com/dashboard
- Project: kcyvhkkmvwegxxmmhthm (Dailys)

### 3. Open SQL Editor

1. Click "SQL Editor" in sidebar
2. Click "New Query"
3. Paste the entire contents of `20260826_daily_entries_schema.sql`
4. Click "Run"

### 4. Verify Success

Should see something like:
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

### 5. Done!

Both tables (`daily_entries` and `meetings`) are now created with:
- ✓ All columns
- ✓ Proper data types
- ✓ RLS policies (8 total)
- ✓ Indexes for performance
- ✓ Update triggers

## What Gets Created

### daily_entries table
Stores: date, reflection, energy, observations, habits, tasks, written_to_ugmonk

### meetings table
Stores: date, person, notes, granola_link

### RLS Policies (8 total)
- Users can only view/edit/delete their own data
- Enforced at database level

## Verify in Dashboard

After running the migration:

1. **Table Editor** → Should see:
   - `daily_entries` (listed)
   - `meetings` (listed)

2. **Authentication > Policies** → Should see 8 policies:
   - 4 for `daily_entries` (select, insert, update, delete)
   - 4 for `meetings` (select, insert, update, delete)

3. **Database > Indexes** → Should see 4 indexes:
   - `idx_daily_entries_user_id`
   - `idx_daily_entries_user_date`
   - `idx_meetings_user_id`
   - `idx_meetings_user_date`

## Test Locally

```bash
npm run dev
# Open http://localhost:3000
# Redirects to /login
# Sign up or login
# Create an entry
# Verify it saves and loads
```

## Test Cross-Device

1. Desktop: Log in and create entry
2. Mobile: Log in to same account on same date
3. Mobile: Refresh page
4. Entry appears on mobile immediately

## Deploy to Production

```bash
git add .
git commit -m "Add Supabase backend"
git push origin main
# Vercel auto-deploys in ~60s
# Check https://vercel.com/dashboard
```

## FAQ

**Q: Migration failed with "table already exists"**
A: Table was already created. That's fine - migration is idempotent.

**Q: Can't sign up / getting auth errors**
A: Verify Supabase Auth is enabled in dashboard.

**Q: Data not showing after refresh**
A: Verify RLS policies are created (8 total should exist).

**Q: Getting "Permission denied" errors**
A: RLS policies not applied correctly. Re-run the migration.

**Q: "No rows returned" in console**
A: Normal! It means entry doesn't exist for that date yet. Will create on first save.

**Q: Cross-device sync not working**
A: Make sure you're logged in with the SAME account on both devices.

## Key Files

- `supabase/migrations/20260826_daily_entries_schema.sql` - The schema
- `app/page.tsx` - Main app (uses Supabase)
- `app/login/page.tsx` - Login page (uses Supabase Auth)
- `.env.local` - Supabase credentials (already set)

## Environment

Already configured:
```
NEXT_PUBLIC_SUPABASE_URL=https://kcyvhkkmvwegxxmmhthm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## Summary of Changes

- ✓ Replaced localStorage with Supabase database
- ✓ Added authentication (login page)
- ✓ Added RLS policies (security)
- ✓ Added auto-save for text fields (2 sec debounce)
- ✓ Added immediate save for habits/tasks
- ✓ All data syncs across devices
- ✓ Handles timezone correctly (local dates)
- ✓ TypeScript builds without errors

## Support Resources

- Setup docs: `SUPABASE_SETUP.md`
- Deployment guide: `DEPLOYMENT_GUIDE.md`
- Implementation checklist: `IMPLEMENTATION_CHECKLIST.md`
- Supabase docs: https://supabase.com/docs

## What's Next

After applying the migration:
1. Test login/signup
2. Create an entry
3. Test on mobile (cross-device)
4. Deploy to Vercel
5. Test in production
