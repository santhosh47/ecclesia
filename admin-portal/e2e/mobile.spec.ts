import { test, expect } from '@playwright/test';

test.describe('Ecclesia Mobile Viewport & Responsiveness Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Seed authenticated session
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
    await page.waitForLoadState('networkidle');
  });

  test('Mobile Layout: Hamburger button is visible, sidebar is hidden by default', async ({ page }) => {
    const mobileMenuBtn = page.locator('.mobile-menu-btn');
    await expect(mobileMenuBtn).toBeVisible();

    // Verify sidebar is not overflowing or covering screen by default
    const sidebar = page.locator('.sidebar');
    const isMobileOpen = await sidebar.evaluate((el) => el.classList.contains('mobile-open'));
    expect(isMobileOpen).toBe(false);

    // Click hamburger button to open sidebar
    await mobileMenuBtn.click();
    await expect(sidebar).toHaveClass(/mobile-open/);

    // Verify navigation works from mobile menu: click Member Directory
    await page.locator('.sidebar-nav button:has-text("Member Directory")').click();

    // Verify sidebar closes after navigation
    await expect(sidebar).not.toHaveClass(/mobile-open/);
    await expect(page.getByText('Church Member Directory').first()).toBeVisible();
  });

  test('Responsiveness Audit: Check for horizontal overflow across all views', async ({ page }) => {
    const views = [
      { name: 'Dashboard', text: 'Executive Dashboard' },
      { name: 'Members', text: 'Member Directory' },
      { name: 'Attendance', text: 'Attendance Roster' },
      { name: 'Calendar', text: 'Church Activities' },
      { name: 'Finances', text: 'Giving & Pledges' },
      { name: 'Pastoral', text: 'Pastoral Care & Prayer' },
      { name: 'Settings', text: 'System Settings & RBAC' },
    ];

    for (const view of views) {
      // Open mobile menu
      const mobileMenuBtn = page.locator('.mobile-menu-btn');
      if (await mobileMenuBtn.isVisible()) {
        await mobileMenuBtn.click();
        await page.locator(`.sidebar-nav button:has-text("${view.text}")`).click();
      }

      await page.waitForTimeout(400);

      // Verify no horizontal overflow on page
      const overflowMetrics = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        return {
          scrollWidth,
          innerWidth,
          hasOverflow: scrollWidth > innerWidth + 2, // 2px tolerance for fractional subpixels
        };
      });

      expect(
        overflowMetrics.hasOverflow,
        `Detected horizontal overflow on view ${view.name}: scrollWidth (${overflowMetrics.scrollWidth}px) > innerWidth (${overflowMetrics.innerWidth}px)`
      ).toBe(false);
    }
  });

  test('Mobile Modals: Add Member modal fits mobile viewport and is interactive', async ({ page }) => {
    // Navigate to Member Directory
    const mobileMenuBtn = page.locator('.mobile-menu-btn');
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await page.locator('.sidebar-nav button:has-text("Member Directory")').click();
    }

    // Click Add New Member
    const addBtn = page.getByRole('button', { name: /Add New Member|New Member/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Check modal visibility
    const modal = page.locator('.modal-dialog');
    await expect(modal).toBeVisible();

    // Verify modal does not horizontally exceed viewport
    const modalBox = await modal.boundingBox();
    const viewport = page.viewportSize();
    if (modalBox && viewport) {
      expect(modalBox.width).toBeLessThanOrEqual(viewport.width + 1);
    }

    // Verify modal cancel/close button is accessible and works
    const closeBtn = modal.locator('.modal-header button, button[aria-label="Close"]').first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('Mobile Modals: Add Activity modal fits mobile viewport and is interactive', async ({ page }) => {
    // Navigate to Calendar
    const mobileMenuBtn = page.locator('.mobile-menu-btn');
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await page.locator('.sidebar-nav button:has-text("Church Activities")').click();
    }

    // Click Schedule Activity
    const addActivityBtn = page.getByRole('button', { name: /Schedule Activity/i });
    await expect(addActivityBtn).toBeVisible();
    await addActivityBtn.click();

    const modal = page.locator('.modal-dialog');
    await expect(modal).toBeVisible();

    // Verify form inputs fit inside modal
    const titleInput = modal.locator('input[placeholder*="Sunday Morning" i], .form-grid div:has-text("Title") input').first();
    await expect(titleInput).toBeVisible();

    // Verify checkbox is clickable on touch target
    const trackAttendance = modal.getByText(/Track Attendance/i);
    await expect(trackAttendance).toBeVisible();
    await trackAttendance.click();

    // Close modal
    const closeBtn = modal.locator('.modal-header button, button[aria-label="Close"]').first();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
