import { test, expect } from '@playwright/test'

test.describe('Route protection — public routes', () => {
  test('/login page is accessible without authentication', async ({ page }) => {
    const response = await page.goto('/login')

    // Should not redirect — login is a public route
    expect(response?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Sign in to your account')).toBeVisible()
  })

  test('/register page is accessible without authentication', async ({ page }) => {
    const response = await page.goto('/register')

    expect(response?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByText('Create your account')).toBeVisible()
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login')

    const registerLink = page.locator('a[href="/register"]')
    await expect(registerLink).toBeVisible()
  })

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register')

    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
  })
})
