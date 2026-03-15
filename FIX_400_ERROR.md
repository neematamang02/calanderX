# Fix 400 Bad Request Error - CalendarX

## 🚨 Error Description

**Error Message:**
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
http://localhost:3001/api/boards/{boardId}/events?startDate=2026-03-01&endDate=2026-03-31
```

**What This Means:**
The backend is rejecting the date format being sent by the frontend. The API expects dates in ISO 8601 datetime format, but was receiving date-only format.

---

## ✅ **THIS HAS BEEN FIXED!**

The issue has been resolved in the latest code changes. The frontend now sends dates in the correct ISO format.

### What Was Changed:

**Before (Incorrect):**
```typescript
// In BoardView.tsx and PublicBoard.tsx
startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd')
// Output: "2025-01-01"
```

**After (Correct):**
```typescript
startDate: startOfMonth(currentDate).toISOString()
// Output: "2025-01-01T00:00:00.000Z"
```

---

## 🔍 How to Verify the Fix

### Step 1: Clear Browser Cache
```bash
# In browser, press:
Ctrl + Shift + Delete (Windows/Linux)
Cmd + Shift + Delete (Mac)

# Or hard reload:
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Step 2: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to a board view page
4. Look for the request to `/api/boards/{boardId}/events`
5. Check the Query String Parameters

**Should Look Like:**
```
startDate: 2025-01-01T00:00:00.000Z
endDate: 2025-01-31T23:59:59.999Z
```

**Should NOT Look Like:**
```
startDate: 2026-03-01
endDate: 2026-03-31
```

### Step 3: Check Response
- If fixed: Status 200, response contains `{"success": true, "data": {...}}`
- If still broken: Status 400, response contains error message

---

## 🐛 If You're Still Getting 400 Errors

### Check 1: Are You on the Latest Code?
```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies
cd Frontend/calanderX
npm install

# Restart dev server
npm run dev
```

### Check 2: Check Backend Validation Schema

The backend expects this format:

```typescript
// From Backend/src/types/validation.ts
export const EventSyncRequestSchema = z.object({
  startDate: z.string().datetime().optional(),  // ← Must be datetime!
  endDate: z.string().datetime().optional(),
});
```

**Valid formats:**
- `2025-01-15T10:00:00Z` ✅
- `2025-01-15T10:00:00.000Z` ✅
- `2025-01-15T10:00:00+00:00` ✅

**Invalid formats:**
- `2025-01-15` ❌ (date only)
- `2026-03-01` ❌ (date only)
- `01/15/2025` ❌ (wrong format)

### Check 3: Verify Date is Not in Future

**Notice in your error:** `startDate=2026-03-01`

This is March 2026, which is in the future! This could happen if:
1. Your system clock is wrong
2. There's a date calculation bug
3. You manually navigated to a future date

**To fix:**
1. Go to board view
2. Click "Today" button
3. Check current month
4. Should be January 2025 (or whenever you're testing)

---

## 🔧 Manual Fix (If Needed)

If the automatic fix didn't work, manually update these files:

### File 1: `Frontend/calanderX/src/pages/BoardView.tsx`

Find line ~45:
```typescript
const { data: eventsResponse, isLoading: eventsLoading } = useBoardEvents(
  boardId || '',
  {
    startDate: startOfMonth(currentDate).toISOString(),  // ← Use .toISOString()
    endDate: endOfMonth(currentDate).toISOString(),      // ← Use .toISOString()
  }
);
```

### File 2: `Frontend/calanderX/src/pages/PublicBoard.tsx`

Find line ~50:
```typescript
const { data: publicBoardResponse, isLoading, isError } = usePublicBoard(
  token || '',
  {
    startDate: startOfMonth(currentDate).toISOString(),  // ← Use .toISOString()
    endDate: endOfMonth(currentDate).toISOString(),      // ← Use .toISOString()
  }
);
```

---

## 📊 Testing the Fix

### Test Case 1: View Board
```
1. Navigate to any board
2. Should see calendar grid
3. No 400 errors in console
4. Events should load
```

### Test Case 2: Navigate Months
```
1. Click ← (previous month)
2. Calendar updates
3. No 400 errors
4. Events load for new month
```

### Test Case 3: Public Board
```
1. Get share link from board
2. Open in incognito
3. Calendar loads
4. No 400 errors
```

---

## 🎯 Root Cause Analysis

### Why This Happened

1. **Backend Validation Changed:**
   - Backend uses Zod validation
   - Expects `z.string().datetime()`
   - This requires ISO 8601 datetime format

2. **Frontend Used Date-Only:**
   - Used `format(date, 'yyyy-MM-dd')`
   - Produces "2025-01-01" format
   - Valid date but not datetime

3. **Validation Failed:**
   - Backend rejected as invalid datetime
   - Returns 400 Bad Request
   - Frontend shows error

### Why Date Was 2026

The error showed `2026-03-01`, which is strange. This could be:

1. **System Clock Issue:**
   - Computer clock set to future
   - JavaScript `new Date()` returns future date

2. **Browser Cache:**
   - Cached state from previous session
   - Persisted wrong date

3. **Manual Navigation:**
   - User clicked "Next Month" many times
   - Navigated into 2026

**Solution:** Click "Today" button to reset to current date.

---

## 🚀 Prevention

To prevent this error in the future:

### 1. Always Use ISO Format for API Dates
```typescript
// Good
const dateParam = new Date().toISOString();

// Also Good
const dateParam = startOfMonth(new Date()).toISOString();

// Bad
const dateParam = format(new Date(), 'yyyy-MM-dd');
```

### 2. Type Safety
```typescript
// Create a type for date params
type ISODateString = string; // Could use branded types

interface DateRangeParams {
  startDate: ISODateString;
  endDate: ISODateString;
}
```

### 3. Backend Validation Messages
The backend could return more helpful errors:
```typescript
// Instead of generic 400
// Return specific validation error
{
  "success": false,
  "error": "Invalid date format. Expected ISO 8601 datetime (e.g., 2025-01-01T00:00:00Z)"
}
```

---

## 📞 Still Need Help?

### Quick Diagnostic Commands

**Check current date state:**
```javascript
// In browser console
console.log('Current Date:', new Date().toISOString());
console.log('Start of Month:', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
```

**Test API directly:**
```bash
# Replace YOUR_TOKEN and BOARD_ID
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/boards/BOARD_ID/events?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "board": {...},
    "events": [...],
    "totalEvents": 5
  }
}
```

### Use Diagnostic Page

Navigate to `/diagnostic` in the app to run automated checks:
```
http://localhost:5173/diagnostic
```

This will:
- Check all system components
- Show detailed error messages
- Provide action buttons to fix issues

---

## ✅ Checklist

Before continuing, verify:

- [ ] Code is up to date (latest pull)
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] System clock is correct (not set to 2026!)
- [ ] Network tab shows ISO datetime format
- [ ] No 400 errors in console
- [ ] Events load successfully
- [ ] Calendar navigation works
- [ ] Today button resets to current month

---

## 🎉 Success Indicators

You'll know it's fixed when:

1. ✅ No 400 errors in browser console
2. ✅ Network tab shows 200 OK responses
3. ✅ Events appear in calendar grid
4. ✅ Month navigation works smoothly
5. ✅ Date parameters show ISO format (2025-01-01T00:00:00Z)

---

**Last Updated:** January 2025  
**Issue Status:** 🟢 RESOLVED  
**Fix Version:** Latest commit

**If this guide helped, you're all set! If you're still seeing 400 errors, check the diagnostic page at `/diagnostic`.**