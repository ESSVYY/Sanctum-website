import { test, expect } from "@playwright/test";
test("anonymous staff pages redirect to login and private APIs deny access", async ({
  page,
  request,
}) => {
  for (const path of [
    "/admin/dashboard",
    "/admin/leads",
    "/admin/customers/new",
    "/admin/team",
    "/admin/audit",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  }
  expect((await request.get("/api/crm/leads/export")).status()).toBe(401);
  expect(
    (
      await request.get(
        "/api/crm/files?id=00000000-0000-4000-8000-000000000001",
      )
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/crm/files", {
        headers: { Origin: "https://invalid.example" },
      })
    ).status(),
  ).toBe(403);
});
test("public enquiries validate input, reject cross-origin and fail honestly before setup", async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto("/contact");
  await expect(
    page.getByRole("heading", { name: "Let’s talk about your business" }),
  ).toBeVisible();
  expect(
    (
      await request.post("/api/leads", {
        headers: { Origin: "https://attacker.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/leads", {
        headers: { Origin: baseURL! },
        data: { name: "Visitor", email: "invalid", message: "short" },
      })
    ).status(),
  ).toBe(400);
  // Do not submit a valid enquiry to a configured live project during smoke tests.
  await page.route("/api/leads", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Online enquiries are temporarily unavailable.",
      }),
    }),
  );
  await page.getByLabel("Name *", { exact: true }).fill("Visitor");
  await page
    .getByLabel("Email *", { exact: true })
    .fill("visitor@example.test");
  await page
    .getByLabel("Tell us about your business task *")
    .fill("Please help automate our reporting.");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.locator('.enquiry-error[role="alert"]')).toContainText(
    "temporarily unavailable",
  );
});
test("auth pages are usable on mobile and invalid recovery links fail safely", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/auth/confirm?token_hash=invalid&type=signup");
  await expect(page).toHaveURL(/reason=link/);
});
test("homepage has no SVG attribute console warnings", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (msg) => {
    if (/Invalid DOM property|Invalid SVG property/.test(msg.text()))
      warnings.push(msg.text());
  });
  await page.goto("/");
  await page.locator("#analytics").scrollIntoViewIfNeeded();
  expect(warnings).toEqual([]);
});
