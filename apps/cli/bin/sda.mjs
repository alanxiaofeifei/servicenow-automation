#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entryPoint = resolve(appDir, "src/main.ts");
const tsxLoader = resolve(appDir, "node_modules/tsx/dist/loader.mjs");
const result = spawnSync(process.execPath, ["--import", tsxLoader, entryPoint, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
