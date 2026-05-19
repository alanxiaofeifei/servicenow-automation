import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

import {
  classifyWindowsBrowserRuntimePath,
  createBrowserSessionService,
  validateWindowsDedicatedChromiumRuntime,
  validateWindowsToolOwnedProfileRoot
} from "./browser-session";

describe("BrowserSessionService", () => {
  it("builds a QA controlled-browser launch plan with manual login and ignored runtime storage", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-session-"));
    const service = createBrowserSessionService({ projectRoot });

    const plan = service.createLaunchPlan(getServiceNowEnvironmentConfig("qa"));

    expect(plan.status).toBe("ready");
    expect(plan.mode).toBe("qa");
    expect(plan.targetUrl).toContain("https://yageoqa.service-now.com");
    expect(plan.browserProfileDirectory).toBe(resolve(projectRoot, ".local/servicenow-browser-profiles/qa"));
    expect(plan.actions).toEqual(["open-controlled-browser", "wait-for-manual-login", "capture-page-context-only"]);
    expect(plan.safety.manualLoginRequired).toBe(true);
    expect(plan.safety.credentialsStoredInSource).toBe(false);
    expect(plan.safety.realSubmitAllowed).toBe(false);
    expect(plan.safety.requiresAlanApprovalBeforeAnyRealSubmit).toBe(true);
    expect(plan.safety.browserAutomationImplemented).toBe(false);
    expect(plan.auditNotes).toContain("Browser launch is no-write only; no DOM automation, field fill, submit, update, save, close, upload, or email action is performed.");
  });

  it("creates and resets only the ignored browser profile directory", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-reset-"));
    const service = createBrowserSessionService({ projectRoot });
    const qaConfig = getServiceNowEnvironmentConfig("qa");

    const profileDir = await service.ensureBrowserProfileDirectory(qaConfig);
    const marker = join(profileDir, "session-marker.txt");
    await writeFile(marker, "runtime session placeholder", "utf8");

    const reset = await service.resetSession(qaConfig);

    expect(reset.deletedDirectory).toBe(profileDir);
    expect(reset.recreatedDirectory).toBe(profileDir);
    expect(reset.deletedDirectory).toContain(".local/servicenow-browser-profiles/qa");
    await expect(readFile(marker, "utf8")).rejects.toThrow();
  });

  it("does not create browser work for mock mode", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-mock-"));
    const service = createBrowserSessionService({ projectRoot });

    const plan = service.createLaunchPlan(getServiceNowEnvironmentConfig("mock"));

    expect(plan.status).toBe("not-required");
    expect(plan.actions).toEqual([]);
    expect(plan.targetUrl).toBeUndefined();
    expect(plan.safety.manualLoginRequired).toBe(false);
    expect(plan.safety.realSubmitAllowed).toBe(false);
    expect(plan.auditNotes).toContain("Mock mode uses offline demo data and does not need a browser session.");
  });

  it("blocks credential-bearing target URL overrides without echoing the raw URL", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-credential-url-"));
    const service = createBrowserSessionService({ projectRoot });
    const qaHost = new URL(getServiceNowEnvironmentConfig("qa").url ?? "").host;

    const plan = service.createLaunchPlan(getServiceNowEnvironmentConfig("qa"), {
      targetUrlOverride: `https://user:pass@${qaHost}/nav_to.do`
    });

    expect(plan.status).toBe("blocked");
    expect(plan.targetUrl).toBeUndefined();
    expect(plan.targetValidation).toMatchObject({
      allowed: false,
      reason: "credentials-in-url-denied",
      host: qaHost
    });
    expect(JSON.stringify(plan)).not.toContain("user:");
    expect(JSON.stringify(plan)).not.toContain("@");
  });

  it("does not echo credential-bearing overrides for no-allowlist or non-HTTPS failures", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-credential-blocked-"));
    const service = createBrowserSessionService({ projectRoot });
    const qaHost = new URL(getServiceNowEnvironmentConfig("qa").url ?? "").host;

    const devPlan = service.createLaunchPlan(getServiceNowEnvironmentConfig("dev"), {
      targetUrlOverride: "https://user:pass@dev-example.service-now.com/nav_to.do"
    });
    const productionShadowPlan = service.createLaunchPlan(getServiceNowEnvironmentConfig("production-shadow"), {
      targetUrlOverride: "https://user:pass@prod-example.service-now.com/nav_to.do"
    });
    const httpPlan = service.createLaunchPlan(getServiceNowEnvironmentConfig("qa"), {
      targetUrlOverride: `http://user:pass@${qaHost}/nav_to.do`
    });

    for (const plan of [devPlan, productionShadowPlan, httpPlan]) {
      expect(plan.status).toBe("blocked");
      expect(plan.targetUrl).toBeUndefined();
      expect(JSON.stringify(plan)).not.toContain("user:");
      expect(JSON.stringify(plan)).not.toContain("@");
    }
  });

  it("blocks dev mode until an allowlisted URL is configured", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-dev-"));
    const service = createBrowserSessionService({ projectRoot });

    const blockedPlan = service.createLaunchPlan(getServiceNowEnvironmentConfig("dev"));
    const overridePlan = service.createLaunchPlan(getServiceNowEnvironmentConfig("dev"), {
      targetUrlOverride: "https://dev-example.service-now.com/nav_to.do"
    });

    expect(blockedPlan.status).toBe("blocked");
    expect(blockedPlan.blockedReason).toBe("No allowlisted ServiceNow host configured for this environment.");
    expect(overridePlan.status).toBe("blocked");
    expect(overridePlan.blockedReason).toBe("Target URL is not allowlisted for this environment.");
    expect(overridePlan.targetValidation).toMatchObject({
      allowed: false,
      reason: "no-allowlisted-host"
    });
  });

  it("blocks production shadow URL overrides until a production shadow host is allowlisted", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-prod-"));
    const service = createBrowserSessionService({ projectRoot });

    const plan = service.createLaunchPlan(getServiceNowEnvironmentConfig("production-shadow"), {
      targetUrlOverride: "https://prod-example.service-now.com/nav_to.do"
    });

    expect(plan.status).toBe("blocked");
    expect(plan.mode).toBe("production-shadow");
    expect(plan.blockedReason).toBe("Target URL is not allowlisted for this environment.");
    expect(plan.safety.shadowOnly).toBe(true);
    expect(plan.safety.realSubmitAllowed).toBe(false);
    expect(plan.safety.writeOperationsAllowed).toBe(false);
    expect(plan.actions).toEqual([]);
    expect(plan.auditNotes).toContain("Production shadow mode remains read-only; submit, close, update, and save remain blocked.");
  });

  it("prepares a no-write QA launch command without executing a browser by default", async () => {
    const launchedCommands: unknown[] = [];
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-launch-dry-run-"));
    const service = createBrowserSessionService({
      projectRoot,
      browserExecutablePath: "/usr/bin/chromium",
      browserLauncher: async (command) => {
        launchedCommands.push(command);
        return { pid: 12345 };
      }
    });

    const result = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"));

    expect(result.status).toBe("dry-run");
    expect(launchedCommands).toEqual([]);
    expect(result.plan.status).toBe("ready");
    const qaTargetPath = new URL(getServiceNowEnvironmentConfig("qa").url ?? "").pathname;
    expect(result.commandPreview).toMatchObject({
      executable: "/usr/bin/chromium",
      targetHost: new URL(getServiceNowEnvironmentConfig("qa").url ?? "").host,
      targetPath: qaTargetPath
    });
    expect(result.commandPreview?.args).toContain("--new-window");
    expect(result.safety).toMatchObject({
      noWriteMode: true,
      formAutomationAllowed: false,
      writeOperationsAllowed: false,
      realServiceNowApiCalled: false,
      realActionGateRequiredForWrites: true
    });
    expect(JSON.stringify(result)).not.toContain("save_incident allowed");
  });

  it("blocks Windows browser executables from WSL/Linux until profile isolation is verified", async () => {
    const launchedCommands: unknown[] = [];
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-windows-exe-blocked-"));
    const windowsBrowserPaths = [
      "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
      "/mnt//c/Program Files/Google/Chrome/Application/chrome.exe",
      "/mnt/./c/Program Files/Google/Chrome/Application/chrome.exe",
      "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.EXE  ",
      "/mnt/c/tools/chrome-wrapper",
      "/mnt//c/tools/chrome-wrapper",
      "//mnt/c/tools/chrome-wrapper",
      "/mnt/./c/tools/chrome-wrapper"
    ];

    for (const browserExecutablePath of windowsBrowserPaths) {
      const service = createBrowserSessionService({
        projectRoot,
        browserExecutablePath,
        browserLauncher: async (command) => {
          launchedCommands.push(command);
          return { pid: 24680 };
        }
      });

      const dryRun = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"));
      const execute = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"), {
        execute: true,
        confirmNoWriteLaunch: true
      });

      for (const result of [dryRun, execute]) {
        expect(result.status).toBe("blocked");
        expect(result.plan.status).toBe("blocked");
        expect(result.blockedReason).toBe("Windows browser executable requires a verified Windows-compatible isolated profile path before launch.");
        expect(result.commandPreview).toBeUndefined();
        expect(result.profileIsolation).toMatchObject({
          status: "blocked",
          reason: "Windows browser executable requires a verified Windows-compatible isolated profile path before launch."
        });
        expect(result.auditNotes).toContain("Profile isolation strategy must be implemented before launching a Windows browser executable from WSL.");
      }
    }
    expect(launchedCommands).toEqual([]);
  });

  it("classifies daily installed Windows Chrome and Edge paths as blocked product runtimes", () => {
    const dailyBrowserPaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe",
      "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe",
      "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe",
      "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
    ];

    for (const browserExecutablePath of dailyBrowserPaths) {
      expect(classifyWindowsBrowserRuntimePath(browserExecutablePath)).toMatchObject({
        status: "blocked",
        reason: "daily-installed-browser-runtime-denied"
      });
    }
  });

  it("classifies only tool-owned Windows Chromium runtime paths as allowed candidates", () => {
    expect(
      classifyWindowsBrowserRuntimePath("%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\chrome.exe")
    ).toMatchObject({
      status: "allowed",
      reason: "tool-owned-dedicated-chromium-runtime"
    });

    expect(
      classifyWindowsBrowserRuntimePath("%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\msedge.exe")
    ).toMatchObject({
      status: "blocked",
      reason: "not-tool-owned-dedicated-chromium-runtime"
    });

    expect(
      classifyWindowsBrowserRuntimePath("%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\ChromiumEvil\\chrome.exe")
    ).toMatchObject({
      status: "blocked",
      reason: "not-tool-owned-dedicated-chromium-runtime"
    });

    expect(classifyWindowsBrowserRuntimePath("%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe"))
      .toMatchObject({
        status: "blocked",
        reason: "not-tool-owned-dedicated-chromium-runtime"
      });

    expect(
      classifyWindowsBrowserRuntimePath("%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\..\\Chromium\\chrome.exe")
    ).toMatchObject({
      status: "blocked",
      reason: "parent-traversal-denied"
    });
  });

  it("validates Windows dedicated Chromium only when paired with a tool-owned disposable profile root", () => {
    const browserExecutablePath = "%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\chrome.exe";

    expect(
      validateWindowsDedicatedChromiumRuntime({
        browserExecutablePath,
        profileDirectory: "%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\qa\\session-123"
      })
    ).toMatchObject({ status: "verified" });

    expect(
      validateWindowsDedicatedChromiumRuntime({
        browserExecutablePath,
        profileDirectory: "%LOCALAPPDATA%\\Google\\Chrome\\User Data"
      })
    ).toMatchObject({
      status: "blocked",
      reason: "Windows dedicated Chromium runtime requires a tool-owned disposable profile root."
    });
  });

  it("validates Windows cleanup profile roots and blocks daily profiles or traversal", () => {
    expect(validateWindowsToolOwnedProfileRoot("%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\qa\\session-123"))
      .toMatchObject({
        status: "allowed",
        reason: "tool-owned-disposable-profile-root"
      });

    expect(validateWindowsToolOwnedProfileRoot("%LOCALAPPDATA%\\Google\\Chrome\\User Data")).toMatchObject({
      status: "blocked",
      reason: "daily-browser-profile-root-denied"
    });
    expect(validateWindowsToolOwnedProfileRoot("%LOCALAPPDATA%\\Microsoft\\Edge\\User Data")).toMatchObject({
      status: "blocked",
      reason: "daily-browser-profile-root-denied"
    });
    expect(validateWindowsToolOwnedProfileRoot("%APPDATA%\\Mozilla\\Firefox\\Profiles")).toMatchObject({
      status: "blocked",
      reason: "daily-browser-profile-root-denied"
    });
    expect(validateWindowsToolOwnedProfileRoot("ServiceNowAutomation\\Profiles\\qa\\session-123")).toMatchObject({
      status: "blocked",
      reason: "ambiguous-or-relative-profile-root-denied"
    });
    expect(validateWindowsToolOwnedProfileRoot("%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles")).toMatchObject({
      status: "blocked",
      reason: "not-tool-owned-disposable-profile-root"
    });
    expect(validateWindowsToolOwnedProfileRoot("%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\qa"))
      .toMatchObject({
        status: "blocked",
        reason: "not-tool-owned-disposable-profile-root"
      });
    expect(validateWindowsToolOwnedProfileRoot("%LOCALAPPDATA%\\ServiceNowAutomation\\ProfilesX\\qa\\session-123"))
      .toMatchObject({
        status: "blocked",
        reason: "not-tool-owned-disposable-profile-root"
      });
    expect(
      validateWindowsToolOwnedProfileRoot("%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\qa\\..\\..\\Google")
    ).toMatchObject({
      status: "blocked",
      reason: "parent-traversal-denied"
    });
  });

  it("refuses reset when an environment runtime directory escapes the tool-owned project profile root", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-reset-traversal-"));
    const service = createBrowserSessionService({ projectRoot });
    const qaConfig = getServiceNowEnvironmentConfig("qa");

    await expect(
      service.resetSession({
        ...qaConfig,
        localRuntimeDirectory: "../Google/Chrome/User Data"
      })
    ).rejects.toThrow("Refusing to manage browser session directory outside ignored runtime root");
  });

  it("executes a no-write QA launch only with explicit confirmation", async () => {
    const launchedCommands: unknown[] = [];
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-launch-confirm-"));
    const service = createBrowserSessionService({
      projectRoot,
      browserExecutablePath: "/usr/bin/chromium",
      browserLauncher: async (command) => {
        launchedCommands.push(command);
        return { pid: 67890 };
      }
    });

    const blocked = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"), {
      execute: true
    });
    const launched = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"), {
      execute: true,
      confirmNoWriteLaunch: true
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockedReason).toBe("Explicit --confirm-no-write-launch is required before opening a real QA/dev browser window.");
    expect(launched.status).toBe("launched");
    expect(launched.process).toEqual({ pid: 67890 });
    expect(launchedCommands).toHaveLength(1);
    expect(JSON.stringify(launchedCommands[0])).toContain("--user-data-dir=");
  });

  it("returns a sanitized blocked result when the browser executable cannot start", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-launch-missing-executable-"));
    const service = createBrowserSessionService({
      projectRoot,
      browserExecutablePath: "/definitely/missing/sda-browser"
    });

    const result = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"), {
      execute: true,
      confirmNoWriteLaunch: true
    });
    const serialized = JSON.stringify(result);

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("Browser process could not be started. Check the configured browser executable.");
    expect(result.process).toBeUndefined();
    expect(serialized).not.toContain("sys_id");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("user:");
  });

  it("refuses no-write launch for mock, production-shadow, and sensitive target URLs without echoing secrets", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-browser-launch-blocked-"));
    const service = createBrowserSessionService({ projectRoot, browserExecutablePath: "/usr/bin/chromium" });
    const qaHost = new URL(getServiceNowEnvironmentConfig("qa").url ?? "").host;

    const mock = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("mock"));
    const productionShadow = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("production-shadow"), {
      targetUrlOverride: "https://prod-example.service-now.com/"
    });
    const userinfo = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"), {
      targetUrlOverride: `https://user:***@${qaHost}/nav_to.do`
    });
    const query = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"), {
      targetUrlOverride: `https://${qaHost}/nav_to.do?sys_id=abc123`
    });
    let repeatedEncodedPayload = "?sys_id=abc123";
    for (let index = 0; index < 4; index += 1) {
      repeatedEncodedPayload = encodeURIComponent(repeatedEncodedPayload);
    }
    const repeatedEncoded = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"), {
      targetUrlOverride: `https://${qaHost}/nav_to.do${repeatedEncodedPayload}`
    });
    const encodedCustomerData = await service.launchNoWriteBrowser(getServiceNowEnvironmentConfig("qa"), {
      targetUrlOverride: `https://${qaHost}/nav_to.do%253Fshort_description%253Dcustomer-data`
    });

    expect(mock.status).toBe("not-required");
    expect(productionShadow.status).toBe("blocked");
    expect(productionShadow.blockedReason).toBe("Production shadow browser launch remains blocked until #19 is complete.");
    expect(userinfo.status).toBe("blocked");
    expect(query.status).toBe("blocked");
    expect(repeatedEncoded.status).toBe("blocked");
    expect(encodedCustomerData.status).toBe("blocked");
    expect(query.plan.targetValidation?.reason).toBe("sensitive-url-component-denied");
    expect(repeatedEncoded.plan.targetValidation?.reason).toBe("sensitive-url-component-denied");
    expect(encodedCustomerData.plan.targetValidation?.reason).toBe("sensitive-url-component-denied");

    for (const result of [userinfo, query, repeatedEncoded, encodedCustomerData]) {
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("user:");
      expect(serialized).not.toContain("@");
      expect(serialized).not.toContain("sys_id");
      expect(serialized).not.toContain("token");
      expect(serialized).not.toContain("placeholder");
    }
  });
});
