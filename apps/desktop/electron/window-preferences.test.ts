import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createMainWindowWebPreferences } from "./window-preferences";

describe("createMainWindowWebPreferences", () => {
  it("keeps the packaged preload bridge executable while preserving renderer isolation", () => {
    const mainDir = join("repo", "apps", "desktop", "out", "main");
    const preferences = createMainWindowWebPreferences(mainDir, (candidate) =>
      candidate.endsWith(join("preload", "preload.mjs"))
    );

    expect(preferences).toEqual({
      preload: join("repo", "apps", "desktop", "out", "preload", "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    });
  });
});
