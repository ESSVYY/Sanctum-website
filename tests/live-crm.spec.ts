import { test, expect } from "@playwright/test";
// Explicit opt-in against a DISPOSABLE staging project. These tests create records.
test.describe("live Supabase staff workflows", () => {
  test.skip(
    process.env.LIVE_E2E_ENABLED !== "true" ||
      !process.env.E2E_STAFF_EMAIL ||
      !process.env.E2E_STAFF_PASSWORD,
    "Requires explicit staging opt-in and local credentials.",
  );
  test("login, create/update customer, task and proposal, then logout", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page
      .getByLabel("Email", { exact: true })
      .fill(process.env.E2E_STAFF_EMAIL!);
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.E2E_STAFF_PASSWORD!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    const name = "E2E customer " + Date.now();
    await page.goto("/admin/customers/new");
    await page.getByLabel("Company name *").fill(name);
    await page.getByRole("button", { name: "Save record" }).click();
    await expect(page.getByRole("status")).toContainText("Record saved");
    await page.getByRole("link", { name: "Open saved record" }).click();
    await page
      .getByLabel("Notes", { exact: true })
      .fill("Integration test note");
    await page.getByRole("button", { name: "Save record" }).click();
    await expect(page.getByRole("status")).toContainText("Record saved");
    await page.reload();
    await expect(page.getByLabel("Notes", { exact: true })).toHaveValue(
      "Integration test note",
    );
    await page.goto("/admin/tasks/new");
    await page.getByLabel("Name *", { exact: true }).fill("E2E follow-up");
    await page
      .getByLabel("Customer", { exact: true })
      .selectOption({ label: name });
    await page.getByRole("button", { name: "Save record" }).click();
    await expect(page.getByRole("status")).toContainText("Record saved");
    await page.getByRole("link", { name: "Open saved record" }).click();
    await page.getByLabel("Status", { exact: true }).selectOption("DONE");
    await page.getByRole("button", { name: "Save record" }).click();
    await expect(page.getByRole("status")).toContainText("Record saved");
    await page.goto("/admin/proposals/new");
    await page.getByLabel("Name *", { exact: true }).fill("E2E proposal");
    await page
      .getByLabel("Customer *", { exact: true })
      .selectOption({ label: name });
    await page.getByRole("button", { name: "Save record" }).click();
    await expect(page.getByRole("status")).toContainText("Record saved");
    await page.getByRole("link", { name: "Open saved record" }).click();
    await page.getByRole("button", { name: "Add line item" }).click();
    await page
      .getByLabel("Description", { exact: true })
      .fill("Reporting automation");
    await page.getByLabel("Unit cost (NZD)").fill("250");
    await page.getByRole("button", { name: "Save line items" }).click();
    await expect(page.getByRole("status").last()).toContainText(
      "Line items saved",
    );
    await page.locator(".crm-profile summary").click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/customers");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
