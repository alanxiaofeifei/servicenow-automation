#!/usr/bin/env node
import { writeSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entryPoint = resolve(appDir, "src/cli.ts");
const require = createRequire(import.meta.url);
const { require: tsxRequire } = require("tsx/cjs/api");

const { runCli } = tsxRequire(entryPoint, import.meta.url);
const result = await runCli(process.argv.slice(2), { cwd: process.cwd() });

if (result.stdout) {
  writeSync(1, result.stdout);
}
if (result.stderr) {
  writeSync(2, result.stderr);
}

process.exitCode = result.exitCode;
