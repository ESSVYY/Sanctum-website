import Link from "next/link";
import { requireIdentity } from "@/lib/auth/session";
import { CrmShell } from "@/components/crm/shell";
import { markNotification } from "@/app/admin/crm-actions";
import { requestTimestamp } from "@/lib/crm/data";
type Metrics = {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  won_leads: number;
  active_customers: number;
  pipeline_value: number;
  open_deals: number;
  overdue_tasks: number;
  proposals_sent: number;
  proposals_accepted: number;
  stages: { status: string; count: number }[];
  workload: { full_name: string; email: string; count: number }[];
};
export default async function Dashboard() {
  const { db, profile } = await requireIdentity();
  const now = await requestTimestamp();
  const [
    { data, error },
    { data: notifications, error: notificationError },
    { data: tasks, error: taskError },
  ] = await Promise.all([
    db.rpc("crm_metrics"),
    db
      .from("notifications")
      .select("id,title,href,created_at")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("tasks")
      .select("id,name,due_at")
      .neq("status", "DONE")
      .is("archived_at", null)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(5),
  ]);
  if (error || notificationError || taskError || !data)
    throw new Error("Unable to load dashboard metrics.");
  const m = data as Metrics;
  const cards = [
    ["Total leads", m.total_leads],
    ["New leads", m.new_leads],
    ["Qualified leads", m.qualified_leads],
    [
      "Lead conversion",
      m.total_leads
        ? `${((m.won_leads / m.total_leads) * 100).toFixed(1)}%`
        : "—",
    ],
    ["Active customers", m.active_customers],
    [
      "Pipeline value",
      new Intl.NumberFormat("en-NZ", {
        style: "currency",
        currency: "NZD",
        maximumFractionDigits: 0,
      }).format(m.pipeline_value),
    ],
    ["Open deals", m.open_deals],
    ["Overdue tasks", m.overdue_tasks],
    ["Proposals sent", m.proposals_sent],
    ["Proposals accepted", m.proposals_accepted],
  ];
  const max = Math.max(1, ...m.stages.map((s) => s.count));
  return (
    <CrmShell profile={profile} current="dashboard">
      <p className="crm-eyebrow">WORKSPACE OVERVIEW</p>
      <h1>Your business, in focus</h1>
      <p className="crm-subtitle">
        Live database totals for records you can access. Conversion = won leads
        / total leads.
      </p>
      <div className="crm-kpis">
        {cards.map(([label, value]) => (
          <div className="crm-kpi" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {!m.total_leads && !m.active_customers && (
        <p className="crm-empty">
          Your workspace is ready for its first records.{" "}
          <Link href="/admin/leads/new">Add a lead</Link> or collect an enquiry
          from the website.
        </p>
      )}
      <div className="crm-split">
        <section className="crm-panel">
          <h2>Leads by stage</h2>
          {m.stages.length ? (
            <div className="crm-chart">
              {["NEW", "QUALIFIED", "MEETING", "PROPOSAL", "WON", "LOST"].map(
                (status) => {
                  const count =
                    m.stages.find((s) => s.status === status)?.count ?? 0;
                  return (
                    <div key={status}>
                      <span>{status}</span>
                      <div className="crm-chart-track">
                        <span style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <p>No lead stages to chart yet.</p>
          )}
        </section>
        <section className="crm-panel">
          <h2>Staff task workload</h2>
          {m.workload.length ? (
            <ul className="crm-list">
              {m.workload.map((w) => (
                <li key={w.email}>
                  {w.full_name || w.email} <strong>{w.count} open tasks</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No assigned open tasks in your accessible records.</p>
          )}
        </section>
      </div>
      <div className="crm-split">
        <section className="crm-panel">
          <h2>Upcoming follow-ups</h2>
          {tasks?.length ? (
            <ul className="crm-list">
              {tasks.map((t) => (
                <li key={t.id}>
                  <Link href={"/admin/tasks/" + t.id}>{t.name}</Link>
                  <br />
                  <small
                    className={
                      t.due_at && Date.parse(t.due_at) < now
                        ? "crm-overdue"
                        : ""
                    }
                  >
                    {t.due_at
                      ? new Date(t.due_at).toLocaleString("en-NZ", {
                          timeZone: "Pacific/Auckland",
                        })
                      : "No due date"}
                    {t.due_at && Date.parse(t.due_at) < now ? " · Overdue" : ""}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming tasks.</p>
          )}
        </section>
        <section className="crm-panel">
          <h2>Notifications</h2>
          {notifications?.length ? (
            <ul className="crm-list">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link href={n.href}>{n.title}</Link>
                  <form action={markNotification.bind(null, n.id)}>
                    <button>Mark read</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p>You’re all caught up. Task assignments appear here.</p>
          )}
        </section>
      </div>
    </CrmShell>
  );
}
