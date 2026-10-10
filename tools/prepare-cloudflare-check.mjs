import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
const root = process.cwd();
const destination = resolve(root, "tools/runtime/cloudflare-isolated");
mkdirSync(destination, { recursive: true });
writeFileSync(join(destination, "next.config.mjs"), "export default {};\n");
for (const name of [
  "app",
  "components",
  "lib",
  "public",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next-env.d.ts",
  "postcss.config.mjs",
  "proxy.ts",
]) {
  cpSync(join(root, name), join(destination, name), { recursive: true });
}
mkdirSync(join(destination, "tools"), { recursive: true });
for (const name of [
  "cloudflare-check.config.ts",
  "cloudflare-check.jsonc",
  "check-cloudflare.mjs",
])
  cpSync(join(root, "tools", name), join(destination, "tools", name));
console.log(
  "Created an isolated compatibility workspace without .env.local: tools/runtime/cloudflare-isolated. Run npm ci there before the compatibility check.",
);
