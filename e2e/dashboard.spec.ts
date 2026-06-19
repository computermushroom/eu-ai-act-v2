import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("dashboard requires authentication", async ({ page }) => {
    await page.goto("/dashboard");
    // 未认证用户应被重定向
    await page.waitForURL(/\/(login|register)/, { timeout: 5000 });
  });

  test("settings page loads for authenticated user", async ({ page }) => {
    // 先登录
    await page.goto("/login");
    // 使用开发模式或 mock 登录
    // 由于 E2E 测试环境可能没有真实用户，此测试标记为 skip
    test.skip(true, "Requires authenticated user");
  });
});
