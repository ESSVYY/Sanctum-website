import { z } from "zod";
export const fileTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
] as const;
export const fileLimit = 5 * 1024 * 1024;
export const uploadSchema = z.object({
  entity: z.enum(["customers", "proposals"]),
  record_id: z.uuid(),
});
export function validFile(bytes: Uint8Array, type: string) {
  if (type === "application/pdf")
    return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "text/plain") {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return !bytes.includes(0);
    } catch {
      return false;
    }
  }
  return false;
}
