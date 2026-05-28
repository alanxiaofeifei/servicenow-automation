import { existsSync } from "node:fs";
import { join } from "node:path";

export type PathExists = (candidate: string) => boolean;

export function resolveElectronPreloadPath(mainDir: string, pathExists: PathExists = existsSync): string {
  const currentElectronViteOutput = join(mainDir, "../preload/preload.mjs");
  const legacyCommonJsOutput = join(mainDir, "../preload/preload.cjs");

  if (pathExists(currentElectronViteOutput)) {
    return currentElectronViteOutput;
  }

  if (pathExists(legacyCommonJsOutput)) {
    return legacyCommonJsOutput;
  }

  return currentElectronViteOutput;
}
