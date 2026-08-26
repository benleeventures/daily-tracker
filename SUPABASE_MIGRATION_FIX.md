# Supabase Migration Fix: auth.users Reference Error

## The Problem

The original migration failed with: `column "user_id" does not exist`

This happens because:
1. Supabase's `auth.users` table is in the `auth` schema managed by Supabase's auth service
2. Depending on how migrations are executed (anon key vs service role key), the `auth` schema may not be accessible
3. Direct FOREIGN KEY constraints to `auth.users` require special permissions in Supabase

## The Solution

The corrected migration (`20260826_daily_entries_schema.sql`) removes the direct FOREIGN KEY constraint to `auth.users(id)` and instead:

- Stores `user_id` as a regular UUID column (no constraint)
- Relies on **Row-Level Security (RLS) policies** to enforce data isolation
- Uses `auth.uid() = user_id` checks in policies (this always works in Supabase)

### Why This Works

- **RLS policies** check `auth.uid()` against the `user_id` column at query time
- No schema access to `auth.users` needed
- Provides the same data isolation guarantees as foreign keys
- Actually more flexible—allows tracking deleted users' data if needed

## How to Apply

### Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the corrected SQL from `20260826_daily_entries_schema.sql`
5. Click **Run**

If you already ran the original migration:
- Drop the tables first:
  ```sql
  DROP TABLE IF EXISTS meetings CASCADE;
  DROP TABLE IF EXISTS daily_entries CASCADE;
  ```
- Then paste and run the corrected migration

### Option 2: Use Supabase CLI (Advanced)

```bash
# Make sure you're in the project directory
supabase db push

# This will apply any pending migrations from supabase/migrations/
```

This requires you to have the Supabase CLI installed and authenticated with your service role key.

## Optional: Add Foreign Key Later

If you want to enforce foreign key constraints to `auth.users`, you can run the optional migration `20260826_add_fk_auth_users.sql` **only after** you have service role key access.

This should be run through the Supabase Dashboard with special permissions, or via the CLI with your service role key.

## Cross-Device Sync Setup

With the tables created, your app can now sync data across devices:

```typescript
// In your app, when user logs in:
const { data } = await supabase.auth.getUser();
const userId = data.user.id;

// All queries automatically filtered by RLS policy:
const { data: entries } = await supabase
  .from('daily_entries')
  .select('*')
  .eq('date', '2024-08-26');
// Returns only entries for the logged-in user
```

The RLS policies handle isolation—no need for manual `WHERE user_id = ?` checks.

## Troubleshooting

**If you still see errors:**

1. Clear browser cache and reload
2. Check that Supabase auth is properly initialized in your app
3. Verify the tables exist:
   ```sql
   SELECT * FROM daily_entries LIMIT 1;
   ```
4. Check RLS policy status:
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('daily_entries', 'meetings');
   ```

If policies exist but queries still fail, verify `auth.uid()` returns a valid UUID during your session.
