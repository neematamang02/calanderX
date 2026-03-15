# ✅ CalendarX Quick Start Checklist

**Goal:** Get your calendar events showing in 10 minutes!

---

## 🚀 Step-by-Step Setup

### Phase 1: Start Application (2 min)
- [ ] Open terminal 1: `cd Backend && npm run dev`
- [ ] Open terminal 2: `cd Frontend/calanderX && npm run dev`
- [ ] Backend running on: `http://localhost:3001` ✓
- [ ] Frontend running on: `http://localhost:5173` ✓

---

### Phase 2: Create Account (1 min)
- [ ] Navigate to `http://localhost:5173/register`
- [ ] Fill in: Name, Email, Password
- [ ] Click "Create account"
- [ ] Should redirect to Dashboard ✓

---

### Phase 3: Connect Calendar (2 min)
- [ ] Click "Calendars" in navigation bar
- [ ] Click "Connect Google Calendar" button
- [ ] Complete Google OAuth authorization
- [ ] Wait for redirect back to app
- [ ] See account in "Connected Accounts" section ✓

---

### Phase 4: Sync Calendars (1 min) ⚠️ CRITICAL
- [ ] Find your connected account card
- [ ] Click the "Sync" button (↻ refresh icon)
- [ ] Wait for toast: "Synced X calendars"
- [ ] See calendars appear in "Your Calendars" section ✓
- [ ] Verify calendars show "Active" badge ✓

**🚨 STOP: If no calendars appear, check backend logs for errors**

---

### Phase 5: Sync Events (2 min) ⚠️ CRITICAL
- [ ] Click "Dashboard" in navigation
- [ ] Click "Sync All" button at top right
- [ ] **WAIT 10-30 seconds** (be patient!)
- [ ] Toast should say: "Synced X calendars and Y events"

**🚨 STOP: If "Synced 0 events", create test events in Google Calendar first**

---

### Phase 6: Create Board (1 min)
- [ ] Click "Boards" in navigation
- [ ] Click "New Board" button
- [ ] Enter board name: "My Test Board"
- [ ] Leave all checkboxes default for now
- [ ] Click "Create Board"
- [ ] You'll see the board view page

---

### Phase 7: Add Calendars to Board (2 min) 🔴 MOST CRITICAL STEP
**This is the step everyone misses!**

- [ ] Click "Edit" button at top of board view
- [ ] Scroll to "Board Calendars" section
- [ ] Click "Add Calendar" button
- [ ] Select your Google Calendar from the list
- [ ] Choose a color (blue is fine)
- [ ] Click "Add Calendar" button in modal
- [ ] See calendar appear in the list ✓
- [ ] Click "Save Changes" button
- [ ] Click "Back to Board" button

---

### Phase 8: See Your Events! (1 min) 🎉
- [ ] You should now see the calendar grid
- [ ] Events displayed in their date cells ✓
- [ ] Click ← → to navigate months
- [ ] Click an event to see details
- [ ] Filter by calendar using left sidebar

**🎉 SUCCESS: If you see events, you're done!**

---

## ❌ Troubleshooting

### No Events Showing?

**Check 1:** Did you add calendars to the board?
- Go to BoardEdit → "Board Calendars" section
- Should NOT be empty

**Check 2:** Are calendars synced?
```bash
# In browser console:
fetch('http://localhost:3001/api/calendars', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
}).then(r => r.json()).then(console.log)
```
Should return array of calendars, not empty array.

**Check 3:** Are events synced?
- Go to Dashboard → Click "Sync All" again
- Wait for completion

**Check 4:** Do events exist in Google Calendar?
- Open Google Calendar in another tab
- Verify you have events for current month

**Check 5:** Is calendar active?
- Go to Calendars page
- Each calendar should show "Active" badge
- If "Inactive", click "Enable" button

---

## 🎯 Quick Verification Commands

Open browser console (F12) and run:

```javascript
// Check auth token exists
console.log('Token:', localStorage.getItem('authToken'));

// Check user logged in
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

---

## 📋 API Verification (Using curl or Postman)

Replace `YOUR_TOKEN` with your auth token from localStorage:

```bash
# 1. Get calendars
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/calendars

# 2. Get boards
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/boards

# 3. Get board events (replace BOARD_ID)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/boards/BOARD_ID/events?startDate=2025-01-01&endDate=2025-01-31"
```

---

## 🚨 Common Mistakes

1. ❌ **Skipping "Sync" button** after OAuth
   - ✅ Always click Sync on account card

2. ❌ **Not syncing events** with "Sync All"
   - ✅ Click Sync All on Dashboard and WAIT

3. ❌ **Forgetting to add calendars to board**
   - ✅ Use BoardEdit → Add Calendar

4. ❌ **Calendar is inactive**
   - ✅ Check "Active" badge on Calendars page

5. ❌ **No events in Google Calendar**
   - ✅ Create test events first

---

## ✅ Success Checklist

You should have:
- [x] Backend running (port 3001)
- [x] Frontend running (port 5173)
- [x] User account created
- [x] Google Calendar connected
- [x] Calendars synced (appeared in list)
- [x] Events synced (toast confirmed)
- [x] Board created
- [x] **Calendars added to board** ← Most important!
- [x] Events visible in calendar UI

---

## 📚 Need More Help?

Read these documents in order:

1. **EVENT_SYNC_DEBUG_GUIDE.md** - Detailed troubleshooting
2. **TESTING_GUIDE.md** - Complete testing procedures
3. **FINAL_SUMMARY.md** - Overall application overview

---

## 🎉 Next Steps After Setup

Once events are showing:

- [ ] Try month navigation (← → buttons)
- [ ] Filter by calendar (left sidebar)
- [ ] Switch to List view (view toggle)
- [ ] Click event for details
- [ ] Edit board (change colors)
- [ ] Share board (Share button)
- [ ] Open share link in incognito
- [ ] Manage shares (Shared Links page)

---

**Total Time: ~10 minutes**  
**Difficulty: Easy** (if you follow each step!)  
**Most Common Issue:** Forgetting Step 7 (Add Calendars to Board)

---

Print this checklist and check off each item as you complete it! ✓