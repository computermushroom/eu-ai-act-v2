import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("homepage loads with key elements", async ({ page }) => {
    await page.goto("/");

    // 验证页面标题
    await expect(page).toHaveTitle(/EU AI Act|Compliance/i);

    // 验证关键元素存在
    await expect(page.locator("body")).toBeVisible();

    // 验证导航链接
    const navLinks = page.locator("a", { hasText: /Pricing|Tools|Login|Register/i });
    await expect(navLinks.first()).toBeVisible();
  });

  test("navigation to pricing works", async ({ page }) => {
    await page.goto("/");

    // 查找并点击 Pricing 链接
    const pricingLink = page.locator("a", { hasText: /Pricing/i }).first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await page.waitForURL(/\/pricing/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/pricing/);
    }
  });
});
