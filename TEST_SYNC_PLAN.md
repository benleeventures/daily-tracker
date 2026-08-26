# Cross-Device Sync Test Plan

## Issues Fixed

### 1. **No Real-Time Sync Between Devices** ✓
- **Problem**: App loaded data once on mount and never checked for updates
- **Fix**: Added periodic polling every 5 seconds (lines 233-286) to refresh entry and meetings data from Supabase
- **Location**: `app/page.tsx` - new useEffect for polling

### 2. **Session State Not Verified Across Devices** ✓
- **Problem**: App didn't monitor auth state changes between devices
- **Fix**: Added auth state listener to detect SIGNED_IN and SIGNED_OUT events (lines 209-231)
- **Location**: `app/page.tsx` - updated checkAuth useEffect

### 3. **Incomplete useEffect Dependencies** ✓
- **Problem**: Initial auth check ran once and never re-validated
- **Fix**: Added `onAuthStateChange` subscription that re-validates on auth events
- **Location**: `app/page.tsx` - lines 209-231

### 4. **No Window Focus Refresh** ✓
- **Problem**: User switches tabs/apps and data is stale when they return
- **Fix**: Added window focus listener to reload data when tab regains focus (lines 288-303)
- **Location**: `app/page.tsx` - new useEffect with focus handler

### 5. **Weak Task ID Generation** ✓
- **Problem**: Task IDs used `Date.now()` which could collide
- **Fix**: Changed to `task_${Date.now()}_${random}` for uniqueness
- **Fix**: Added immediate save when task is created
- **Location**: `app/page.tsx` - lines 273-291

### 6. **Immediate Save on Add Task** ✓
- **Problem**: Tasks created locally might not sync immediately
- **Fix**: Added `saveEntryToSupabase()` call immediately after creating task
- **Location**: `app/page.tsx` - addTask function

---

## Test Scenarios

### Test 1: Session Persistence
**Goal**: Verify session persists across browser closes

**Steps**:
1. Open app in desktop browser
2. Log in with test account
3. Add a task (e.g., "Test task 1")
4. Close browser completely
5. Reopen browser and navigate to app
6. Verify: Still logged in? Task still there?

**Expected Result**: User remains logged in, task appears

**Command**: Manual browser test

---

### Test 2: Desktop → Mobile Same Date
**Goal**: Verify task added on desktop appears on mobile same day

**Steps**:
1. Open app on Desktop (Chrome)
2. Log in with test account
3. Ensure viewing today's date
4. Add a task: "Sync Test - Desktop to Mobile"
5. Verify task appears on desktop
6. Open app on Mobile (Safari/Chrome) - same account
7. Navigate to today's date if needed
8. Wait 5 seconds (for polling)
9. Verify task appears

**Expected Result**: Mobile shows the desktop task within 5 seconds

**Command**: Manual cross-device test

---

### Test 3: Mobile → Desktop Same Date
**Goal**: Verify task added on mobile appears on desktop

**Steps**:
1. Open app on Mobile
2. Log in with test account
3. Ensure viewing today's date
4. Add a task: "Sync Test - Mobile to Desktop"
5. Verify task appears on mobile
6. Check Desktop app (already open from Test 2)
7. Wait 5 seconds for polling
8. Verify task appears on desktop

**Expected Result**: Desktop shows the mobile task within 5 seconds

**Command**: Manual cross-device test

---

### Test 4: Cross-Date Sync
**Goal**: Verify sync works when viewing different dates

**Steps**:
1. Desktop viewing today (2026-08-26)
2. Mobile viewing tomorrow (2026-08-27)
3. Add task on Desktop for tomorrow: "Task for tomorrow"
4. Navigate Mobile to tomorrow
5. Wait 5 seconds
6. Verify: Desktop shows it? Mobile shows it?

**Expected Result**: Both devices sync properly across date changes

**Command**: Manual test

---

### Test 5: Rapid Task Additions
**Goal**: Verify no task ID collisions with rapid adds

**Steps**:
1. Open desktop app
2. Rapidly add 5 tasks in quick succession:
   - "Task 1"
   - "Task 2"
   - "Task 3"
   - "Task 4"
   - "Task 5"
3. Verify all 5 tasks appear on desktop
4. Check Mobile - wait 5 seconds
5. Verify all 5 tasks appear on mobile with unique IDs

**Expected Result**: All tasks sync with no duplicates or lost tasks

**Command**: Manual rapid-add test

---

### Test 6: Window Focus Refresh
**Goal**: Verify data refreshes when returning from another tab

**Steps**:
1. Open app on Desktop (Tab A)
2. Add task: "Test window focus"
3. View task appears
4. Open another tab (Tab B) and update Supabase directly with a meeting
5. Switch back to Tab A (app)
6. Verify meeting appears within 1 second of regaining focus

**Expected Result**: Data refreshes automatically on focus

**Command**: Manual test with browser developer tools to verify loadEntry/loadMeetings calls

---

### Test 7: Meeting Sync
**Goal**: Verify meetings sync the same as tasks

**Steps**:
1. Desktop: Add meeting "Test meeting" with notes "Conference call"
2. Mobile: Wait 5 seconds
3. Verify meeting appears on mobile
4. Mobile: Edit meeting to add Granola link
5. Desktop: Wait 5 seconds
6. Verify edit appears on desktop

**Expected Result**: Meetings sync bidirectionally

**Command**: Manual test

---

### Test 8: Polling Interval Verification
**Goal**: Verify polling is running every 5 seconds

**Steps**:
1. Open browser console (F12)
2. Open app
3. Filter console logs to see polling
4. Observe network requests to Supabase in Network tab
5. Count requests over 30 seconds
6. Should see ~6 polling requests (one per 5 seconds)

**Expected Result**: Regular polling every ~5 seconds

**Command**: Open DevTools, check network tab for `daily_entries` and `meetings` queries

---

## Regression Tests

### Test 9: Local Editing Still Works
**Goal**: Verify single-device editing unchanged

**Steps**:
1. Desktop only
2. Add/edit/delete tasks
3. Toggle habits
4. Edit observations
5. Save entry

**Expected Result**: All local operations work as before

**Command**: Manual single-device test

---

### Test 10: Auth State Changes
**Goal**: Verify logout/login handled properly

**Steps**:
1. Open app logged in
2. Log out via Supabase session
3. Verify redirected to login
4. Log in again
5. Verify data reloads properly

**Expected Result**: Logout clears state, login reloads data

**Command**: Manual test

---

## Performance Considerations

- Polling every 5 seconds is aggressive but ensures fast sync
- Can be tuned down to 10-15 seconds if server load becomes issue
- Focus refresh is instant and low-impact
- Auth listener is lightweight

---

## Debug Commands

```bash
# Build the app
npm run build

# Run dev server
npm run dev

# Check for TypeScript errors
npm run type-check

# Run tests
npm test
```

---

## Success Criteria

- [x] No build errors
- [ ] Test 1: Session persists (manual)
- [ ] Test 2: Desktop → Mobile sync works (manual)
- [ ] Test 3: Mobile → Desktop sync works (manual)
- [ ] Test 4: Cross-date sync works (manual)
- [ ] Test 5: Rapid additions don't collide (manual)
- [ ] Test 6: Window focus refresh works (manual)
- [ ] Test 7: Meetings sync works (manual)
- [ ] Test 8: Polling interval correct (DevTools)
- [ ] Test 9: Local editing still works (manual)
- [ ] Test 10: Auth state changes handled (manual)

All tests must pass for the fix to be considered complete.
