"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function Files({
  entity,
  id,
  files,
  manager,
}: {
  entity: "customers" | "proposals";
  id: string;
  files: { id: string; name: string; size_bytes: number; uploaded: boolean }[];
  manager: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/crm/files", {
        method: "POST",
        body: new FormData(form),
      });
      const data = await response.json();
      setMessage(data.error ?? data.message);
      if (response.ok) {
        form.reset();
        router.refresh();
      }
    } catch {
      setMessage("Upload service is unavailable.");
    } finally {
      setBusy(false);
    }
  }
  async function download(file: string) {
    try {
      const response = await fetch("/api/crm/files?id=" + file);
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setMessage("Download service is unavailable.");
    }
  }
  async function archive(file: string) {
    if (
      !window.confirm(
        "Archive this attachment? Existing signed links expire within 60 seconds.",
      )
    )
      return;
    try {
      const response = await fetch("/api/crm/files?id=" + file, {
        method: "DELETE",
      });
      const data = await response.json();
      setMessage(data.error ?? data.message);
      router.refresh();
    } catch {
      setMessage("Unable to archive file.");
    }
  }
  return (
    <section className="crm-panel">
      <h2>Private attachments</h2>
      <p>
        PDF, PNG, JPEG or UTF-8 text · Up to 5 MB · Downloads use links lasting
        60 seconds.
      </p>
      <form onSubmit={upload} className="crm-form crm-file-form">
        <input type="hidden" name="entity" value={entity} />
        <input type="hidden" name="record_id" value={id} />
        <label>
          Choose file
          <input
            type="file"
            name="file"
            accept="application/pdf,image/png,image/jpeg,text/plain"
            required
          />
        </label>
        <button disabled={busy}>
          {busy ? "Uploading…" : "Upload attachment"}
        </button>
      </form>
      {message && (
        <p role="status" className="crm-notice">
          {message}
        </p>
      )}
      {files.length ? (
        <ul className="crm-list">
          {files.map((file) => (
            <li key={file.id}>
              {file.name} ({Math.ceil(file.size_bytes / 1024)} KB){" "}
              <div className="crm-actions">
                <button
                  onClick={() => download(file.id)}
                  disabled={!file.uploaded}
                >
                  {file.uploaded ? "Download" : "Incomplete upload"}
                </button>
                {manager && (
                  <button onClick={() => archive(file.id)}>Archive</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No attachments yet.</p>
      )}
    </section>
  );
}
