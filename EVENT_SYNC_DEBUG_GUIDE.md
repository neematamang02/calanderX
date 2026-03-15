# CalendarX Event Sync Debug Guide 🔍

## 🚨 CRITICAL: Why Your Events Aren't Showing

Based on the backend code analysis, events won't show unless you follow this **exact sequence**:

### The Required Flow

```
1. Register/Login ✅
   ↓
2. Connect Google/Microsoft Calendar (OAuth) ✅
   ↓
3. **SYNC CALENDARS from connected account** ⚠️ CRITICAL
   ↓
4. **SYNC EVENTS for each calendar** ⚠️ CRITICAL
   ↓
5. Create Board ✅
   ↓
6. **ADD CALENDARS TO BOARD** ⚠️ MOST MISSED STEP
   ↓
7. View Board → Events Should Appear ✅
```

---

## 🔴 Common Mistakes (Why Events Don't Show)

### Mistake #1: Skipping Calendar Sync
**Problem:** OAuth connection doesn't automatically sync calendars to database

**Solution:**
```bash
# After OAuth, you MUST click "Sync" button on the account card
# Or use API directly:
POST http://localhost:3001/api/calendars/sync/account/{accountId}
```

### Mistake #2: Not Syncing Events
**Problem:** Calendars exist but events aren't fetched from Google/Microsoft

**Solution:**
```bash
# After syncing calendars, sync events for each calendar:
POST http://localhost:3001/api/calendars/sync/calendar/{calendarId}/events
```

### Mistake #3: Board Has No Calendars
**Problem:** Creating a board doesn't automatically add calendars to it

**Solution:**
- In BoardEdit page (`/boards/{boardId}/edit`)
- Click "Add Calendar" button
- Select calendar and color
- Save

**Or via API:**
```bash
POST http://localhost:3001/api/boards/{boardId}/calendars
{
  "calendarId": "your-calendar-id",
  "color": "#3B82F6"
}
```

### Mistake #4: Calendar is Inactive
**Problem:** Inactive calendars don't show events

**Solution:**
- Go to `/calendars` page
- Click "Enable" on each calendar you want to use

---

## 📋 Step-by-Step Setup (DO THIS FIRST)

### Step 1: Connect Calendar Account

1. Navigate to: `http://localhost:5173/calendars`
2. Click "Connect Google Calendar" or "Connect Microsoft Calendar"
3. Complete OAuth flow
4. You should see account in "Connected Accounts" section

**Verify:**
```bash
GET http://localhost:3001/api/oauth/accounts
Authorization: Bearer YOUR_TOKEN
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "account-uuid",
      "provider": "google",
      "email": "your@email.com",
      "displayName": "Your Name"
    }
  ]
}
```

---

### Step 2: Sync Calendars from Account

**IN THE FRONTEND:**
1. Find your connected account card on `/calendars` page
2. Click the "Sync" button (↻ icon)
3. Wait for toast notification: "Synced X calendars"

**VERIFY CALENDARS WERE SYNCED:**
```bash
GET http://localhost:3001/api/calendars
Authorization: Bearer YOUR_TOKEN
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "calendar-uuid",
      "name": "My Calendar",
      "isActive": true,
      "externalCalendarId": "primary",
      "defaultColor": "#3B82F6"
    }
  ],
  "pagination": { ... }
}
```

**IF NO CALENDARS:** The sync failed. Check backend logs.

---

### Step 3: Sync Events for Each Calendar

**OPTION A - Use Frontend "Sync All":**
1. Go to Dashboard (`/dashboard`)
2. Click "Sync All" button
3. Wait 10-30 seconds (depends on number of events)
4. Check toast notification for success

**OPTION B - Manual API Call:**
```bash
# Sync all user data (recommended)
POST http://localhost:3001/api/calendars/sync/all
Authorization: Bearer YOUR_TOKEN

# Or sync specific calendar
POST http://localhost:3001/api/calendars/sync/calendar/{calendarId}/events?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer YOUR_TOKEN
```

**VERIFY EVENTS WERE SYNCED:**
```bash
POST http://localhost:3001/api/calendars/events
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "calendarIds": ["your-calendar-id"]
}
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "title": "Meeting with Team",
      "startTime": "2025-01-15T10:00:00Z",
      "endTime": "2025-01-15T11:00:00Z",
      "calendarId": "calendar-uuid"
    }
  ]
}
```

**IF NO EVENTS:** 
- Check if you have events in Google Calendar for the date range
- Check backend logs for API errors
- Verify OAuth token hasn't expired

---

### Step 4: Create Board

1. Go to `/boards/new`
2. Fill in:
   - Name: "My Schedule"
   - Description: Optional
   - Privacy settings as desired
3. **DO NOT** select calendars here (it's just for display reference)
4. Click "Create Board"

**VERIFY BOARD CREATED:**
```bash
GET http://localhost:3001/api/boards
Authorization: Bearer YOUR_TOKEN
```

---

### Step 5: Add Calendars to Board (CRITICAL!)

**This is the most missed step!**

**METHOD 1 - Use BoardEdit Page (Easiest):**
1. Go to `/boards/{boardId}/edit`
2. Scroll to "Board Calendars" section
3. Click "Add Calendar" button
4. Select calendar from list
5. Choose color
6. Click "Add Calendar"
7. Repeat for each calendar you want
8. Click "Save Changes"

**METHOD 2 - API Call:**
```bash
POST http://localhost:3001/api/boards/{boardId}/calendars
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "calendarId": "your-calendar-id",
  "color": "#3B82F6"
}
```

**VERIFY CALENDARS ADDED TO BOARD:**
```bash
GET http://localhost:3001/api/boards/{boardId}
Authorization: Bearer YOUR_TOKEN
```

Expected response should include:
```json
{
  "success": true,
  "data": {
    "id": "board-id",
    "name": "My Schedule",
    "boardCalendars": [
      {
        "id": "board-calendar-id",
        "calendarId": "calendar-id",
        "color": "#3B82F6",
        "calendar": {
          "id": "calendar-id",
          "name": "My Calendar",
          "isActive": true
        }
      }
    ]
  }
}
```

**IF boardCalendars IS EMPTY:** You didn't add calendars to the board!

---

### Step 6: View Board Events

1. Go to `/boards/{boardId}`
2. You should see calendar with events
3. Use month navigation to browse

**VERIFY EVENTS API:**
```bash
GET http://localhost:3001/api/boards/{boardId}/events?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer YOUR_TOKEN
```

Expected response:
```json
{
  "success": true,
  "data": {
    "board": { ... },
    "events": [
      {
        "id": "event-id",
        "title": "Meeting",
        "startTime": "2025-01-15T10:00:00Z",
        "endTime": "2025-01-15T11:00:00Z",
        "calendarId": "calendar-id"
      }
    ],
    "totalEvents": 1
  }
}
```

---

## 🔧 Debugging Checklist

### Check 1: Auth Token Valid?
```bash
# Get user info
GET http://localhost:3001/api/oauth/accounts
Authorization: Bearer YOUR_TOKEN

# Should return 200, not 401
```

### Check 2: Connected Account Exists?
```javascript
// In browser console on /calendars page
localStorage.getItem('authToken')
// Should return a JWT token
```

### Check 3: Calendars Synced?
```bash
GET http://localhost:3001/api/calendars
Authorization: Bearer YOUR_TOKEN

# Should return array with calendars
# If empty array = calendars not synced
```

### Check 4: Events Synced?
```bash
# Replace with your actual calendar ID
POST http://localhost:3001/api/calendars/events
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "calendarIds": ["your-calendar-id-here"]
}

# Should return array with events
# If empty = events not synced OR no events in date range
```

### Check 5: Board Has Calendars?
```bash
GET http://localhost:3001/api/boards/{boardId}
Authorization: Bearer YOUR_TOKEN

# Check boardCalendars array
# Should NOT be empty
```

### Check 6: Calendar is Active?
```bash
GET http://localhost:3001/api/calendars
Authorization: Bearer YOUR_TOKEN

# Check isActive field for each calendar
# Should be true
```

---

## 🐛 Common API Errors

### Error: "Calendar not found"
**Cause:** Trying to add calendar to board before syncing calendars

**Fix:**
1. Go to `/calendars`
2. Click "Sync" on connected account
3. Wait for calendars to appear
4. Then add to board

### Error: "No events found"
**Cause:** Events not synced yet

**Fix:**
```bash
POST http://localhost:3001/api/calendars/sync/all
Authorization: Bearer YOUR_TOKEN
```

### Error: "Board not found"
**Cause:** Board doesn't exist or wrong ID

**Fix:**
```bash
# List all boards
GET http://localhost:3001/api/boards
Authorization: Bearer YOUR_TOKEN
```

### Error: "401 Unauthorized"
**Cause:** Auth token expired or invalid

**Fix:**
1. Logout
2. Login again
3. Retry operation

---

## 🔍 Frontend Debug Console Commands

Open browser console on any page and run:

```javascript
// Check auth status
console.log('Token:', localStorage.getItem('authToken'));
console.log('User:', localStorage.getItem('user'));

// Check if on BoardView page
// Get board data from React Query cache
window.reactQueryDevtools?.queries?.find(q => q.queryKey.includes('board'));
```

---

## 📊 Database Check (Backend)

If you have access to the database:

```sql
-- Check if calendars exist
SELECT id, name, "externalCalendarId", "isActive" 
FROM "Calendar" 
WHERE "connectedAccountId" IN (
  SELECT id FROM "ConnectedAccount" WHERE "userId" = 'your-user-id'
);

-- Check if events exist
SELECT COUNT(*) as event_count, "calendarId"
FROM "Event"
WHERE "calendarId" IN (
  SELECT id FROM "Calendar" WHERE "connectedAccountId" IN (
    SELECT id FROM "ConnectedAccount" WHERE "userId" = 'your-user-id'
  )
)
GROUP BY "calendarId";

-- Check if board has calendars
SELECT bc.id, bc."boardId", bc."calendarId", bc.color, c.name as calendar_name
FROM "BoardCalendar" bc
JOIN "Calendar" c ON bc."calendarId" = c.id
WHERE bc."boardId" = 'your-board-id';
```

---

## 🚀 Quick Test Script

Use this curl script to test the entire flow:

```bash
#!/bin/bash

# Set your token
TOKEN="your-auth-token-here"
BASE_URL="http://localhost:3001/api"

echo "1. Get connected accounts..."
curl -X GET "$BASE_URL/oauth/accounts" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n2. Get calendars..."
curl -X GET "$BASE_URL/calendars" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n3. Sync all data..."
curl -X POST "$BASE_URL/calendars/sync/all" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n4. Get boards..."
BOARD_ID=$(curl -s -X GET "$BASE_URL/boards" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

echo "Board ID: $BOARD_ID"

echo -e "\n\n5. Get board events..."
curl -X GET "$BASE_URL/boards/$BOARD_ID/events?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 COMPLETE WORKFLOW TEST

Follow this EXACTLY to verify everything works:

### Phase 1: Setup (5 minutes)
1. ✅ Start backend: `cd Backend && npm run dev`
2. ✅ Start frontend: `cd Frontend/calanderX && npm run dev`
3. ✅ Register new user at `/register`
4. ✅ Login at `/login`

### Phase 2: Calendar Connection (3 minutes)
5. ✅ Go to `/calendars`
6. ✅ Click "Connect Google Calendar"
7. ✅ Complete OAuth
8. ✅ See account in "Connected Accounts" list

### Phase 3: Data Sync (2 minutes)
9. ✅ Click "Sync" button on account card
10. ✅ Wait for "Synced X calendars" toast
11. ✅ See calendars appear in "Your Calendars" section
12. ✅ Verify calendars show "Active" badge

### Phase 4: Event Sync (2 minutes)
13. ✅ Go to `/dashboard`
14. ✅ Click "Sync All" button
15. ✅ Wait for "Synced X calendars and Y events" toast
16. ✅ This may take 10-30 seconds depending on event count

### Phase 5: Board Creation (1 minute)
17. ✅ Go to `/boards/new`
18. ✅ Enter name: "Test Board"
19. ✅ Leave all checkboxes unchecked for now
20. ✅ Click "Create Board"
21. ✅ Note the board ID from URL

### Phase 6: Add Calendars to Board (2 minutes)
22. ✅ Click "Edit" button OR go to `/boards/{boardId}/edit`
23. ✅ Scroll to "Board Calendars" section
24. ✅ Click "Add Calendar" button
25. ✅ Select your Google Calendar
26. ✅ Choose a color (default blue is fine)
27. ✅ Click "Add Calendar"
28. ✅ See calendar appear in the list
29. ✅ Click "Save Changes"

### Phase 7: View Events (1 minute)
30. ✅ Click "Back to Board" or go to `/boards/{boardId}`
31. ✅ You should see:
    - Calendar grid for current month
    - Events displayed in their date cells
    - Color-coded by calendar
    - Event titles (or "Busy" if masked)

### Phase 8: Verify Filtering (30 seconds)
32. ✅ In left sidebar, click calendar name
33. ✅ Calendar grid updates to show only that calendar's events
34. ✅ Click "All Calendars" to show all events again

---

## ❌ If Events Still Don't Show

### Last Resort Debugging:

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Navigate to board view page**
4. **Look for request to:** `/api/boards/{boardId}/events`
5. **Click on that request**
6. **Check Response:**

**Good Response:**
```json
{
  "success": true,
  "data": {
    "board": { ... },
    "events": [ { "id": "...", "title": "..." } ],
    "totalEvents": 5
  }
}
```

**Bad Response (Empty Events):**
```json
{
  "success": true,
  "data": {
    "board": { ... },
    "events": [],
    "totalEvents": 0
  }
}
```

**If Empty:**
- Check `board.boardCalendars` array in response
- If empty → You didn't add calendars to board (go to Step 22)
- If has calendars → Events not synced (go to Step 13)

---

## 🔑 Key Endpoints Reference

| Action | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| Get Calendars | GET | `/api/calendars` | List synced calendars |
| Sync Account Calendars | POST | `/api/calendars/sync/account/{accountId}` | Fetch calendars from Google/MS |
| Sync Calendar Events | POST | `/api/calendars/sync/calendar/{calendarId}/events` | Fetch events for calendar |
| Sync All | POST | `/api/calendars/sync/all` | Sync everything |
| Get Board Events | GET | `/api/boards/{boardId}/events` | Get filtered events for board |
| Add Calendar to Board | POST | `/api/boards/{boardId}/calendars` | Add calendar to board |

---

## 💡 Pro Tips

1. **Always sync after OAuth** - Connection doesn't mean data is synced
2. **Use "Sync All" button** - Easiest way to ensure everything is synced
3. **Check calendar active status** - Inactive calendars won't show events
4. **Add calendars in BoardEdit** - Don't skip this step!
5. **Wait for sync to complete** - Don't navigate away during sync
6. **Check date range** - Events outside board's date range won't show

---

## 📞 Still Having Issues?

Check these in order:

1. ✅ Backend running on port 3001?
2. ✅ Frontend running on port 5173?
3. ✅ OAuth credentials configured in backend?
4. ✅ Database migrations run?
5. ✅ No errors in backend console?
6. ✅ No errors in browser console?
7. ✅ Auth token valid (not expired)?
8. ✅ Followed ALL steps above?

**If yes to all above and still not working:**
- Check backend logs during sync
- Check database directly (SQL queries above)
- Verify OAuth token hasn't expired (disconnect and reconnect)
- Try with a fresh user account

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Complete Setup Guide