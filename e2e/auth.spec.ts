import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("user can register and login", async ({ page }) => {
    // 1. 访问注册页
    await page.goto("/register");
    await expect(page).toHaveTitle(/Register|Sign Up/i);

    // 2. 填写注册表单
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', "TestPassword123!");
    await page.fill('input[name="name"]', "Test User");

    // 3. 提交注册
    await page.click('button[type="submit"]');

    // 4. 验证重定向到登录页或 dashboard
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });

    // 5. 登录
    if (page.url().includes("/login")) {
      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[type="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    }

    // 6. 验证 dashboard 加载
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Login|Sign In/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("password reset page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page).toHaveTitle(/Forgot|Reset/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
