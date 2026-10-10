import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/session";
import { privateJSON, sameOrigin } from "@/lib/http";
import { fileLimit, fileTypes, validFile, uploadSchema } from "@/lib/crm/files";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return privateJSON({ error: "Invalid request origin." }, 403);
  const identity = await getIdentity();
  if (!identity || identity.needsMfa)
    return privateJSON({ error: "Unauthorized" }, 401);
  if (Number(request.headers.get("content-length")) > fileLimit + 65536)
    return privateJSON({ error: "File is too large." }, 413);
  // Content-Length is not trusted: count actual bytes before parsing multipart.
  const reader = request.body?.getReader();
  if (!reader) return privateJSON({ error: "Missing upload." }, 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > fileLimit + 65536) {
      await reader.cancel();
      return privateJSON({ error: "File is too large." }, 413);
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let form: FormData;
  try {
    form = await new Response(body, {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    return privateJSON({ error: "Invalid upload." }, 400);
  }
  const parsed = uploadSchema.safeParse({
    entity: form.get("entity"),
    record_id: form.get("record_id"),
  });
  const file = form.get("file");
  if (
    !parsed.success ||
    !(file instanceof File) ||
    !file.size ||
    file.size > fileLimit ||
    !fileTypes.includes(file.type as (typeof fileTypes)[number])
  )
    return privateJSON(
      { error: "Use a PDF, PNG, JPEG or UTF-8 text file up to 5 MB." },
      400,
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validFile(bytes, file.type))
    return privateJSON(
      { error: "File contents do not match the selected type." },
      400,
    );
  const { db, profile } = identity;
  const { data: parent } = await db
    .from(parsed.data.entity)
    .select("id,archived_at")
    .eq("id", parsed.data.record_id)
    .single();
  if (!parent || parent.archived_at)
    return privateJSON({ error: "Record access denied." }, 403);
  const id = randomUUID();
  const path = `${profile.organization_id}/${id}`;
  const { error } = await db.from("attachments").insert({
    id,
    organization_id: profile.organization_id,
    name: file.name.replace(/[\x00-\x1f]/g, "").slice(0, 200),
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
    assigned_to: profile.id,
    created_by: profile.id,
    [parsed.data.entity === "customers" ? "customer_id" : "proposal_id"]:
      parent.id,
  });
  if (error)
    return privateJSON({ error: "Unable to prepare attachment." }, 403);
  const { error: uploadError } = await db.storage
    .from("crm-files")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError)
    return privateJSON(
      {
        error:
          "Upload failed. Retry with a new upload; incomplete metadata remains available for cleanup.",
      },
      503,
    );
  const { error: metadataError } = await db
    .from("attachments")
    .update({ uploaded: true })
    .eq("id", id);
  if (metadataError)
    return privateJSON(
      {
        error:
          "File uploaded but finalisation failed. Contact an administrator.",
      },
      503,
    );
  return privateJSON({ message: "Attachment uploaded." });
}
export async function GET(request: Request) {
  const identity = await getIdentity();
  if (!identity || identity.needsMfa)
    return privateJSON({ error: "Unauthorized" }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!z.uuid().safeParse(id).success)
    return privateJSON({ error: "Invalid attachment." }, 400);
  const { data } = await identity.db
    .from("attachments")
    .select("storage_path,name,uploaded")
    .eq("id", id)
    .is("archived_at", null)
    .single();
  if (!data?.uploaded)
    return privateJSON({ error: "Attachment unavailable." }, 404);
  const { data: link, error } = await identity.db.storage
    .from("crm-files")
    .createSignedUrl(data.storage_path, 60, { download: data.name });
  if (error || !link)
    return privateJSON({ error: "Download access denied." }, 403);
  return privateJSON({ url: link.signedUrl });
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return privateJSON({ error: "Invalid request origin." }, 403);
  const identity = await getIdentity();
  if (!identity || identity.needsMfa || identity.profile.role === "STAFF")
    return privateJSON({ error: "Forbidden" }, 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!z.uuid().safeParse(id).success)
    return privateJSON({ error: "Invalid attachment." }, 400);
  const { error } = await identity.db
    .from("attachments")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();
  return error
    ? privateJSON({ error: "Unable to archive attachment." }, 403)
    : privateJSON({ message: "Attachment archived." });
}
