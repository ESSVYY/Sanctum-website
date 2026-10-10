import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("CRM migrations and role boundaries on local PostgreSQL", async (t) => {
  const db = new PGlite();
  const org = "10000000-0000-4000-8000-000000000001",
    otherOrg = "10000000-0000-4000-8000-000000000002";
  const superAdmin = "20000000-0000-4000-8000-000000000001",
    admin = "20000000-0000-4000-8000-000000000002",
    staff = "20000000-0000-4000-8000-000000000003",
    otherStaff = "20000000-0000-4000-8000-000000000004",
    outsider = "20000000-0000-4000-8000-000000000005";
  const lead = "30000000-0000-4000-8000-000000000001",
    otherLead = "30000000-0000-4000-8000-000000000002",
    foreignLead = "30000000-0000-4000-8000-000000000003";
  const customer = "40000000-0000-4000-8000-000000000001",
    foreignCustomer = "40000000-0000-4000-8000-000000000002",
    proposal = "50000000-0000-4000-8000-000000000001";
  async function as(user, role = "authenticated", aal = "aal1") {
    await db.exec("reset role");
    await db.query(
      "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
      [user ?? "", JSON.stringify({ sub: user, aal })],
    );
    await db.exec(`set role ${role}`);
  }
  async function rejected(sql, params = []) {
    await assert.rejects(() => db.query(sql, params));
  }
  try {
    // Minimal auth/storage interfaces only; this does not emulate GoTrue or Storage HTTP.
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key,email text);
      create table auth.mfa_factors(id uuid primary key default gen_random_uuid(),user_id uuid,status text);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      grant usage on schema public,auth to anon,authenticated,service_role;
      create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;`);
    for (const migration of [
      "202610090001_crm.sql",
      "202610090002_storage.sql",
      "202610090003_metrics.sql",
      "202610100001_blog.sql",
    ])
      await db.exec(
        await readFile(
          new URL("../../supabase/migrations/" + migration, import.meta.url),
          "utf8",
        ),
      );
    await db.query("insert into organizations(id,name) values($1,$2),($3,$4)", [
      org,
      "Sanctum",
      otherOrg,
      "Other organisation",
    ]);
    for (const [id, role, tenant] of [
      [superAdmin, "SUPER_ADMIN", org],
      [admin, "ADMIN", org],
      [staff, "STAFF", org],
      [otherStaff, "STAFF", org],
      [outsider, "SUPER_ADMIN", otherOrg],
    ]) {
      await db.query("insert into auth.users(id,email) values($1,$2)", [
        id,
        id + "@example.test",
      ]);
      await db.query(
        "insert into profiles(id,organization_id,email,full_name,role) values($1,$2,$3,$4,$5)",
        [id, tenant, id + "@example.test", role, role],
      );
    }
    await db.query(
      "insert into customers(id,organization_id,name,email,assigned_to) values($1,$2,$3,$4,$5),($6,$7,$8,$9,$10)",
      [
        customer,
        org,
        "Customer",
        "customer@example.test",
        staff,
        foreignCustomer,
        otherOrg,
        "Foreign",
        "foreign@example.test",
        outsider,
      ],
    );
    await db.query(
      "insert into leads(id,organization_id,name,email,assigned_to) values($1,$2,$3,$4,$5),($6,$2,$7,$8,$9),($10,$11,$12,$13,$14)",
      [
        lead,
        org,
        "Assigned lead",
        "assigned@example.test",
        staff,
        otherLead,
        "Other lead",
        "other@example.test",
        otherStaff,
        foreignLead,
        otherOrg,
        "Foreign lead",
        "foreignlead@example.test",
        outsider,
      ],
    );
    await db.query(
      "insert into proposals(id,organization_id,name,customer_id,assigned_to) values($1,$2,$3,$4,$5)",
      [proposal, org, "Proposal", customer, staff],
    );
    await t.test(
      "anonymous cannot read private leads or call ingestion RPC",
      async () => {
        await as(null, "anon");
        await rejected("select * from leads");
        await rejected("select submit_public_lead($1,$2,$3)", [
          org,
          {},
          "fake",
        ]);
      },
    );
    await t.test(
      "staff reads only assigned leads and own aggregate metrics",
      async () => {
        await as(staff);
        const { rows } = await db.query("select id from leads");
        assert.deepEqual(
          rows.map((r) => r.id),
          [lead],
        );
        const metric = await db.query("select crm_metrics() as metrics");
        assert.equal(metric.rows[0].metrics.total_leads, 1);
      },
    );
    await t.test(
      "staff permitted notes persist, reassignment and archival fail",
      async () => {
        await db.query("update leads set notes=$1 where id=$2", [
          "Follow up tomorrow",
          lead,
        ]);
        assert.equal(
          (await db.query("select notes from leads where id=$1", [lead]))
            .rows[0].notes,
          "Follow up tomorrow",
        );
        await rejected("update leads set assigned_to=$1 where id=$2", [
          otherStaff,
          lead,
        ]);
        await rejected("update leads set archived_at=now() where id=$1", [
          lead,
        ]);
      },
    );
    await t.test(
      "cross-tenant create and cross-tenant linked records fail",
      async () => {
        await rejected(
          "insert into leads(organization_id,name,email,assigned_to) values($1,$2,$3,$4)",
          [otherOrg, "Bad", "bad@example.test", staff],
        );
        await rejected(
          "insert into tasks(organization_id,name,customer_id,assigned_to) values($1,$2,$3,$4)",
          [org, "Bad link", foreignCustomer, staff],
        );
      },
    );
    await t.test("staff cannot grant roles or write audit log", async () => {
      await rejected("update profiles set role=$1 where id=$2", [
        "SUPER_ADMIN",
        staff,
      ]);
      await rejected("select manage_staff($1,$2,true)", [staff, "SUPER_ADMIN"]);
      await rejected(
        "insert into audit_logs(organization_id,action,entity_type) values($1,$2,$3)",
        [org, "FAKE", "leads"],
      );
      await rejected("delete from audit_logs");
    });
    await t.test(
      "customer CRUD and task notifications respect assignment",
      async () => {
        const added = await db.query(
          "insert into customers(organization_id,name,email,assigned_to) values($1,$2,$3,$4) returning id",
          [org, "Staff customer", "staffcustomer@example.test", staff],
        );
        assert.equal(added.rows.length, 1);
        const task = (
          await db.query(
            "insert into tasks(organization_id,name,assigned_to,customer_id,due_at) values($1,$2,$3,$4,now()-interval '1 day') returning id",
            [org, "Follow up", staff, customer],
          )
        ).rows[0].id;
        assert.equal(
          (await db.query("select count(*)::int as count from notifications"))
            .rows[0].count,
          1,
        );
        await db.query("update tasks set status=$1 where id=$2", [
          "DONE",
          task,
        ]);
        await db.query("update customers set notes=$1 where id=$2", [
          "Approved note",
          customer,
        ]);
        assert.equal(
          (
            await db.query("select notes from customers where id=$1", [
              customer,
            ])
          ).rows[0].notes,
          "Approved note",
        );
      },
    );
    await t.test(
      "proposal items replace atomically and reject invalid costs",
      async () => {
        const items = [
          { description: "Automation", quantity: 2, unit_cost: 150 },
        ];
        await db.query("select replace_proposal_items($1,$2)", [
          proposal,
          JSON.stringify(items),
        ]);
        await rejected("select replace_proposal_items($1,$2)", [
          proposal,
          JSON.stringify([
            { description: "Invalid", quantity: 1, unit_cost: -1 },
          ]),
        ]);
        assert.equal(
          Number(
            (
              await db.query(
                "select unit_cost from proposal_items where proposal_id=$1",
                [proposal],
              )
            ).rows[0].unit_cost,
          ),
          150,
        );
        await as(otherStaff);
        await rejected("select replace_proposal_items($1,$2)", [
          proposal,
          "[]",
        ]);
        await as(staff);
      },
    );
    await t.test(
      "conversion is atomic and repeat conversion is idempotent",
      async () => {
        const converted = (
          await db.query("select convert_lead($1) as id", [lead])
        ).rows[0].id;
        assert.equal(
          (await db.query("select convert_lead($1) as id", [lead])).rows[0].id,
          converted,
        );
        assert.equal(
          (await db.query("select status from leads where id=$1", [lead]))
            .rows[0].status,
          "WON",
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int as count from activities where lead_id=$1 and kind='STATUS'",
              [lead],
            )
          ).rows[0].count,
          1,
        );
      },
    );
    await t.test(
      "private storage authorizes only accessible metadata and parent",
      async () => {
        const file = "60000000-0000-4000-8000-000000000001",
          path = org + "/" + file;
        await db.query(
          "insert into attachments(id,organization_id,name,customer_id,storage_path,mime_type,size_bytes,assigned_to) values($1,$2,$3,$4,$5,$6,$7,$8)",
          [file, org, "file.pdf", customer, path, "application/pdf", 20, staff],
        );
        await db.query(
          "insert into storage.objects(bucket_id,name) values($1,$2)",
          ["crm-files", path],
        );
        await db.query("update attachments set uploaded=true where id=$1", [
          file,
        ]);
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          1,
        );
        await as(otherStaff);
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          0,
        );
        await rejected(
          "insert into storage.objects(bucket_id,name) values($1,$2)",
          ["crm-files", path],
        );
      },
    );
    await t.test(
      "admin sees tenant records but cannot change privileged roles",
      async () => {
        await as(admin);
        assert.equal(
          (await db.query("select count(*)::int as count from leads")).rows[0]
            .count,
          2,
        );
        await rejected("select manage_staff($1,$2,true)", [
          staff,
          "SUPER_ADMIN",
        ]);
        await rejected("select manage_staff($1,$2,false)", [
          superAdmin,
          "SUPER_ADMIN",
        ]);
        assert.equal(
          (await db.query("select * from audit_logs")).rows.length,
          0,
        );
      },
    );
    await t.test(
      "Super Admin protects last active administrator and logs staff changes",
      async () => {
        await as(superAdmin);
        await rejected("select manage_staff($1,$2,false)", [
          superAdmin,
          "SUPER_ADMIN",
        ]);
        await db.query("select manage_staff($1,$2,false)", [
          otherStaff,
          "STAFF",
        ]);
        const events = (
          await db.query(
            "select * from audit_logs where action='MEMBER_UPDATE'",
          )
        ).rows;
        assert.equal(events.length, 1);
        await rejected("delete from audit_logs");
      },
    );
    await t.test(
      "deactivated users lose RLS access and cannot mutate",
      async () => {
        await as(otherStaff);
        assert.equal((await db.query("select * from leads")).rows.length, 0);
        await rejected(
          "insert into tasks(organization_id,name,assigned_to) values($1,$2,$3)",
          [org, "Blocked", otherStaff],
        );
      },
    );
    await t.test(
      "verified MFA factor requires aal2 for direct database access",
      async () => {
        await db.exec("reset role");
        await db.query(
          "insert into auth.mfa_factors(user_id,status) values($1,$2)",
          [staff, "verified"],
        );
        await as(staff);
        assert.equal((await db.query("select * from leads")).rows.length, 0);
        await as(staff, "authenticated", "aal2");
        assert.equal((await db.query("select * from leads")).rows.length, 1);
      },
    );
    await t.test(
      "invitation role comes from server record, never user metadata",
      async () => {
        await as(admin);
        await rejected("select invite_staff($1,$2,$3)", [
          "new@example.test",
          "New",
          "ADMIN",
        ]);
        await db.query("select invite_staff($1,$2,$3)", [
          "new@example.test",
          "New",
          "STAFF",
        ]);
        await db.exec("reset role");
        const newId = "20000000-0000-4000-8000-000000000006";
        await db.query("insert into auth.users(id,email) values($1,$2)", [
          newId,
          "new@example.test",
        ]);
        assert.equal(
          (await db.query("select role from profiles where id=$1", [newId]))
            .rows[0].role,
          "STAFF",
        );
      },
    );
    await t.test(
      "server-only ingestion persists enquiries and limits repeats",
      async () => {
        await as(null, "service_role");
        const input = {
          name: "Website enquiry",
          email: "Visitor@Example.test",
          message: "Please automate my business reports.",
        };
        for (let i = 0; i < 5; i++)
          await db.query("select submit_public_lead($1,$2,$3)", [
            org,
            JSON.stringify(input),
            "hashed-identifier",
          ]);
        await rejected("select submit_public_lead($1,$2,$3)", [
          org,
          JSON.stringify(input),
          "hashed-identifier",
        ]);
        await db.exec("reset role");
        assert.equal(
          (
            await db.query(
              "select count(*)::int as count from leads where email='visitor@example.test'",
            )
          ).rows[0].count,
          5,
        );
      },
    );
    await t.test("blog RLS: public visibility, manager writes, tenant boundaries, MFA and unpublish", async () => {
      await db.exec("reset role");
      // Isolate blog checks from the profile changes exercised above.
      await db.query("update profiles set active=true where id in ($1,$2,$3)", [superAdmin, admin, staff]);
      await db.query("delete from auth.mfa_factors where user_id in ($1,$2)", [admin, superAdmin]);
      const seed = (await readFile(new URL("../../supabase/seeds/blog.sql", import.meta.url), "utf8")).replace("REPLACE_WITH_SANCTUM_ORGANIZATION_UUID", org);
      await db.exec(seed);
      await db.exec(seed); // Re-running the seed must preserve existing articles.
      assert.equal((await db.query("select id from blog_posts where status='draft'")).rows.length, 3);
      const draft = "a1000000-0000-4000-8000-000000000011";
      const published = "a1000000-0000-4000-8000-000000000012";
      const future = "a1000000-0000-4000-8000-000000000013";
      for (const [id, slug, status, date] of [[draft, "draft-example", "draft", null], [published, "published-example", "published", "2026-01-01"], [future, "future-example", "published", "2099-01-01"]]) {
        await db.query("insert into blog_posts(id,organization_id,title,slug,excerpt,content,author,category,status,published_at) values($1,$2,'Example article',$3,$4,$5,'Sanctum AI','Custom AI',$6,$7)", [id,org,slug,"An educational article excerpt for testing.","A useful paragraph. ".repeat(20),status,date]);
      }
      await as(null, "anon");
      assert.deepEqual((await db.query("select id from blog_posts")).rows.map(r=>r.id), [published]);
      await rejected("update blog_posts set status='published' where id=$1", [draft]);
      await as(staff);
      assert.equal((await db.query("select id from blog_posts where id=$1", [draft])).rows.length, 0);
      assert.equal((await db.query("update blog_posts set status='published' where id=$1 returning id", [published])).rows.length, 0);
      await rejected("insert into blog_posts(organization_id,title,slug,excerpt,content,author,category) values($1,'Staff draft','staff-draft',$2,$3,'Staff','Automation')", [org,"An educational article excerpt for testing.","test ".repeat(30)]);
      await as(admin);
      assert.equal((await db.query("select id from blog_posts")).rows.length, 6);
      await db.query("update blog_posts set status='published' where id=$1", [draft]);
      assert.ok((await db.query("select published_at from blog_posts where id=$1", [draft])).rows[0].published_at);
      await rejected("update blog_posts set organization_id=$1 where id=$2", [otherOrg,draft]);
      await as(outsider);
      assert.equal((await db.query("update blog_posts set title='Other tenant change' where id=$1 returning id", [draft])).rows.length, 0);
      await as(superAdmin);
      await db.query("update blog_posts set status='draft' where id=$1", [draft]);
      await db.exec("reset role");
      await db.query("insert into auth.mfa_factors(user_id,status) values($1,'verified')", [admin]);
      await as(admin, "authenticated", "aal1");
      assert.equal((await db.query("select id from blog_posts where id=$1", [draft])).rows.length, 0);
      assert.equal((await db.query("update blog_posts set status='published' where id=$1 returning id", [draft])).rows.length, 0);
      await as(admin, "authenticated", "aal2");
      assert.equal((await db.query("select id from blog_posts where id=$1", [draft])).rows.length, 1);
      await as(null, "anon");
      assert.deepEqual((await db.query("select id from blog_posts")).rows.map(r=>r.id), [published]);
      await db.exec("reset role");
      assert.ok((await db.query("select id from audit_logs where entity_type='blog_posts'")).rows.length >= 5);
    });
  } finally {
    await db.close();
  }
});
