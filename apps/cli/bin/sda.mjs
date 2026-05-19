#!/usr/bin/env node
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tsImport } from "tsx/esm/api";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entryPoint = resolve(appDir, "src/main.ts");

await tsImport(entryPoint, import.meta.url);
