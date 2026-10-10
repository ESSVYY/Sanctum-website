import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
// The adapter embeds values from env files in its worker output. Require a clean
// checkout to ensure local secrets never enter a deployable bundle.
const localFiles = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  ".env.development",
  ".env.development.local",
];
if (localFiles.some(existsSync)) {
  console.error(
    "Cloudflare compatibility builds require a clean checkout without local env files. Use the documented clean-checkout procedure.",
  );
  process.exit(1);
}
const child = spawnSync(
  process.execPath,
  [
    "node_modules/@opennextjs/cloudflare/dist/cli/index.js",
    "build",
    "--openNextConfigPath",
    "tools/cloudflare-check.config.ts",
    "--config",
    "tools/cloudflare-check.jsonc",
  ],
  { stdio: "inherit", env: { ...process.env, CI: "true" } },
);
process.exit(child.status ?? 1);
