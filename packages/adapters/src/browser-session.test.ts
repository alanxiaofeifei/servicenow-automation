import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

import { createBrowserSessionService } from "./browser-session";

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
    expect(plan.auditNotes).toContain("Browser automation is a skeleton plan only; no browser is launched by this service yet.");
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
    expect(plan.auditNotes).toContain("Production shadow mode remains read-only; submit, close, and update remain blocked.");
  });
});
