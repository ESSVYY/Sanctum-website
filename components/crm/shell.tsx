import Link from "next/link";
import { logout } from "@/app/admin/auth-actions";
import { isManager, type Role } from "@/lib/auth/permissions";
const links = [
  ["Overview", "dashboard"],
  ["Leads", "leads"],
  ["Customers", "customers"],
  ["Contacts", "contacts"],
  ["Sales Pipeline", "pipeline"],
  ["Tasks", "tasks"],
  ["Proposals", "proposals"],
  ["Activities", "activities"],
  ["Team Management", "team"],
  ["Insights / Blog", "blog"],
  ["Audit Logs", "audit"],
  ["Settings", "settings"],
];
export function CrmShell({
  children,
  profile,
  current,
}: {
  children: React.ReactNode;
  profile: { full_name: string; email: string; role: Role };
  current: string;
}) {
  return (
    <div className="crm-shell">
      <a className="skip-link" href="#crm-content">
        Skip to content
      </a>
      <aside className="crm-sidebar">
        <Link href="/" className="crm-brand">
          SANCTUM <span>AI</span>
        </Link>
        <p className="crm-eyebrow">BUSINESS WORKSPACE</p>
        <nav aria-label="CRM navigation">
          {links
            .filter(
              ([, path]) =>
                (!["team", "blog"].includes(path) || isManager(profile.role)) &&
                (path !== "audit" || profile.role === "SUPER_ADMIN"),
            )
            .map(([label, path]) => (
              <Link
                key={path}
                href={"/admin/" + path}
                aria-current={current === path ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
        </nav>
        <Link href="/">View website ↗</Link>
      </aside>
      <div className="crm-workspace">
        <header className="crm-header">
          <span className="crm-eyebrow">SANCTUM / CRM</span>
          <details className="crm-profile">
            <summary>{profile.full_name || profile.email}</summary>
            <div>
              <p>{profile.role.replaceAll("_", " ")}</p>
              <Link href="/admin/settings">Account settings</Link>
              <form action={logout}>
                <button>Sign out</button>
              </form>
            </div>
          </details>
        </header>
        <main id="crm-content" className="crm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
