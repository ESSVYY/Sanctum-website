import { z } from "zod";
export const entities = [
  "leads",
  "customers",
  "contacts",
  "deals",
  "tasks",
  "proposals",
  "activities",
] as const;
export type Entity = (typeof entities)[number];
export type Row = Record<string, string | number | boolean | null>;
export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "url"
    | "number"
    | "datetime-local"
    | "date"
    | "textarea"
    | "select";
  required?: boolean;
  options?: readonly string[];
  relation?: Entity | "profiles";
  min?: number;
  max?: number;
};
const stages = ["NEW", "QUALIFIED", "MEETING", "PROPOSAL", "WON", "LOST"];
const name: Field = { key: "name", label: "Name", required: true };
const email: Field = { key: "email", label: "Email", type: "email" };
const phone: Field = { key: "phone", label: "Phone" };
const website: Field = { key: "website", label: "Website", type: "url" };
const notes: Field = { key: "notes", label: "Notes", type: "textarea" };
const assigned: Field = {
  key: "assigned_to",
  label: "Assigned staff",
  relation: "profiles",
};
const customer: Field = {
  key: "customer_id",
  label: "Customer",
  relation: "customers",
};
const deal: Field = { key: "deal_id", label: "Deal", relation: "deals" };
const lead: Field = { key: "lead_id", label: "Lead", relation: "leads" };
export const definitions: Record<
  Entity,
  { title: string; path: string; fields: Field[]; columns: string[] }
> = {
  leads: {
    title: "Leads",
    path: "leads",
    columns: ["name", "email", "company", "status", "follow_up_at"],
    fields: [
      name,
      { ...email, required: true },
      phone,
      { key: "company", label: "Company" },
      website,
      { key: "requested_service", label: "Requested service" },
      {
        key: "estimated_budget",
        label: "Estimated budget (NZD)",
        type: "number",
        min: 0,
      },
      { key: "message", label: "Enquiry message", type: "textarea" },
      notes,
      { key: "source", label: "Source" },
      { key: "status", label: "Status", type: "select", options: stages },
      { key: "follow_up_at", label: "Follow-up date", type: "datetime-local" },
      assigned,
    ],
  },
  customers: {
    title: "Customers",
    path: "customers",
    columns: ["name", "email", "industry", "status"],
    fields: [
      { ...name, label: "Company name" },
      email,
      phone,
      { key: "primary_contact", label: "Primary contact" },
      { key: "industry", label: "Industry" },
      website,
      { key: "services", label: "Services required" },
      notes,
      {
        key: "status",
        label: "Relationship",
        type: "select",
        options: ["ACTIVE", "PROSPECT", "INACTIVE"],
      },
      assigned,
    ],
  },
  contacts: {
    title: "Contacts",
    path: "contacts",
    columns: ["name", "email", "phone", "job_title"],
    fields: [
      name,
      { ...customer, required: true },
      email,
      phone,
      { key: "job_title", label: "Job title" },
      notes,
      assigned,
    ],
  },
  deals: {
    title: "Sales Pipeline",
    path: "pipeline",
    columns: ["name", "status", "value", "probability", "expected_close"],
    fields: [
      name,
      customer,
      lead,
      { key: "status", label: "Stage", type: "select", options: stages },
      { key: "value", label: "Value (NZD)", type: "number", min: 0 },
      {
        key: "probability",
        label: "Probability (%)",
        type: "number",
        min: 0,
        max: 100,
      },
      { key: "expected_close", label: "Expected close", type: "date" },
      notes,
      assigned,
    ],
  },
  tasks: {
    title: "Tasks",
    path: "tasks",
    columns: ["name", "status", "priority", "due_at"],
    fields: [
      name,
      { key: "description", label: "Description", type: "textarea" },
      customer,
      lead,
      deal,
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["TODO", "IN_PROGRESS", "DONE"],
      },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      },
      { key: "due_at", label: "Due date", type: "datetime-local" },
      assigned,
    ],
  },
  proposals: {
    title: "Proposals",
    path: "proposals",
    columns: ["name", "status", "currency"],
    fields: [
      name,
      { ...customer, required: true },
      deal,
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["DRAFT", "SENT", "ACCEPTED", "REJECTED"],
      },
      { key: "currency", label: "Currency", required: true },
      notes,
      assigned,
    ],
  },
  activities: {
    title: "Activities",
    path: "activities",
    columns: ["name", "kind", "created_at"],
    fields: [
      name,
      {
        key: "body",
        label: "Activity / note",
        type: "textarea",
        required: true,
      },
      customer,
      lead,
      deal,
      { key: "proposal_id", label: "Proposal", relation: "proposals" },
      {
        key: "kind",
        label: "Type",
        type: "select",
        options: ["NOTE", "CALL", "MEETING", "EMAIL", "STATUS"],
      },
      assigned,
    ],
  },
};
export function entityForPath(path: string): Entity | undefined {
  return entities.find((entity) => definitions[entity].path === path);
}
export function recordSchema(entity: Entity) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of definitions[entity].fields) {
    let validator: z.ZodType;
    if (field.relation) validator = z.uuid();
    else if (field.options)
      validator = z.enum(field.options as [string, ...string[]]);
    else if (field.type === "number") {
      const number = z.coerce
        .number()
        .min(field.min ?? 0)
        .max(field.max ?? 1e12);
      validator = field.key === "probability" ? number.int() : number;
    } else if (field.type === "datetime-local")
      validator = z.iso
        .datetime({ local: true, precision: -1 })
        .transform((v) => new Date(v + "Z").toISOString());
    else if (field.key === "currency")
      validator = z
        .string()
        .regex(/^[A-Z]{3}$/, "Use a three-letter currency code");
    else if (field.type === "date") validator = z.iso.date();
    else if (field.type === "email")
      validator = z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase().trim());
    else if (field.type === "url")
      validator = z
        .url()
        .refine(
          (v) => ["https:", "http:"].includes(new URL(v).protocol),
          "Use an HTTP or HTTPS URL",
        )
        .transform((v) => v.trim());
    else
      validator = z
        .string()
        .trim()
        .min(field.required ? 1 : 0)
        .max(field.type === "textarea" ? 5000 : 200);
    if (!field.required)
      validator = z
        .union([z.literal("").transform(() => null), validator])
        .nullable()
        .optional();
    shape[field.key] = validator;
  }
  return z.object(shape).strict();
}
export const publicLeadSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase().trim()),
    phone: z.string().trim().max(50).default(""),
    company: z.string().trim().max(200).default(""),
    website: z
      .union([
        z.literal(""),
        z
          .url()
          .refine((v) => ["https:", "http:"].includes(new URL(v).protocol)),
      ])
      .default(""),
    requested_service: z.string().trim().max(200).default(""),
    estimated_budget: z
      .union([z.literal(""), z.coerce.number().min(0).max(1e12)])
      .default(""),
    message: z.string().trim().min(10).max(5000),
    website_confirm: z.string().max(0).default(""),
    turnstile_token: z.string().max(2048).default(""),
  })
  .strict();
export const itemSchema = z.object({
  description: z.string().trim().min(1).max(1000),
  quantity: z.coerce.number().positive().max(1e6),
  unit_cost: z.coerce.number().min(0).max(1e10),
});
