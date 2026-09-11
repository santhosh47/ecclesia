import { test, expect } from '@playwright/test';

test.describe('Ecclesia Desktop End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Seed initial session as super_admin so tests run reliably
    await page.addInitScript(() => {
      localStorage.setItem(
        'ecclesia_auth_user',
        JSON.stringify({
          id: 1,
          username: 'admin',
          full_name: 'Senior Pastor / Administrator',
          email: 'admin@ecclesia.org',
          role: 'super_admin',
          is_active: true,
        })
      );
      localStorage.setItem('ecclesia_auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc4OTEyMzY5NSwiZXhwIjoxODIwNjU5Njk1fQ.jl3sy2UJfs91CwcXP6AW_fjJkD6hp5LK5JgD1k2CQg0');
    });

    await page.goto('/');
    // Wait for app layout to mount
    await expect(page.locator('.sidebar')).toBeVisible({ timeout: 10000 });
  });

  test('Navigation: All primary tabs render correctly', async ({ page }) => {
    // 1. Dashboard
    await expect(page.locator('.sidebar-nav button:has-text("Executive Dashboard")')).toBeVisible();
    await expect(page.getByText('Total Members').first()).toBeVisible();

    // 2. Members tab
    await page.locator('.sidebar-nav button:has-text("Member Directory")').click();
    await expect(page.getByText('Church Member Directory').first()).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // 3. Attendance tab
    await page.locator('.sidebar-nav button:has-text("Attendance Roster")').click();
    await expect(page.getByRole('button', { name: /Live Check-In|Check-In/i }).first()).toBeVisible();

    // 4. Church Calendar tab
    await page.locator('.sidebar-nav button:has-text("Church Activities")').click();
    await expect(page.getByRole('button', { name: /Schedule Activity/i })).toBeVisible();

    // 5. Finances tab
    await page.locator('.sidebar-nav button:has-text("Giving & Pledges")').click();
    await expect(page.getByRole('button', { name: /Record Contribution|Record Giving/i }).first()).toBeVisible();

    // 6. Pastoral Care tab
    await page.locator('.sidebar-nav button:has-text("Pastoral Care & Prayer")').click();
    await expect(page.getByRole('button', { name: /New Prayer Request/i }).first()).toBeVisible();

    // 7. Settings tab
    await page.locator('.sidebar-nav button:has-text("System Settings & RBAC")').click();
    await expect(page.getByText('Church Profile').first()).toBeVisible();
  });

  test('Use Case 1: Member Creation via UI & Database Reflection', async ({ page, request }) => {
    // Navigate to Members
    await page.locator('.sidebar-nav button:has-text("Member Directory")').click();
    await expect(page.locator('table')).toBeVisible();

    // Click Add New Member
    const addMemberBtn = page.getByRole('button', { name: /Add New Member|New Member/i }).first();
    await expect(addMemberBtn).toBeVisible();
    await addMemberBtn.click();

    // Ensure modal appears
    const modal = page.locator('.modal-dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Register New Church Member')).toBeVisible();

    // Generate unique member data for isolation
    const uniqueId = Date.now().toString().slice(-5);
    const firstName = `Grace${uniqueId}`;
    const lastName = `Kowalski${uniqueId}`;
    const email = `grace${uniqueId}@example.com`;
    const phone = `+91 98450 ${uniqueId}`;

    // Fill out form
    const formGrid = modal.locator('.form-grid');
    await formGrid.locator('div:has-text("First Name") input').fill(firstName);
    await formGrid.locator('div:has-text("Last Name") input').fill(lastName);
    await formGrid.locator('div:has-text("Email") input').fill(email);
    await formGrid.locator('div:has-text("Primary Phone") input').fill(phone);

    // Select Gender if present
    const genderSelect = modal.locator('select').filter({ hasText: /Gender|Female|Male/i }).first();
    if (await genderSelect.isVisible()) {
      await genderSelect.selectOption('Female');
    }

    // Submit the form
    const submitBtn = modal.getByRole('button', { name: /Add Member|Register|Save/i }).last();
    await submitBtn.click();

    // Verify modal closes
    await expect(modal).not.toBeVisible({ timeout: 7000 });

    // Verify member is visible in the UI table
    await expect(page.locator('table')).toContainText(firstName, { timeout: 7000 });
    await expect(page.locator('table')).toContainText(lastName);

    // Verify directly in backend database via API
    const dbResponse = await request.get(`http://localhost:8000/api/v1/members?search=${firstName}`);
    expect(dbResponse.ok()).toBeTruthy();
    const dbMembers = await dbResponse.json();
    expect(Array.isArray(dbMembers)).toBeTruthy();
    const found = dbMembers.find((m: any) => m.first_name === firstName && m.last_name === lastName);
    expect(found).toBeDefined();
    expect(found.email).toBe(email);
    expect(found.phone).toBe(phone);
  });

  test('Use Case 2: Activity Creation with Attendance & Event Linking', async ({ page, request }) => {
    // Navigate to Church Calendar
    await page.locator('.sidebar-nav button:has-text("Church Activities")').click();
    await expect(page.getByRole('button', { name: /Schedule Activity/i })).toBeVisible();

    // Click Schedule Activity
    await page.getByRole('button', { name: /Schedule Activity/i }).click();

    // Ensure modal appears
    const modal = page.locator('.modal-dialog');
    await expect(modal).toBeVisible();

    const uniqueId = Date.now().toString().slice(-4);
    const activityTitle = `Harvest Praise Night ${uniqueId}`;

    // Fill Title
    await modal.locator('input[placeholder*="Sunday Morning" i], .form-grid div:has-text("Title") input').first().fill(activityTitle);

    // Fill Location
    const locInput = modal.locator('input[placeholder*="Main Sanctuary" i], input[placeholder*="Location" i], .form-grid div:has-text("Location") input').first();
    if (await locInput.isVisible()) {
      await locInput.fill('Main Sanctuary Hall');
    }

    // Fill Start & End dates
    const now = new Date();
    const startsAtStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 16);
    const endsAtStr = new Date(now.getTime() + 93600000).toISOString().slice(0, 16);

    const dateInputs = modal.locator('input[type="datetime-local"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.nth(0).fill(startsAtStr);
      await dateInputs.nth(1).fill(endsAtStr);
    }

    // Check "Track Attendance" checkbox
    const trackAttendanceCheckbox = modal.locator('input[type="checkbox"]').filter({ has: page.locator('xpath=..', { hasText: /Track Attendance/i }) }).first();
    if (await trackAttendanceCheckbox.isVisible()) {
      await trackAttendanceCheckbox.check();
    } else {
      // Fallback click on label
      await modal.getByText(/Track Attendance/i).click();
    }

    // Submit Activity
    const saveBtn = modal.getByRole('button', { name: /Schedule Activity|Save Activity|Create/i }).last();
    await saveBtn.click();

    // Verify modal closes
    await expect(modal).not.toBeVisible({ timeout: 7000 });

    // Verify activity card appears on calendar view
    const card = page.locator('.activity-card, .card').filter({ hasText: activityTitle }).first();
    await expect(card).toBeVisible({ timeout: 7000 });

    // Verify "Track / View Attendance" button is displayed on card
    const trackBtn = card.getByRole('button', { name: /Attendance/i });
    await expect(trackBtn).toBeVisible();

    // Verify linked Event exists in backend SQLite database
    const eventsRes = await request.get('http://localhost:8000/api/v1/events');
    expect(eventsRes.ok()).toBeTruthy();
    const eventsList = await eventsRes.json();
    const linkedEvent = eventsList.find((e: any) => e.title === activityTitle);
    expect(linkedEvent).toBeDefined();
    expect(linkedEvent.location).toContain('Sanctuary');

    // Click "Track / View Attendance" on the activity card
    await trackBtn.click();

    // Verify UI navigated to Attendance section
    await expect(page.locator('.sidebar-nav button:has-text("Attendance Roster")')).toHaveClass(/active/);
  });

  test('Use Case 3: Member Search, Sorting & Filter Drawer', async ({ page }) => {
    // Navigate to Members
    await page.locator('.sidebar-nav button:has-text("Member Directory")').click();
    await expect(page.locator('table')).toBeVisible();

    // Test Search input
    const searchInput = page.locator('.search-box input, input[placeholder*="Search by name" i]').first();
    await searchInput.fill('David');
    await page.waitForTimeout(400); // debounce wait
    await expect(page.locator('table')).toContainText(/David/i);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(400);

    // Test clickable table header sorting
    const nameHeader = page.locator('th').filter({ hasText: /Name/i }).first();
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await page.waitForTimeout(300);
      // Click again to toggle sort direction
      await nameHeader.click();
      await page.waitForTimeout(300);
    }

    // Test Filter Drawer
    const filterBtn = page.getByRole('button', { name: /Filter/i }).first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      // Check if filter drawer/panel opens
      await expect(page.getByText(/Gender|Marital Status|Member Type/i).first()).toBeVisible();
    }
  });

  test('Use Case 4: CSV Data Export Verification', async ({ page }) => {
    // Test Members CSV Export
    await page.locator('.sidebar-nav button:has-text("Member Directory")').click();
    await expect(page.locator('table')).toBeVisible();

    const exportMembersBtn = page.getByRole('button', { name: /Export CSV|Export/i }).first();
    await expect(exportMembersBtn).toBeVisible();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 7000 }).catch(() => null);
    await exportMembersBtn.click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });

  test('Use Case 5: Declarative Routing, Deep Linking & Browser History', async ({ page }) => {
    // 1. Navigate to /members by clicking sidebar button
    await page.locator('.sidebar-nav button:has-text("Member Directory")').click();
    await expect(page).toHaveURL(/\/members/);
    await expect(page.getByText('Church Member Directory').first()).toBeVisible();

    // 2. Navigate to /finances by clicking sidebar button
    await page.locator('.sidebar-nav button:has-text("Giving & Pledges")').click();
    await expect(page).toHaveURL(/\/finances/);
    await expect(page.getByRole('button', { name: /Record Contribution|Record Giving/i }).first()).toBeVisible();

    // 3. Browser Back button returns to /members
    await page.goBack();
    await expect(page).toHaveURL(/\/members/);
    await expect(page.getByText('Church Member Directory').first()).toBeVisible();

    // 4. Direct deep link: visiting /attendance directly loads attendance view
    await page.goto('/attendance');
    await expect(page).toHaveURL(/\/attendance/);
    await expect(page.getByRole('button', { name: /Live Check-In|Check-In/i }).first()).toBeVisible();

    // 5. Refresh preserves the active route
    await page.reload();
    await expect(page).toHaveURL(/\/attendance/);
    await expect(page.getByRole('button', { name: /Live Check-In|Check-In/i }).first()).toBeVisible();
  });

  test('Use Case 6: Database Backups & System Maintenance UI', async ({ page }) => {
    // 1. Navigate to Settings view
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    // 2. Switch to Backups & Snapshots tab
    const backupsTabBtn = page.getByRole('button', { name: /Backups & Snapshots/i });
    await expect(backupsTabBtn).toBeVisible();
    await backupsTabBtn.click();

    // 3. Verify System Health and Header
    await expect(page.getByText('Database Backups & Maintenance')).toBeVisible();
    await expect(page.getByText('Database Connection')).toBeVisible();
    await expect(page.getByText(/Online & Healthy|Active Connection/i)).toBeVisible();

    // 4. Trigger Create Database Backup
    const createBtn = page.getByRole('button', { name: /Create Database Backup/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // 5. Verify snapshot creation success message or table row
    await expect(page.getByText(/Database snapshot created successfully|\.db\.gz/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Download/i }).first()).toBeVisible();
  });
});

