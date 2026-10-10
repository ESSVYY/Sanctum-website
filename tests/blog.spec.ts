import { test, expect } from "@playwright/test";
// Preview assertions run with Supabase unset and BLOG_PREVIEW_CONTENT=true.
test("AI engineering links to the existing enquiry workflow", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#capabilities")).toContainText("Custom AI.");
  await expect(page.locator(".engineering-card")).toHaveCount(6);
  await expect(page.locator("#ai-applications")).toContainText(
    "Conceptual application",
  );
  await expect(page.locator(".engineering-process li")).toHaveCount(6);
  await page
    .locator("#capabilities")
    .getByRole("link", { name: "Discuss Your AI Project" })
    .click();
  await expect(page.getByLabel("Requested service")).toHaveValue(
    "Custom AI Engineering",
  );
});
for (const width of [375, 1440])
  test(`blog content, filtering and article layout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { name: "Sanctum Insights", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "Local content preview",
    );
    await expect(page.locator(".insight-card")).toHaveCount(3);
    await page
      .getByRole("navigation", { name: "Article categories" })
      .getByRole("link", { name: "Computer Vision", exact: true })
      .click();
    await expect(page.locator(".insight-card")).toHaveCount(1);
    await page.locator(".insight-card h2 a").click();
    await expect(page.locator("h1")).toHaveText(
      "How Computer Vision Can Turn Aerial Images Into Business Intelligence",
    );
    await expect(page.locator(".article-body")).toContainText(
      "geographic coordinates",
    );
    await expect(page.locator(".related-insights .insight-card")).toHaveCount(
      2,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/blog\/computer-vision-aerial-business-intelligence$/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".footer-links-grid")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 2),
    ).toBe(true);
    await page.screenshot({
      path: `reference/blog-article-${width}.png`,
      fullPage: true,
    });
    await page.goto("/blog");
    await page.screenshot({
      path: `reference/blog-${width}.png`,
      fullPage: true,
    });
  });
test("private editor redirects anonymous visitors", async ({ page }) => {
  await page.goto("/admin/blog/new");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/blog/a1000000-0000-4000-8000-000000000001/preview");
  await expect(page).toHaveURL(/\/admin\/login/);
});
test("unknown article is 404 and preview drafts are absent from sitemap", async ({
  request,
}) => {
  expect((await request.get("/blog/does-not-exist")).status()).toBe(404);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain("what-is-custom-ai-development");
});
