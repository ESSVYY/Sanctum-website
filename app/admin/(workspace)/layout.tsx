import { requireIdentity } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireIdentity();
  return children;
}
