import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(desktopRoot, "../..");
const desktopPackageJson = JSON.parse(readFileSync(resolve(desktopRoot, "package.json"), "utf8"));
const rootPackageJson = JSON.parse(readFileSync(resolve(workspaceRoot, "package.json"), "utf8"));
const electronViteConfigSource = readFileSync(resolve(desktopRoot, "electron.vite.config.ts"), "utf8");

describe("Windows packaging contract", () => {
  it("exposes a real Windows package script and Electron Builder dependency", () => {
    expect(desktopPackageJson.scripts?.["package:windows"]).toBe("pnpm build && electron-builder --win zip");
    expect(desktopPackageJson.devDependencies?.["electron-builder"]).toBeDefined();
  });

  it("bundles helper resources required by the packaged operator runtime", () => {
    expect(desktopPackageJson.build).toMatchObject({
      appId: "com.servicenowautomation.operator",
      productName: "ServiceNow Automation",
      asar: true,
      directories: {
        output: "dist/windows"
      },
      win: {
        target: ["zip"],
        signAndEditExecutable: false
      }
    });

    expect(desktopPackageJson.build.extraResources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "../../scripts/windows", to: "scripts/windows" }),
        expect.objectContaining({ from: "../../scripts/local-cdp-bridge.py", to: "scripts/local-cdp-bridge.py" })
      ])
    );
  });

  it("bundles internal workspace packages into the Electron main process output", () => {
    expect(electronViteConfigSource).toMatch(
      /main:\s*{[\s\S]*plugins:\s*\[externalizeDepsPlugin\(\{\s*exclude:\s*internalWorkspacePackages\s*}\)\]/
    );
    for (const workspacePackage of [
      "@servicenow-automation/adapters",
      "@servicenow-automation/core",
      "@servicenow-automation/profiles"
    ]) {
      expect(electronViteConfigSource).toContain(workspacePackage);
    }
  });

  it("keeps the root release command delegated to the Windows RC packaging script", () => {
    expect(rootPackageJson.scripts?.["release:windows:rc"]).toBe("bash scripts/packaging/build-windows-rc.sh");
  });
});
