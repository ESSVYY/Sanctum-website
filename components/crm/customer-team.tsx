"use client";
import { useActionState } from "react";
import { saveCustomerTeam } from "@/app/admin/proposal-actions";
export function CustomerTeam({
  id,
  options,
  selected,
}: {
  id: string;
  options: { id: string; label: string }[];
  selected: string[];
}) {
  const [state, action, pending] = useActionState(
    saveCustomerTeam.bind(null, id),
    {},
  );
  return (
    <section className="crm-panel">
      <h2>Assigned customer team</h2>
      <p>
        Team members can access this customer. Related records still require
        their own assignments.
      </p>
      <form className="crm-form" action={action}>
        {options.map((p) => (
          <label key={p.id}>
            <span>
              <input
                type="checkbox"
                name="members"
                value={p.id}
                defaultChecked={selected.includes(p.id)}
              />{" "}
              {p.label}
            </span>
          </label>
        ))}
        <button disabled={pending}>Save team</button>
        {state.error && (
          <p role="alert" className="crm-error">
            {state.error}
          </p>
        )}
        {state.message && <p role="status">{state.message}</p>}
      </form>
    </section>
  );
}
