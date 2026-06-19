import { test, expect } from "@playwright/test";

test.describe("Pricing Page", () => {
  test("pricing page displays all tiers", async ({ page }) => {
    await page.goto("/pricing");

    // 验证 5 个套餐都显示
    await expect(page.locator("text=Free")).toBeVisible();
    await expect(page.locator("text=Starter")).toBeVisible();
    await expect(page.locator("text=Professional")).toBeVisible();
    await expect(page.locator("text=Business")).toBeVisible();
    await expect(page.locator("text=Enterprise")).toBeVisible();

    // 验证价格显示
    await expect(page.locator("text=EUR")).toHaveCount(5);
  });

  test("unauthenticated user sees login prompt on subscribe", async ({ page }) => {
    await page.goto("/pricing");

    // 点击 Professional 套餐的订阅按钮
    const subscribeButtons = page.locator("button", { hasText: /Subscribe|Get Started|Upgrade/i });
    if (await subscribeButtons.count() > 0) {
      await subscribeButtons.first().click();
      // 未登录用户应该被重定向到登录页
      await page.waitForURL(/\/(login|register)/, { timeout: 5000 });
    }
  });
});
