import { describe, expect, it } from "vitest";

import { resolveDesktopRuntimePaths, resolveDesktopResourcePath } from "./runtime-paths";

const posixExistsFrom = (existingPaths: string[]) => {
  const normalized = new Set(existingPaths.map((path) => path.replace(/\\/g, "/")));
  return (candidate: string) => normalized.has(candidate.replace(/\\/g, "/"));
};

describe("desktop runtime paths", () => {
  it("uses the nearest workspace root during WSL/dev launches", () => {
    const paths = resolveDesktopRuntimePaths({
      cwd: "/repo/apps/desktop",
      mainDir: "/repo/apps/desktop/out/main",
      isPackaged: false,
      resourcesPath: "/ignored/resources",
      exists: posixExistsFrom(["/repo/pnpm-workspace.yaml"])
    });

    expect(paths.projectRoot).toBe("/repo");
    expect(paths.resourceRoot).toBe("/repo");
    expect(resolveDesktopResourcePath("scripts/windows/evaluate-local-cdp-expression.ps1", paths)).toBe(
      "/repo/scripts/windows/evaluate-local-cdp-expression.ps1"
    );
  });

  it("uses Electron resources for packaged Windows artifacts instead of requiring a source checkout", () => {
    const paths = resolveDesktopRuntimePaths({
      cwd: "/install/ServiceNow Automation",
      mainDir: "/install/ServiceNow Automation/resources/app.asar/out/main",
      isPackaged: true,
      resourcesPath: "/install/ServiceNow Automation/resources",
      exists: posixExistsFrom([])
    });

    expect(paths.projectRoot).toBe("/install/ServiceNow Automation/resources");
    expect(paths.resourceRoot).toBe("/install/ServiceNow Automation/resources");
    expect(resolveDesktopResourcePath("scripts/windows/start-dedicated-chromium-cdp.ps1", paths)).toBe(
      "/install/ServiceNow Automation/resources/scripts/windows/start-dedicated-chromium-cdp.ps1"
    );
  });
});
