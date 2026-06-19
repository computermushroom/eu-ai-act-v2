import { test, expect } from "@playwright/test";

test.describe("Compliance Tools", () => {
  test("risk assessment tool page loads", async ({ page }) => {
    await page.goto("/tools/risk-assessment");
    await expect(page).toHaveTitle(/Risk|Assessment/i);
    // 验证页面有表单或工具内容
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("AI assistant page loads", async ({ page }) => {
    await page.goto("/tools/ai-assistant");
    await expect(page).toHaveTitle(/Assistant|AI/i);
  });

  test("FRIA tool page loads", async ({ page }) => {
    await page.goto("/tools/fria");
    await expect(page).toHaveTitle(/FRIA|Impact/i);
  });
});
