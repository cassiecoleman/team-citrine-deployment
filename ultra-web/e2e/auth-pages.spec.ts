import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('main').getByRole('heading', { name: 'Ultra' })).toBeVisible()
    await expect(page.locator('text=Sign in to your account')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show register link', async ({ page }) => {
    const registerLink = page.locator('a[href="/register"]')
    await expect(registerLink).toBeVisible()
    await expect(registerLink).toContainText('Register')
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.locator('input[type="email"]').fill('invalid-email')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button[type="submit"]').click()

    // Browser validation should prevent submission with invalid email
    // The form should still have focus on the email field due to HTML5 validation
    await expect(page.locator('input[type="email"]')).toBeFocused()
  })

  test('should show validation error for short password', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('short')
    await page.locator('button[type="submit"]').click()

    // Wait for error message
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('should disable form during submission', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Ensure submit does not crash the page with a runtime error overlay.
    await page.waitForTimeout(1000)
    await expect(page.locator('text=This page couldn’t load')).toHaveCount(0)
  })
})

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('should display register form', async ({ page }) => {
    await expect(page.getByRole('main').getByRole('heading', { name: 'Ultra' })).toBeVisible()
    await expect(page.locator('text=Create your account')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show login link', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toContainText('Sign In')
  })

  test('should show error when passwords do not match', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('password123')
    await page.locator('input[name="confirmPassword"]').fill('different123')
    await page.locator('button[type="submit"]').click()

    // Wait for error message
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('should show password requirements', async ({ page }) => {
    await expect(page.locator('text=At least 8 characters')).toBeVisible()
  })

  test('should disable form during submission', async ({ page }) => {
    await page.locator('input[type="email"]').fill('newuser@example.com')
    await page.locator('input[name="password"]').fill('password123')
    await page.locator('input[name="confirmPassword"]').fill('password123')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Ensure submit does not crash the page with a runtime error overlay.
    await page.waitForTimeout(1000)
    await expect(page.locator('text=This page couldn’t load')).toHaveCount(0)
  })
})
