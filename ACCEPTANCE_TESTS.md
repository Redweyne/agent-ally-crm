# Enhanced CRM - Acceptance Tests

## Access
- Visit `/enhanced-crm` to see the new standalone CRM system
- All data is stored in localStorage (no backend required)

## Feature Tests

### ✅ 1. Ready-to-Sell Badge & Filter
**Test:** Look for green "Ready to Sell" badges on leads
**Criteria:** Lead must have: phone valid ✓, consent ✓, intention & timeline ✓, area ✓, budget > 0 ✓, ≥1 live touch ✓
**Acceptance:** 
- Badges appear on qualifying leads
- Filter dropdown shows "Ready to Sell" option
- Filtering works correctly

### ✅ 2. Hot Lead Flag & Sort
**Test:** Look for red "Hot" badges with star icon
**Criteria:** Score > 80 AND timeline < 3 months
**Acceptance:**
- Hot badges appear on qualifying leads
- Sort dropdown shows "Hot First" option
- Hot leads appear at top when sorted

### ✅ 3. Keyboard Outcomes & Auto Follow-ups
**Test:** Click on a lead to open details, press keys 1-7
**Outcomes:** 1=Interested, 2=Not interested, 3=Callback, 4=Voicemail, 5=Wrong number, 6=Appointment, 7=DNC
**Auto Follow-ups:** Callback=J+2 days, Others=J+1 day
**Acceptance:**
- Keyboard shortcuts work in lead drawer
- Follow-up dates auto-set and stored in localStorage
- "Due Today" filter shows leads with today's follow-up date

### ✅ 4. Quick Appointment Slots & ICS
**Test:** Click appointment buttons: "Today PM", "Tomorrow AM", "Tomorrow PM"
**Acceptance:**
- Buttons book appointments instantly
- .ics file downloads automatically
- Toast confirmation appears

### ✅ 5. Duplicate Merge Flow
**Test:** Click "Duplicates" button to see potential matches
**Detection:** Same phone OR (same name + same email)
**Acceptance:**
- Duplicates panel shows grouped potential matches
- "Merge into first" combines data (max touches, score, concatenated notes)
- Duplicates counter updates

### ✅ 6. Branded PDF Export
**Test:** Click PDF button on any lead card or in lead drawer
**Acceptance:**
- Opens print preview with branded header
- Shows all lead details formatted professionally
- Includes badges (Ready to Sell, Hot Lead)

### ✅ 7. Bad Number / DNC Toggles
**Test:** Toggle switches next to each lead name
**Acceptance:**
- Bad # and DNC switches disable Call/SMS buttons
- Toggles persist in localStorage
- Visual indication when actions are disabled

### ✅ 8. Expected € Chip & Live Updates
**Test:** Look for expected revenue amounts, edit fees percentage
**Calculation:** Budget × Fees% = Expected Revenue
**Acceptance:**
- Expected € shown on cards and in drawer
- Click fees% to edit inline
- Revenue updates instantly
- Status editing also works inline

### ✅ 9. Mobile Call Mode
**Test:** Click "Call Mode" on mobile or resize browser window
**Acceptance:**
- Large Call/SMS/Book buttons
- Quick outcome buttons (1-7)
- Lead selection interface
- Exit button returns to normal view

### ✅ 10. Export/Import JSON Backup
**Test:** Click Export button, then Import button with downloaded file
**Acceptance:**
- Export downloads complete JSON backup
- Import restores all leads and appointments
- Data persists across browser sessions

## Data Persistence Tests
- Refresh browser → all data retained
- Close/reopen browser → all data retained
- Edit lead → changes saved to localStorage
- Add appointment → stored in localStorage

## UI/UX Tests
- Responsive design works on mobile/desktop
- All buttons and interactions provide feedback
- Search and filtering work smoothly
- Keyboard shortcuts work as expected

## Navigation
- `/enhanced-crm` - Access the standalone CRM
- All features work without authentication
- No backend dependencies (pure localStorage)