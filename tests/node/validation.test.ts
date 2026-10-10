import { test } from "node:test";
import assert from "node:assert/strict";
import {
  publicLeadSchema,
  recordSchema,
  itemSchema,
} from "../../lib/crm/schema";
import { canManageRole, safeAdminPath } from "../../lib/auth/permissions";
import { validFile } from "../../lib/crm/files";
test("public enquiries reject spam fields, privileged fields and invalid input", () => {
  const valid = {
    name: "Visitor",
    email: "USER@example.test",
    message: "Please automate reporting.",
  };
  assert.equal(publicLeadSchema.parse(valid).email, "user@example.test");
  for (const extra of [
    { email: "bad" },
    { message: "short" },
    { website_confirm: "bot" },
    { organization_id: "injected" },
    { website: "javascript:alert(1)" },
    { estimated_budget: -1 },
  ])
    assert.equal(
      publicLeadSchema.safeParse({ ...valid, ...extra }).success,
      false,
    );
});
test("record validation bounds numeric values and rejects hidden ownership fields", () => {
  assert.equal(
    recordSchema("deals").safeParse({ name: "Deal", probability: 1.5 }).success,
    false,
  );
  assert.equal(
    recordSchema("tasks").parse({
      name: "Follow up",
      due_at: "2026-10-10T12:30",
    }).due_at,
    "2026-10-10T12:30:00.000Z",
  );
  assert.equal(
    recordSchema("deals").safeParse({ name: "Deal", value: -5 }).success,
    false,
  );
  assert.equal(
    recordSchema("deals").safeParse({ name: "Deal", probability: 101 }).success,
    false,
  );
  assert.equal(
    recordSchema("customers").safeParse({
      name: "Customer",
      organization_id: "forged",
    }).success,
    false,
  );
  assert.equal(
    itemSchema.safeParse({ description: "Item", quantity: 0, unit_cost: 10 })
      .success,
    false,
  );
});
test("role changes and redirect boundaries", () => {
  assert.equal(canManageRole("ADMIN", "STAFF", "SUPER_ADMIN"), false);
  assert.equal(canManageRole("ADMIN", "ADMIN", "STAFF"), false);
  assert.equal(canManageRole("SUPER_ADMIN", "ADMIN", "SUPER_ADMIN"), true);
  assert.equal(safeAdminPath("//attacker.test"), "/admin/dashboard");
  assert.equal(safeAdminPath("/admin/leads"), "/admin/leads");
});
test("file validation rejects MIME spoofing and invalid UTF-8", () => {
  const bytes = new TextEncoder().encode("%PDF-1.7\n");
  assert.equal(validFile(bytes, "application/pdf"), true);
  assert.equal(validFile(bytes, "image/png"), false);
  assert.equal(validFile(new Uint8Array([255, 0]), "text/plain"), false);
});
