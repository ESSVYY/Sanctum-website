import "./crm.css";
export const metadata = { robots: { index: false, follow: false } };
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="crm-root">{children}</div>;
}
