"use client";
import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  saveRecord,
  convertLead,
  archiveRecord,
  type MutationState,
} from "@/app/admin/crm-actions";
import { definitions, type Entity, type Row } from "@/lib/crm/schema";
export function RecordForm({
  entity,
  record,
  options,
  manager,
  self,
}: {
  entity: Entity;
  record?: Row;
  options: Record<string, { id: string; label: string }[]>;
  manager: boolean;
  self: string;
}) {
  const [state, action, pending] = useActionState<MutationState, FormData>(
    saveRecord.bind(null, entity, record ? String(record.id) : null),
    {},
  );
  const announced = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error || state.message) announced.current?.focus();
  }, [state]);
  return (
    <form action={action} className="crm-form">
      <div className="crm-form-grid">
        {definitions[entity].fields
          .filter((f) => manager || f.key !== "assigned_to")
          .map((f) => {
            const raw = record?.[f.key];
            const value =
              raw == null
                ? f.key === "assigned_to"
                  ? self
                  : f.key === "currency"
                    ? "NZD"
                    : (f.options?.[0] ?? "")
                : f.type === "datetime-local"
                  ? new Date(String(raw)).toISOString().slice(0, 16)
                  : String(raw);
            return (
              <label
                key={f.key}
                className={f.type === "textarea" ? "crm-wide" : ""}
              >
                {f.label}
                {f.required ? " *" : ""}
                {f.relation || f.options ? (
                  <select
                    name={f.key}
                    required={f.required}
                    defaultValue={value}
                  >
                    {f.relation && <option value="">Unassigned / none</option>}
                    {f.options?.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                    {f.relation &&
                      options[f.relation]?.map((o) => (
                        <option value={o.id} key={o.id}>
                          {o.label}
                        </option>
                      ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    name={f.key}
                    defaultValue={value}
                    required={f.required}
                    maxLength={5000}
                  />
                ) : (
                  <input
                    name={f.key}
                    type={f.type ?? "text"}
                    defaultValue={value}
                    required={f.required}
                    maxLength={f.type === "email" ? 254 : 200}
                    min={f.min}
                    max={f.max}
                    step={
                      f.type === "number"
                        ? f.key === "probability"
                          ? "1"
                          : "0.01"
                        : undefined
                    }
                  />
                )}
              </label>
            );
          })}
      </div>
      {definitions[entity].fields.some((f) => f.type === "datetime-local") && (
        <p className="crm-detail-meta">Date and time inputs use UTC.</p>
      )}
      <div className="crm-actions">
        <button
          className="crm-primary"
          disabled={pending || (!record && !!state.id)}
        >
          {pending ? "Saving…" : "Save record"}
        </button>
        <Link href={"/admin/" + definitions[entity].path}>
          Back to {definitions[entity].title.toLowerCase()}
        </Link>
      </div>
      <p
        ref={announced}
        tabIndex={-1}
        role={state.error ? "alert" : "status"}
        className={state.error ? "crm-error" : "crm-notice"}
        hidden={!state.error && !state.message}
      >
        {state.error || state.message}
        {!record && state.id && (
          <>
            {" "}
            <Link href={"/admin/" + definitions[entity].path + "/" + state.id}>
              Open saved record
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
export function ConvertLead({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    convertLead.bind(null, id),
    {},
  );
  return (
    <form action={action}>
      <button disabled={pending}>Convert to customer</button>
      {state.error && (
        <p role="alert" className="crm-error">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status">
          {state.message}{" "}
          <Link href={"/admin/customers/" + state.id}>Open customer</Link>
        </p>
      )}
    </form>
  );
}
export function ArchiveButton({
  entity,
  id,
  archived,
}: {
  entity: Entity;
  id: string;
  archived: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="crm-danger"
        onClick={() => dialog.current?.showModal()}
      >
        {archived ? "Restore record" : "Archive record"}
      </button>
      <dialog ref={dialog} aria-labelledby="archive-title">
        <h2 id="archive-title">
          {archived ? "Restore this record?" : "Archive this record?"}
        </h2>
        <p>
          {archived
            ? "The record will return to active lists."
            : "The record stays in the database and moves to archived lists."}
        </p>
        <form
          action={archiveRecord.bind(null, entity, id)}
          onSubmit={() => dialog.current?.close()}
        >
          <input type="hidden" name="restore" value={String(archived)} />
          <div className="crm-actions">
            <button className="crm-danger">Confirm</button>
            <button type="button" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
