# CalendarX Frontend Testing Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Backend server running on `http://localhost:3001`
- Test user accounts or registration enabled

### Setup
```bash
cd Frontend/calanderX
npm install
npm run dev
```

The app should be available at `http://localhost:5173`

---

## 🧪 Testing Checklist

### 1. Authentication Flow

#### Test: User Registration
**Steps:**
1. Navigate to `/register`
2. Fill in the form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Create account"

**Expected Result:**
- ✅ User is created
- ✅ Redirected to `/dashboard`
- ✅ Toast notification shows success
- ✅ User name appears in navbar

**Common Issues:**
- Email already exists → Shows error message
- Password mismatch → Validation error
- Weak password → Backend validation error

---

#### Test: User Login
**Steps:**
1. Navigate to `/login`
2. Enter credentials
3. Click "Sign in"

**Expected Result:**
- ✅ Redirected to `/dashboard`
- ✅ Auth token stored in localStorage
- ✅ Protected routes accessible

**Common Issues:**
- Invalid credentials → Error message displayed
- Backend not running → Network error

---

#### Test: Protected Routes
**Steps:**
1. Log out (or clear localStorage)
2. Try to access `/dashboard`, `/boards`, `/calendars`

**Expected Result:**
- ✅ Redirected to `/login`
- ✅ Return URL preserved (redirects back after login)

---

### 2. Dashboard Page

#### Test: Dashboard Stats
**Steps:**
1. Log in
2. Observe dashboard cards

**Expected Result:**
- ✅ Shows connected accounts count
- ✅ Shows calendar boards count
- ✅ Shows shared links count
- ✅ Sync All button visible

**Test Data Required:**
- At least 1 connected account
- At least 1 board created

---

#### Test: Quick Actions
**Steps:**
1. Click each quick action card
2. Verify navigation

**Expected Links:**
- "Manage Calendars" → `/calendars`
- "Create Board" → `/boards/new`
- "Shared Links" → `/shared`
- "Settings" → `/settings` (may show 404 if not created)

---

### 3. Calendar Management

#### Test: Connect Google Calendar
**Steps:**
1. Navigate to `/calendars`
2. Click "Connect Google Calendar"

**Expected Result:**
- ✅ OAuth URL generated
- ✅ Redirected to Google OAuth consent screen
- ✅ After authorization, redirected back to app
- ✅ Account appears in connected accounts list

**Required:**
- Backend OAuth configured with valid Google credentials
- Redirect URI whitelisted: `http://localhost:3001/api/oauth/callback/google`

---

#### Test: Connect Microsoft Calendar
**Steps:**
1. Navigate to `/calendars`
2. Click "Connect Microsoft Calendar"

**Expected Result:**
- ✅ OAuth URL generated
- ✅ Redirected to Microsoft OAuth consent screen
- ✅ After authorization, account appears in list

---

#### Test: Sync Account Calendars
**Steps:**
1. In connected account card, click "Sync" button
2. Wait for sync to complete

**Expected Result:**
- ✅ Loading spinner shows
- ✅ Toast notification: "Synced X calendars"
- ✅ Calendars appear in "Your Calendars" section
- ✅ Each calendar shows:
  - Calendar name
  - Color indicator
  - Active/Inactive badge
  - Enable/Disable button

---

#### Test: Toggle Calendar Status
**Steps:**
1. Find a calendar in the list
2. Click "Enable" or "Disable" button

**Expected Result:**
- ✅ Badge updates (Active ↔ Inactive)
- ✅ Toast notification shows success
- ✅ Button text toggles

---

#### Test: Disconnect Account
**Steps:**
1. Click settings icon on account card
2. Confirm deletion in modal

**Expected Result:**
- ✅ Modal appears with warning
- ✅ Account removed from list
- ✅ Associated calendars removed
- ✅ Toast notification confirms deletion

---

### 4. Board Management

#### Test: Create New Board
**Steps:**
1. Navigate to `/boards/new`
2. Fill in form:
   - Name: "My Work Schedule"
   - Description: "Work meetings and events"
   - Privacy Settings:
     - ☑ Mask events
     - Mask Label: "Busy"
   - Date Range:
     - ☑ Show past events
     - Future Days Limit: 30
3. Select calendars to include
4. Choose colors for each calendar
5. Click "Create Board"

**Expected Result:**
- ✅ Board created successfully
- ✅ Redirected to board view page
- ✅ Toast notification shows success
- ✅ Selected calendars appear in board

**Edge Cases:**
- No calendars available → Shows message
- No calendars selected → Should still allow creation
- Name too short → Validation error

---

#### Test: View All Boards
**Steps:**
1. Navigate to `/boards`
2. Observe board cards

**Expected Result:**
- ✅ All user boards displayed in grid
- ✅ Each board shows:
  - Name and description
  - Calendar count
  - Creation date
  - Settings badges (masked, current week only, etc.)
  - Calendar preview with colors
  - Action buttons (View, Edit, Share, Delete)

---

#### Test: Delete Board
**Steps:**
1. Click trash icon on board card
2. Confirm in modal

**Expected Result:**
- ✅ Confirmation modal appears
- ✅ Warning about shared links
- ✅ Board removed from list
- ✅ Toast notification confirms deletion

---

### 5. Board View (Calendar UI) ⭐ NEW

#### Test: Month View Calendar
**Steps:**
1. Click "View" on any board
2. Observe calendar display

**Expected Result:**
- ✅ Calendar grid shows current month
- ✅ Days of week header (Sun-Sat)
- ✅ Current day highlighted with blue ring
- ✅ Events displayed in each day cell
- ✅ Events color-coded by calendar
- ✅ Event titles shown (or masked if privacy enabled)
- ✅ "X more" indicator if > 3 events in a day

---

#### Test: Calendar Navigation
**Steps:**
1. Click "←" (previous month)
2. Observe month changes to previous
3. Click "→" (next month)
4. Observe month changes to next
5. Click "Today"

**Expected Result:**
- ✅ Calendar updates to show correct month
- ✅ Events loaded for new month range
- ✅ Month/year title updates
- ✅ "Today" button resets to current month

---

#### Test: Calendar Filtering
**Steps:**
1. In left sidebar, click "All Calendars"
2. Observe all events shown
3. Click specific calendar filter
4. Observe only that calendar's events shown

**Expected Result:**
- ✅ Selected filter highlighted in blue
- ✅ Event count updates for each filter
- ✅ Calendar grid updates to show filtered events
- ✅ List view also respects filter

---

#### Test: View Mode Toggle
**Steps:**
1. Click grid icon (month view)
2. Click list icon (list view)

**Expected Result:**
- ✅ Month view: Shows calendar grid
- ✅ List view: Shows vertical list of events with full details
- ✅ Active mode highlighted
- ✅ Both views respect calendar filter

---

#### Test: Event Detail Modal
**Steps:**
1. Click on an event in calendar
2. Modal opens with event details

**Expected Result:**
- ✅ Modal displays event information:
  - Title (or mask label if masked)
  - Date and time
  - Location (if not masked)
  - Description (if not masked)
  - Calendar name with color
  - Status badge
  - External link (if available)
- ✅ Privacy settings respected
- ✅ Close button works
- ✅ ESC key closes modal
- ✅ Click outside closes modal

---

#### Test: Privacy Masking
**Steps:**
1. View a board with "Mask Events" enabled
2. Check event display

**Expected Result:**
- ✅ Event titles show mask label (e.g., "Busy")
- ✅ No descriptions visible
- ✅ No locations visible
- ✅ Time blocks still visible
- ✅ Colors still differentiate calendars

---

### 6. Share Functionality ⭐ NEW

#### Test: Create Share Link
**Steps:**
1. In board view, click "Share" button
2. Modal opens with share link

**Expected Result:**
- ✅ Share URL generated
- ✅ Format: `http://localhost:5173/shared/{token}`
- ✅ Copy button available
- ✅ Privacy notice if events masked
- ✅ View count displayed
- ✅ Link marked as active

---

#### Test: Copy Share Link
**Steps:**
1. In share modal, click "Copy" button

**Expected Result:**
- ✅ Toast notification: "Share link copied to clipboard!"
- ✅ Link copied to system clipboard
- ✅ Can paste link elsewhere

---

### 7. Public Board View ⭐ NEW

#### Test: Access Public Board (Valid Token)
**Steps:**
1. Copy a valid share link
2. Open in incognito/private browser window
3. Paste URL and navigate

**Expected Result:**
- ✅ Public board page loads without login
- ✅ Board name and description shown
- ✅ "Public View" badge visible
- ✅ Calendar display works
- ✅ Events visible (masked if privacy enabled)
- ✅ Calendar filters work
- ✅ Month navigation works
- ✅ Event details modal works
- ✅ No edit/delete buttons (read-only)
- ✅ CalendarX branding in footer

---

#### Test: Access Public Board (Invalid Token)
**Steps:**
1. Navigate to `/shared/invalid-token-12345`

**Expected Result:**
- ✅ Error page displayed
- ✅ Shield icon with error message
- ✅ "Unable to Load Calendar" heading
- ✅ Explanation of issue
- ✅ Link to go to CalendarX homepage

---

#### Test: View Count Tracking
**Steps:**
1. Access public board multiple times
2. Check view count in shared links management

**Expected Result:**
- ✅ View count increments
- ✅ Displayed in shared links page

---

### 8. Shared Links Management ⭐ NEW

#### Test: View All Shared Links
**Steps:**
1. Navigate to `/shared`
2. Observe shared links list

**Expected Result:**
- ✅ All shared boards displayed
- ✅ Stats cards show:
  - Total shared links
  - Active links count
  - Total views across all
- ✅ Each link shows:
  - Board name
  - Active/Inactive status badge
  - Share URL
  - Copy, Open, Toggle, Regenerate, Delete buttons
  - Analytics (views, created date, last updated)

---

#### Test: Toggle Link Active/Inactive
**Steps:**
1. Click eye icon to disable link
2. Try accessing public URL
3. Click eye icon again to enable

**Expected Result:**
- ✅ Badge changes: Active ↔ Inactive
- ✅ Toast notification confirms
- ✅ When inactive: Public access denied
- ✅ When active: Public access works

---

#### Test: Regenerate Token
**Steps:**
1. Note current share URL
2. Click refresh icon
3. Confirm in modal

**Expected Result:**
- ✅ Warning modal appears
- ✅ New token generated
- ✅ Share URL changes
- ✅ Old URL no longer works
- ✅ New URL works
- ✅ Toast notification confirms

---

#### Test: Delete Shared Link
**Steps:**
1. Click trash icon
2. Confirm deletion

**Expected Result:**
- ✅ Confirmation modal with warning
- ✅ Link removed from list
- ✅ Public access no longer works
- ✅ Toast notification confirms

---

#### Test: Open Shared Board in New Tab
**Steps:**
1. Click external link icon

**Expected Result:**
- ✅ Public board opens in new tab
- ✅ Same browser session (logged in user can see their own board publicly)

---

### 9. Error Handling

#### Test: Network Errors
**Steps:**
1. Stop backend server
2. Try any action (create board, sync calendars, etc.)

**Expected Result:**
- ✅ Toast error notification
- ✅ Graceful error message
- ✅ No app crash
- ✅ Loading state ends

---

#### Test: 401 Unauthorized
**Steps:**
1. Delete auth token from localStorage
2. Try accessing protected resource

**Expected Result:**
- ✅ Redirected to login page
- ✅ Token and user cleared from storage
- ✅ Return URL preserved

---

#### Test: Invalid Form Inputs
**Steps:**
1. Try submitting forms with:
   - Empty required fields
   - Invalid email format
   - Short password
   - Mismatched passwords

**Expected Result:**
- ✅ Validation errors shown inline
- ✅ Submit button disabled or prevented
- ✅ Error messages clear and helpful

---

## 🔄 Complete User Workflows

### Workflow 1: First Time User Setup
1. ✅ Register account
2. ✅ Connect Google/Microsoft calendar
3. ✅ Sync calendars
4. ✅ Create first board
5. ✅ Share board
6. ✅ Access public link

**Expected Duration:** 3-5 minutes

---

### Workflow 2: Daily Board Viewing
1. ✅ Login
2. ✅ Navigate to boards
3. ✅ View board calendar
4. ✅ Filter by specific calendar
5. ✅ Check event details
6. ✅ Navigate through months

**Expected Duration:** 1-2 minutes

---

### Workflow 3: Share Link Management
1. ✅ View shared links
2. ✅ Check analytics
3. ✅ Copy share URL
4. ✅ Toggle link on/off
5. ✅ Regenerate token for security

**Expected Duration:** 2-3 minutes

---

## 🐛 Known Issues & Workarounds

### Issue 1: OAuth Redirect
**Problem:** OAuth sometimes fails on localhost  
**Workaround:** Ensure redirect URI matches exactly in OAuth provider settings

### Issue 2: Date Timezone
**Problem:** Events might show in UTC instead of local time  
**Workaround:** Backend should handle timezone conversion

### Issue 3: Mobile Calendar View
**Problem:** Calendar grid may be cramped on small screens  
**Workaround:** Use list view on mobile devices

---

## 📊 Test Data Recommendations

### Minimum Test Data
- 1 user account
- 1 connected calendar account
- 5-10 events spread across current month
- 2-3 boards with different settings

### Comprehensive Test Data
- 2+ user accounts
- Google AND Microsoft accounts
- 20+ events across multiple months
- Multiple calendars per account
- 5+ boards with varied privacy settings
- Active and inactive shared links

---

## 🔍 Browser Testing

### Recommended Browsers
- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)

### Features to Test Per Browser
- OAuth flow
- Clipboard API (copy share links)
- Date/time formatting
- Modal interactions
- Responsive design

---

## 📱 Device Testing

### Desktop
- ✅ 1920x1080 (Standard)
- ✅ 1366x768 (Smaller laptop)

### Tablet
- ⚠️ iPad (Needs testing)
- ⚠️ Android tablet (Needs testing)

### Mobile
- ⚠️ iPhone (Needs testing)
- ⚠️ Android phone (Needs testing)

---

## 🚨 Critical Issues to Report

If you encounter:
- App crashes or white screen
- Auth token not persisting
- OAuth redirects to 404
- Events not loading
- Share links not working
- Calendar navigation broken

**Report with:**
1. Steps to reproduce
2. Browser console errors
3. Network tab (failed requests)
4. Expected vs actual behavior

---

## ✅ Final Acceptance Criteria

### Must Pass
- ✅ User can register and login
- ✅ OAuth connection works for Google/Microsoft
- ✅ Calendars sync successfully
- ✅ Boards can be created and viewed
- ✅ **Calendar UI displays events correctly**
- ✅ **Public shared boards are accessible**
- ✅ **Share links can be managed**
- ✅ Privacy masking works
- ✅ No console errors in happy path

### Nice to Have
- Week view calendar
- Export functionality
- Advanced filtering
- Mobile optimization
- Offline support

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Check network tab for failed API calls
4. Review this testing guide
5. Report bugs with reproduction steps

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Ready for Testing