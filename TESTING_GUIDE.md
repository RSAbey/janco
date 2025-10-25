# Testing Guide - Finance Report Download Fix

## Prerequisites
- ✅ Backend server running on port 5000
- ✅ Frontend application running on port 3000
- ✅ User logged in to the system

## Test Steps

### Test 1: Basic Report Download (Income Only)
1. Navigate to Finance Section
2. Click "Download Report" button
3. In the modal:
   - Check "Income" checkbox
   - Select "Last 30 Days" from Duration dropdown
4. Click "Download" button
5. **Expected Result**: 
   - PDF file downloads automatically
   - File name: `expense-report-[timestamp].pdf`
   - You remain logged in (no logout)
   - Modal closes automatically

### Test 2: Full Report (Income + Expenses)
1. Click "Download Report" button
2. In the modal:
   - Check both "Income" AND "Expense" checkboxes
   - Select "This Year" from Duration dropdown
3. Click "Download" button
4. **Expected Result**: 
   - PDF downloads with both income and expense data
   - Summary shows Total Income, Total Expenses, and Net Balance
   - All transactions listed in the table

### Test 3: Custom Date Range
1. Click "Download Report" button
2. In the modal:
   - Check "Expense" checkbox
   - Select "Custom" from Duration dropdown
   - Set Start Date: 2025-01-01
   - Set End Date: 2025-10-17
3. Click "Download" button
4. **Expected Result**: 
   - PDF downloads with expenses from custom date range
   - Date range shown in PDF header

### Test 4: Validation Tests
1. Click "Download Report" button
2. Don't select any report type
3. Select a duration
4. Click "Download"
5. **Expected Result**: Error message "Please select at least one report type"

6. Now select a report type but don't select a duration
7. Click "Download"
8. **Expected Result**: Error message about selecting duration

### Test 5: PDF Content Verification
Open any downloaded PDF and verify:
- ✅ Header section:
  - Company name: "Janco Home & Construction (Pvt) Ltd." (bold, large)
  - Subtitle: "Architectural Designing and Construction"
  - Address: "458/1 High Level Road, Pannipitiya."
  - All contact details on separate lines:
    - 011 20 900 90 | 070 60 900 92 | 70 60 900 93 | 077 12 873 74
    - jancohomearch@gmail.com | info@jancohome.com
    - jancohome.com
  - Company logo in top right corner
  
- ✅ Horizontal line separator

- ✅ Report details:
  - Title: "Financial Report" (centered)
  - Date range
  - Generation timestamp

- ✅ Summary section:
  - Total Income (if selected) - green color
  - Total Expenses (if selected) - red color
  - Net Balance - green if positive, red if negative

- ✅ Transactions table:
  - Headers: Date, Section, Description, Income, Expense
  - Income amounts in green with "+" prefix
  - Expense amounts in red with "-" prefix
  - Proper formatting with commas and 2 decimal places

- ✅ Footer:
  - Watermark text at bottom: "This is a generated document from Janco Home & Construction Management System"
  - Text in italic, gray color, centered

### Test 6: Session Persistence (Main Fix)
1. Click "Download Report" button
2. Fill in the form and download a report
3. After download completes:
   - **Expected Result**: You should still be logged in
   - Navigate to other sections (Projects, Dashboard, etc.)
   - All should work normally without being redirected to login

## Common Issues to Watch For

### ❌ Issue: User gets logged out after clicking download
**Status**: This should be FIXED now
**If it still happens**: Check browser console for errors

### ❌ Issue: Download button does nothing
**Check**: 
- Browser console for errors
- Network tab to see if API call is made
- Backend server is running

### ❌ Issue: PDF download fails with error
**Check**:
- Token is valid (check localStorage in browser DevTools)
- Date range is valid
- At least one report type is selected

### ❌ Issue: Logo not showing in PDF
**Check**:
- File exists at: `public/logo.png`
- Backend has read access to the file

## Success Criteria
✅ All test cases pass
✅ No logout issues when downloading report
✅ PDF contains all required elements with proper formatting
✅ Error handling works correctly
✅ User experience is smooth and professional

## Browser Console Commands for Debugging
```javascript
// Check if token exists
localStorage.getItem('token')

// Check current user
JSON.parse(localStorage.getItem('user'))

// Clear auth and test login again
localStorage.removeItem('token')
localStorage.removeItem('user')
```
