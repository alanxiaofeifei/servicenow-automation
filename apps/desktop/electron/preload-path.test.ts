import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveElectronPreloadPath } from "./preload-path";

describe("resolveElectronPreloadPath", () => {
  const mainDir = join("repo", "apps", "desktop", "out", "main");

  it("prefers the electron-vite preload.mjs output when it exists", () => {
    const preloadPath = resolveElectronPreloadPath(mainDir, (candidate) => candidate.endsWith(join("preload", "preload.mjs")));

    expect(preloadPath).toBe(join("repo", "apps", "desktop", "out", "preload", "preload.mjs"));
  });

  it("falls back to preload.cjs for older packaged builds only when mjs is absent", () => {
    const preloadPath = resolveElectronPreloadPath(mainDir, (candidate) => candidate.endsWith(join("preload", "preload.cjs")));

    expect(preloadPath).toBe(join("repo", "apps", "desktop", "out", "preload", "preload.cjs"));
  });

  it("keeps the current mjs path as the deterministic default", () => {
    const preloadPath = resolveElectronPreloadPath(mainDir, () => false);

    expect(preloadPath).toBe(join("repo", "apps", "desktop", "out", "preload", "preload.mjs"));
  });
});
