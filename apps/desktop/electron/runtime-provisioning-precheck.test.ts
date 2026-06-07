import { describe, expect, it } from "vitest";

import { checkDedicatedChromiumRuntime, type DedicatedChromiumRuntimeCheckOptions } from "./runtime-provisioning-precheck";

function existsFn(existingPaths: string[]) {
  const normalized = new Set(existingPaths.map((p) => p.replace(/\\/g, "/").toLowerCase()));
  return (candidate: string) => normalized.has(candidate.replace(/\\/g, "/").toLowerCase());
}

function makeOptions(overrides: Partial<DedicatedChromiumRuntimeCheckOptions>): DedicatedChromiumRuntimeCheckOptions {
  return {
    platform: "win32",
    localAppData: "C:\\Users\\testuser\\AppData\\Local",
    exists: existsFn([]), // nothing exists by default
    ...overrides
  };
}

describe("checkDedicatedChromiumRuntime", () => {
  it("returns undefined when runtime chrome.exe exists at tool-owned path", () => {
    const options = makeOptions({
      exists: existsFn(["C:/Users/testuser/AppData/Local/ServiceNowAutomation/Runtime/Chromium/chrome.exe"])
    });
    expect(checkDedicatedChromiumRuntime(options)).toBeUndefined();
  });

  it("returns dedicated-browser-runtime-missing when runtime chrome.exe does not exist", () => {
    const options = makeOptions({
      exists: existsFn([]) // nothing exists
    });
    expect(checkDedicatedChromiumRuntime(options)).toBe("dedicated-browser-runtime-missing");
  });

  it("returns undefined on non-Windows platforms (linux)", () => {
    const options = makeOptions({
      platform: "linux"
    });
    expect(checkDedicatedChromiumRuntime(options)).toBeUndefined();
  });

  it("returns undefined on non-Windows platforms (darwin)", () => {
    const options = makeOptions({
      platform: "darwin"
    });
    expect(checkDedicatedChromiumRuntime(options)).toBeUndefined();
  });

  it("returns undefined when LOCALAPPDATA is not set", () => {
    const options = makeOptions({
      localAppData: undefined
    });
    expect(checkDedicatedChromiumRuntime(options)).toBeUndefined();
  });

  it("returns undefined when runtime exists with mixed-case path on Windows", () => {
    // The function joins path segments and passes to existsSync; the test mock
    // normalizes to lowercase, so mixed-case input should still match.
    const options = makeOptions({
      localAppData: "C:\\Users\\TestUser\\AppData\\Local",
      exists: existsFn(["C:/Users/TestUser/AppData/Local/ServiceNowAutomation/Runtime/Chromium/chrome.exe"])
    });
    expect(checkDedicatedChromiumRuntime(options)).toBeUndefined();
  });

  it("returns dedicated-browser-runtime-missing when only the parent directory exists but not chrome.exe", () => {
    const options = makeOptions({
      exists: existsFn(["C:/Users/testuser/AppData/Local/ServiceNowAutomation/Runtime/Chromium"])
    });
    expect(checkDedicatedChromiumRuntime(options)).toBe("dedicated-browser-runtime-missing");
  });
});
