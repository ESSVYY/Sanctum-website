import Link from "next/link";
import { requireIdentity } from "@/lib/auth/session";
import { CrmShell } from "@/components/crm/shell";
import { articleDate, type Article } from "@/lib/blog/schema";
export const metadata = {
  title: "Insights / Blog | Sanctum AI",
  robots: { index: false, follow: false },
};
export default async function BlogAdmin() {
  const { db, profile } = await requireIdentity(true);
  const { data, error } = await db
    .from("blog_posts")
    .select("id,title,slug,status,category,updated_at,published_at")
    .eq("organization_id", profile.organization_id)
    .order("updated_at", { ascending: false });
  return (
    <CrmShell profile={profile} current="blog">
      <div className="crm-heading">
        <div>
          <p className="crm-eyebrow">SANCTUM INSIGHTS / EDITORIAL</p>
          <h1>Insights / Blog</h1>
          <p className="crm-subtitle">
            Create, review and publish educational articles.
          </p>
        </div>
        <div className="crm-actions">
          <Link href="/admin/blog/new">New article</Link>
          <Link href="/blog">View public blog ↗</Link>
        </div>
      </div>
      {error ? (
        <p role="alert" className="crm-error">
          Unable to load articles. Apply the blog migration and check your
          database access.
        </p>
      ) : !data?.length ? (
        <p className="crm-empty">
          No articles yet. Create an article or run the optional editorial seed.
        </p>
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Status</th>
                <th>Category</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data as Article[]).map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/blog/${a.id}`}>{a.title}</Link>
                  </td>
                  <td>
                    <span className="crm-badge">{a.status}</span>
                  </td>
                  <td>{a.category}</td>
                  <td>{articleDate(a.updated_at)}</td>
                  <td>
                    <Link href={`/admin/blog/${a.id}/preview`}>Preview</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CrmShell>
  );
}
