export const roles = ["SUPER_ADMIN", "ADMIN", "STAFF"] as const;
export type Role = (typeof roles)[number];
export function isManager(role: Role) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}
export function canManageRole(actor: Role, current: Role, next: Role) {
  return (
    actor === "SUPER_ADMIN" ||
    (actor === "ADMIN" && current === "STAFF" && next === "STAFF")
  );
}
export function safeAdminPath(value: string | null) {
  return value &&
    /^\/admin\/(dashboard|leads|customers|contacts|pipeline|tasks|proposals|activities|team|audit|settings|blog)(\/|\?|$)/.test(
      value,
    ) &&
    !value.includes("\\")
    ? value
    : "/admin/dashboard";
}
