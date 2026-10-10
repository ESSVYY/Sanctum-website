"use client";
import { useState, useActionState } from "react";
import { saveItems } from "@/app/admin/proposal-actions";
type Item = { description: string; quantity: number; unit_cost: number };
export function ProposalItems({
  id,
  items,
  currency,
}: {
  id: string;
  items: Item[];
  currency: string;
}) {
  const [rows, setRows] = useState<Item[]>(items);
  const [state, action, pending] = useActionState(saveItems.bind(null, id), {});
  const update = (index: number, key: keyof Item, value: string) =>
    setRows(
      rows.map((row, i) =>
        i === index
          ? { ...row, [key]: key === "description" ? value : Number(value) }
          : row,
      ),
    );
  return (
    <section className="crm-panel">
      <h2>Proposal line items</h2>
      <form action={action} className="crm-form">
        <input type="hidden" name="items" value={JSON.stringify(rows)} />
        {rows.map((row, index) => (
          <div className="crm-form-grid" key={index}>
            <label>
              Description
              <input
                required
                value={row.description}
                maxLength={1000}
                onChange={(e) => update(index, "description", e.target.value)}
              />
            </label>
            <div className="crm-form-grid">
              <label>
                Quantity
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={row.quantity}
                  onChange={(e) => update(index, "quantity", e.target.value)}
                />
              </label>
              <label>
                Unit cost ({currency})
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.unit_cost}
                  onChange={(e) => update(index, "unit_cost", e.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
            >
              Remove item {index + 1}
            </button>
          </div>
        ))}
        <p>
          Total:{" "}
          <strong>
            {rows
              .reduce((sum, row) => sum + row.quantity * row.unit_cost, 0)
              .toFixed(2)}{" "}
            {currency}
          </strong>
        </p>
        <div className="crm-actions">
          <button
            type="button"
            disabled={rows.length >= 100}
            onClick={() =>
              setRows([...rows, { description: "", quantity: 1, unit_cost: 0 }])
            }
          >
            Add line item
          </button>
          <button className="crm-primary" disabled={pending}>
            Save line items
          </button>
        </div>
        {state.error && (
          <p role="alert" className="crm-error">
            {state.error}
          </p>
        )}
        {state.message && (
          <p role="status" className="crm-notice">
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
