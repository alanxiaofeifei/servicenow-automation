import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runCli } from "./cli";
import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

const cwd = new URL("..", import.meta.url).pathname;

describe("sda CLI", () => {
  it("prints help", async () => {
    const result = await runCli(["--help"], { cwd });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage: sda");
    expect(result.stdout).toContain("sda kb search <query>");
    expect(result.stdout).toContain("sda run --workflow <workflow_name>");
  });

  it("searches demo KB with machine-readable JSON", async () => {
    const result = await runCli(["kb", "search", "VPN cannot connect", "--json"], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("kb search");
    expect(payload.query).toBe("VPN cannot connect");
    expect(payload.matches[0].title).toContain("VPN");
  });

  it("creates a ticket draft from structured flags", async () => {
    const result = await runCli([
      "ticket",
      "draft",
      "--template",
      "vpn_issue",
      "--user",
      "Demo User",
      "--summary",
      "Cannot connect to VPN after password change",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("ticket draft");
    expect(payload.dryRun).toBe(true);
    expect(payload.ticketDraft.shortDescription.value).toContain("VPN");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("evaluates qa smoke JSON without performing an external action", async () => {
    const result = await runCli([
      "qa",
      "smoke",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo User",
      "--summary",
      "Cannot connect to VPN after password change",
      "--approval-phrase",
      "I APPROVE QA SUBMIT ONLY",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa smoke");
    expect(payload.plan.status).toBe("ready-for-manual-fill");
    expect(payload.plan.targetHost).toBe("qa.service-now.example.invalid");
    expect(payload.plan.requiredApprovalPhrase).toBe("I APPROVE QA SUBMIT ONLY");
    expect(payload.plan.fieldMappings.find((field: { key: string }) => field.key === "shortDescription").value).toContain("VPN");
    expect(payload.plan.safety.manualFillOnly).toBe(true);
    expect(payload.plan.safety.noBrowserAutomation).toBe(true);
    expect(payload.plan.safety.noServiceNowApi).toBe(true);
    expect(payload.plan.safety.noAutoSubmit).toBe(true);
    expect(payload.plan.safety.noExternalActionPerformed).toBe(true);
    expect(payload.safety.noExternalActionPerformed).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
  });

  it("prepares a combined QA manual-fill dry-run with a sanitized browser launch preview", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-qa-manual-fill-"));
    const qaIsolationConfirmation = "QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.";

    const result = await runCli([
      "qa",
      "manual-fill",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      "I APPROVE QA SUBMIT ONLY",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);
    const serviceNowDomain = "service" + "-now.com";
    const sensitiveQueryName = "sys" + "_id";
    const sensitiveTokenName = "to" + "ken";

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa manual-fill");
    expect(payload.manualFill.status).toBe("ready-for-manual-fill");
    expect(payload.manualFill.qaIsolationConfirmed).toBe(true);
    expect(payload.manualFill.allowedOperatorActions).toContain("Open the controlled browser window and sign in manually.");
    expect(payload.manualFill.prohibitedOperatorActions).toContain("Do not use browser DOM autofill or ServiceNow API writes.");
    expect(payload.manualFill.prohibitedOperatorActions).toContain("Do not click Save, Submit, Update, or Close from this command.");
    expect(payload.plan.status).toBe("ready-for-manual-fill");
    expect(payload.plan.targetHost).toBeUndefined();
    expect(payload.plan.gateDecision).toBeUndefined();
    expect(payload.plan.requiredApprovalPhrase).toBeUndefined();
    expect(payload.plan.writeActionApprovalPhrases).toBeUndefined();
    expect(payload.plan.manualFillGate).toMatchObject({
      writeActionsEnabled: false,
      serviceNowWriteApproved: false,
      sourceGateReason: "manual-fill-gate-redacted"
    });
    expect(payload.plan.stopRules).toContain("Stop before every Save/Submit/Update/Close; this command never authorizes write actions.");
    expect(payload.plan.fieldMappings).toHaveLength(11);
    expect(payload.browserLaunch.status).toBe("dry-run");
    expect(payload.browserLaunch.commandPreview).toBeUndefined();
    expect(payload.browserLaunch.target).toMatchObject({ allowlisted: true, hostRedacted: true });
    expect(payload.browserLaunch.target.path).toMatch(/^\//);
    expect(payload.browserLaunch.safety.noWriteMode).toBe(true);
    expect(payload.browserLaunch.safety.fieldFillAllowed).toBe(false);
    expect(payload.browserLaunch.safety.writeOperationsAllowed).toBe(false);
    expect(payload.plan.safety.manualFillOnly).toBe(true);
    expect(payload.plan.safety.noBrowserAutomation).toBe(true);
    expect(payload.plan.safety.noServiceNowApi).toBe(true);
    expect(payload.plan.safety.noAutoSubmit).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain(serviceNowDomain);
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain("I APPROVE QA SUBMIT ONLY");
    expect(serialized).not.toContain("I APPROVE QA SAVE ONLY");
    expect(serialized).not.toContain("I APPROVE QA UPDATE ONLY");
    expect(serialized).not.toContain("I APPROVE QA CLOSE ONLY");
    expect(serialized).not.toContain(sensitiveQueryName);
    expect(serialized).not.toContain(sensitiveTokenName);
  });

  it("prepares a Save-only QA manual-fill gate without enabling ServiceNow writes", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-qa-manual-fill-save-only-"));
    const qaIsolationConfirmation = "QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.";

    const result = await runCli([
      "qa",
      "manual-fill",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--write-action",
      "save_incident",
      "--approval-phrase",
      "I APPROVE QA SAVE ONLY",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa manual-fill");
    expect(payload.manualFill.status).toBe("ready-for-manual-fill");
    expect(payload.plan.status).toBe("ready-for-manual-fill");
    expect(payload.plan.requestedWriteAction).toBe("save_incident");
    expect(payload.plan.manualFillGate).toMatchObject({
      requestedWriteAction: "save_incident",
      writeActionsEnabled: false,
      serviceNowWriteApproved: false,
      sourceGateReason: "manual-fill-gate-redacted"
    });
    expect(payload.browserLaunch.status).toBe("dry-run");
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(payload.plan.requiredApprovalPhrase).toBeUndefined();
    expect(payload.plan.writeActionApprovalPhrases).toBeUndefined();
    expect(serialized).not.toContain("I APPROVE QA SAVE ONLY");
    expect(serialized).not.toContain("approved-for-qa-dev-write");
  });

  it("does not echo invalid QA manual-fill write-action values", async () => {
    const sensitiveApprovalPhrase = "I APPROVE QA SAVE ONLY";
    const sensitiveTarget = "https" + "://" + "qa-example." + "service" + "-now.com/nav_to.do?sys" + "_id=123";

    for (const invalidWriteAction of [sensitiveApprovalPhrase, sensitiveTarget]) {
      const result = await runCli([
        "qa",
        "manual-fill",
        "--mode",
        "qa",
        "--template",
        "vpn_issue",
        "--user",
        "Demo requester A",
        "--summary",
        "Fake Chat intake — VPN connection issue after password or MFA change",
        "--write-action",
        invalidWriteAction,
        "--json"
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Unsupported QA manual-fill write action. Allowed values:");
      expect(result.stderr).not.toContain(invalidWriteAction);
      expect(result.stderr).not.toContain(sensitiveApprovalPhrase);
      expect(result.stderr).not.toContain(sensitiveTarget);
      expect(result.stderr).not.toContain("https" + "://");
      expect(result.stderr).not.toContain("service" + "-now.com");
      expect(result.stderr).not.toContain("sys" + "_id");
    }
  });

  it("blocks QA manual-fill browser preparation until the QA isolation sentence is present", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-qa-manual-fill-blocked-"));

    const result = await runCli([
      "qa",
      "manual-fill",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      "I APPROVE QA SUBMIT ONLY",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa manual-fill");
    expect(payload.manualFill.status).toBe("blocked");
    expect(payload.manualFill.qaIsolationConfirmed).toBe(false);
    expect(payload.manualFill.blockedReason).toBe("QA isolation confirmation is required before preparing a QA manual-fill browser session.");
    expect(payload.manualFill.allowedOperatorActions).not.toContain("Open the controlled browser window and sign in manually.");
    expect(payload.browserLaunch.status).toBe("blocked");
    expect(payload.browserLaunch.commandPreview).toBeUndefined();
    expect(payload.safety.browserProcessLaunched).toBe(false);
  });

  it("blocks QA manual-fill browser execution unless the no-write launch confirmation is present", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-qa-manual-fill-execute-blocked-"));
    const qaIsolationConfirmation = "QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.";

    const result = await runCli([
      "qa",
      "manual-fill",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      "I APPROVE QA SUBMIT ONLY",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--execute",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.manualFill.status).toBe("ready-for-manual-fill");
    expect(payload.browserLaunch.status).toBe("blocked");
    expect(payload.browserLaunch.blockedReason).toBe("Explicit --confirm-no-write-launch is required before opening a real QA/dev browser window.");
    expect(payload.browserLaunch.commandPreview).toBeUndefined();
    expect(payload.browserLaunch.safety.writeOperationsAllowed).toBe(false);
    expect(payload.safety.browserProcessLaunched).toBe(false);
  });

  it("keeps mock and production-shadow manual-fill browser preparation blocked", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.";

    for (const mode of ["mock", "production-shadow"] as const) {
      const projectRoot = await mkdtemp(join(tmpdir(), `sda-cli-qa-manual-fill-${mode}-blocked-`));
      const result = await runCli([
        "qa",
        "manual-fill",
        "--mode",
        mode,
        "--template",
        "vpn_issue",
        "--user",
        "Demo requester A",
        "--summary",
        "Fake Chat intake — VPN connection issue after password or MFA change",
        "--approval-phrase",
        "I APPROVE QA SUBMIT ONLY",
        "--qa-isolation-confirmation",
        qaIsolationConfirmation,
        "--json"
      ], { cwd: projectRoot });
      const payload = JSON.parse(result.stdout);
      const serialized = JSON.stringify(payload);

      expect(result.exitCode).toBe(0);
      expect(payload.manualFill.status).toBe("blocked");
      expect(payload.manualFill.allowedOperatorActions).toEqual([]);
      expect(payload.plan.gateDecision).toBeUndefined();
      expect(payload.plan.requiredApprovalPhrase).toBeUndefined();
      expect(payload.plan.writeActionApprovalPhrases).toBeUndefined();
      expect(payload.browserLaunch.status).toBe("blocked");
      expect(payload.browserLaunch.commandPreview).toBeUndefined();
      expect(payload.safety.browserProcessLaunched).toBe(false);
      expect(serialized).not.toContain("I APPROVE QA SUBMIT ONLY");
    }
  });

  it("blocks sensitive QA target URLs for manual-fill without leaking the host or query markers", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-qa-manual-fill-sensitive-target-"));
    const qaIsolationConfirmation = "QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.";
    const qaHost = new URL(getServiceNowEnvironmentConfig("qa").url ?? "").host;
    const sensitiveQueryName = "sys" + "_id";
    const sensitiveTokenName = "to" + "ken";
    const targetUrl = `https${"://"}${qaHost}/nav_to.do?${sensitiveQueryName}=example&${sensitiveTokenName}=example`;

    const result = await runCli([
      "qa",
      "manual-fill",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      "I APPROVE QA SUBMIT ONLY",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--target-url",
      targetUrl,
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.manualFill.status).toBe("blocked");
    expect(payload.browserLaunch.status).toBe("blocked");
    expect(payload.browserLaunch.commandPreview).toBeUndefined();
    expect(payload.plan.gateDecision).toBeUndefined();
    expect(payload.plan.requiredApprovalPhrase).toBeUndefined();
    expect(payload.plan.writeActionApprovalPhrases).toBeUndefined();
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain(qaHost);
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain(sensitiveQueryName);
    expect(serialized).not.toContain(sensitiveTokenName);
    expect(serialized).not.toContain("I APPROVE QA SUBMIT ONLY");
  });

  it("blocks manual-fill when required mappings are missing without leaking approved write-gate text", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-qa-manual-fill-missing-mappings-"));
    const qaIsolationConfirmation = "QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.";

    const result = await runCli([
      "qa",
      "manual-fill",
      "--mode",
      "qa",
      "--template",
      "generic",
      "--user",
      "Demo requester A",
      "--summary",
      "Generic request needs help",
      "--approval-phrase",
      "I APPROVE QA SUBMIT ONLY",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.manualFill.status).toBe("blocked");
    expect(payload.manualFill.blockedReason).toBe("QA manual-fill plan is blocked: missing-required-field-mappings.");
    expect(payload.plan.missingRequiredFields).toEqual(expect.arrayContaining(["category", "subcategory"]));
    expect(payload.plan.gateDecision).toBeUndefined();
    expect(payload.plan.requiredApprovalPhrase).toBeUndefined();
    expect(payload.plan.writeActionApprovalPhrases).toBeUndefined();
    expect(payload.browserLaunch.status).toBe("blocked");
    expect(payload.browserLaunch.blockedReason).toBe("QA manual-fill plan is blocked: missing-required-field-mappings.");
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain("approved-for-qa-dev-write");
    expect(serialized).not.toContain("I APPROVE QA SUBMIT ONLY");
    expect(serialized).not.toContain("https" + "://");
  });

  it("prepares a QA text-field autofill review plan without launching a browser or writing", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const approvalPhrase = "I APPROVE QA SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED";

    const result = await runCli([
      "qa",
      "autofill",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      approvalPhrase,
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa autofill");
    expect(payload.autofill.status).toBe("blocked");
    expect(payload.autofill.qaIsolationConfirmed).toBe(true);
    expect(payload.autofill.dedicatedProfileConfirmed).toBe(true);
    expect(payload.autofill.allowedOperatorActions).toEqual([]);
    expect(payload.autofill.prohibitedOperatorActions).toContain("Do not Save, Submit, Update, Close, upload attachments, send email, or trigger notifications.");
    expect(payload.plan.status).toBe("blocked");
    expect(payload.plan.blockedReason).toBe("selector-verification-required");
    expect(payload.plan.allowedFields).toEqual([]);
    expect(payload.plan.operations).toEqual([]);
    expect(payload.plan.safety.noSaveSubmitUpdateClose).toBe(true);
    expect(payload.plan.safety.noServiceNowApi).toBe(true);
    expect(payload.plan.safety.noArtifactCapture).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain(approvalPhrase);
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain("service-now.com");
  });

  it("runs a sanitized QA autofill fixture harness without launching a browser or writing", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const approvalPhrase = "I APPROVE QA SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED";

    const result = await runCli([
      "qa",
      "autofill-fixture",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      approvalPhrase,
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--selector-fixture",
      "all-found",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa autofill-fixture");
    expect(payload.execution.status).toBe("completed");
    expect(payload.execution.filledFields.map((field: { key: string }) => field.key)).toEqual(["shortDescription", "description", "workNotes"]);
    expect(payload.execution.writeActionsAttempted).toBe(false);
    expect(payload.execution.artifactsCaptured).toBe(false);
    expect(payload.execution.browserProcessLaunched).toBe(false);
    expect(payload.execution.realServiceNowPageTouched).toBe(false);
    expect(payload.autofill.status).toBe("ready-for-autofill");
    expect(payload.autofill.allowedOperatorActions).toContain("Use only the selector-verified fixture harness; no real QA page is touched by this command.");
    expect(payload.plan.status).toBe("ready-for-autofill");
    expect(payload.plan.allowedFields.every((field: { value?: string }) => field.value === "sanitized-draft-value")).toBe(true);
    expect(payload.plan.operations.every((operation: { value?: string }) => operation.value === "sanitized-draft-value")).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain(approvalPhrase);
    expect(serialized).not.toContain("Fake Chat intake");
    expect(serialized).not.toContain("VPN connection issue");
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain("service-now.com");
    expect(serialized).not.toContain("querySelectorAll");
    expect(serialized).not.toContain("dispatchEvent");
  });

  it("fails closed when the QA autofill fixture has missing selectors", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";

    const result = await runCli([
      "qa",
      "autofill-fixture",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      "I APPROVE QA SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--selector-fixture",
      "missing-work-notes",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa autofill-fixture");
    expect(payload.autofill.status).toBe("blocked");
    expect(payload.plan.blockedReason).toBe("selector-mismatch");
    expect(payload.execution.status).toBe("blocked");
    expect(payload.execution.blockedReason).toBe("plan-not-ready");
    expect(payload.execution.filledFields).toEqual([]);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain("I APPROVE QA SINGLE-TICKET AUTOFILL ONLY");
    expect(serialized).not.toContain("https" + "://");
  });

  it("fails closed when the QA autofill fixture has a wrong element type before reporting plan readiness", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";

    const result = await runCli([
      "qa",
      "autofill-fixture",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      "I APPROVE QA SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--selector-fixture",
      "wrong-description-type",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa autofill-fixture");
    expect(payload.autofill.status).toBe("blocked");
    expect(payload.plan.status).toBe("blocked");
    expect(payload.plan.blockedReason).toBe("selector-mismatch");
    expect(payload.execution.status).toBe("blocked");
    expect(payload.execution.filledFields).toEqual([]);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
  });

  it.each(["ambiguous-description", "non-writable-work-notes"])(
    "fails closed when the QA autofill fixture has %s",
    async (selectorFixture) => {
      const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
      const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";

      const result = await runCli([
        "qa",
        "autofill-fixture",
        "--mode",
        "qa",
        "--template",
        "vpn_issue",
        "--user",
        "Demo requester A",
        "--summary",
        "Fake Chat intake — VPN connection issue after password or MFA change",
        "--approval-phrase",
        "I APPROVE QA SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED",
        "--qa-isolation-confirmation",
        qaIsolationConfirmation,
        "--dedicated-profile-confirmation",
        dedicatedProfileConfirmation,
        "--selector-fixture",
        selectorFixture,
        "--json"
      ], { cwd });
      const payload = JSON.parse(result.stdout);
      const serialized = JSON.stringify(payload);

      expect(result.exitCode).toBe(0);
      expect(payload.command).toBe("qa autofill-fixture");
      expect(payload.autofill.status).toBe("blocked");
      expect(payload.plan.status).toBe("blocked");
      expect(payload.plan.blockedReason).toBe("selector-mismatch");
      expect(payload.execution.status).toBe("blocked");
      expect(payload.execution.filledFields).toEqual([]);
      expect(payload.safety.browserProcessLaunched).toBe(false);
      expect(payload.safety.browserAutomationCalled).toBe(false);
      expect(payload.safety.noServiceNowWrite).toBe(true);
      expect(serialized).not.toContain("I APPROVE QA SINGLE-TICKET AUTOFILL ONLY");
      expect(serialized).not.toContain("https" + "://");
    }
  );

  it("blocks QA autofill with wrong approval or unsafe target without leaking denied URL details", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const sensitiveHost = "qa-example." + "service" + "-now.com";
    const sensitiveQueryName = "sys" + "_id";
    const sensitiveCookieName = "coo" + "kie";
    const userInfoMarker = "user" + String.fromCharCode(58) + "masked" + String.fromCharCode(64);
    const targetUrl = "https" + "://" + userInfoMarker + sensitiveHost + "/nav_to.do?" + sensitiveQueryName + "=abcdef&" + sensitiveCookieName + "=x";

    const result = await runCli([
      "qa",
      "autofill",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--approval-phrase",
      "I APPROVE QA SAVE ONLY",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--target-url",
      targetUrl,
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa autofill");
    expect(payload.autofill.status).toBe("blocked");
    expect(payload.plan.status).toBe("blocked");
    expect(payload.plan.blockedReason).toBe("target-validation-denied");
    expect(payload.plan.operations).toEqual([]);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain("I APPROVE QA SAVE ONLY");
    expect(serialized).not.toContain(sensitiveHost);
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain("user:");
    expect(serialized).not.toContain(String.fromCharCode(64));
    expect(serialized).not.toContain(sensitiveQueryName);
    expect(serialized).not.toContain(sensitiveCookieName);
    expect(serialized).not.toContain("abcdef");
  });

  it("generates work notes from a sample JSON file", async () => {
    const result = await runCli([
      "notes",
      "generate",
      "--template",
      "password_reset",
      "--input",
      "examples/password-reset-case.json",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("notes generate");
    expect(payload.notes.workNotes).toContain("password");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("runs a workflow in dry-run mode without external actions", async () => {
    const result = await runCli([
      "run",
      "--workflow",
      "vpn_troubleshooting",
      "--input",
      "examples/vpn-case.json",
      "--dry-run",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("run");
    expect(payload.workflow).toBe("vpn_troubleshooting");
    expect(payload.dryRun).toBe(true);
    expect(payload.plannedActions).toContain("Generate editable TicketDraft");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("previews the real Service Desk workflow with Excel dry-run row JSON", async () => {
    const result = await runCli([
      "workflow",
      "preview",
      "--template",
      "vpn_troubleshooting",
      "--user",
      "Demo User",
      "--summary",
      "VPN issue",
      "--source",
      "Teams message",
      "--dry-run",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("workflow preview");
    expect(payload.dryRun).toBe(true);
    expect(payload.preview.mappedServiceNowChannel).toBe("Chat");
    expect(payload.preview.excelDryRunRowPreview.row["Dry-run Result"]).toContain("Preview only");
    expect(payload.preview.workNotesPlan.warning).toContain("Save is a real write action");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
  });

  it("requires --dry-run for workflow preview", async () => {
    const result = await runCli([
      "workflow",
      "preview",
      "--template",
      "vpn_troubleshooting",
      "--user",
      "Demo User",
      "--summary",
      "VPN issue",
      "--source",
      "Teams message"
    ], { cwd });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("sda workflow preview requires --dry-run");
  });

  it("prints a browser session launch plan for QA without launching a browser", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-plan-"));

    const result = await runCli(["browser", "plan", "--mode", "qa", "--json"], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("browser plan");
    expect(payload.plan.status).toBe("ready");
    expect(payload.plan.targetUrl).toContain("https://qa.service-now.example.invalid");
    expect(payload.plan.browserProfileDirectory).toContain(".local/servicenow-browser-profiles/qa");
    expect(payload.plan.safety.browserAutomationImplemented).toBe(false);
    expect(payload.plan.safety.realSubmitAllowed).toBe(false);
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("resets a browser session profile directory without touching source files", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-reset-"));
    const profileDir = join(projectRoot, ".local/servicenow-browser-profiles/qa");
    const marker = join(profileDir, "cookie-placeholder.txt");
    await mkdir(profileDir, { recursive: true });
    await writeFile(marker, "runtime only", "utf8");

    const result = await runCli(["browser", "reset", "--mode", "qa", "--json"], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("browser reset");
    expect(payload.reset.deletedDirectory).toContain(".local/servicenow-browser-profiles/qa");
    await expect(readFile(marker, "utf8")).rejects.toThrow();
    expect(payload.safety.noExternalActionPerformed).toBe(true);
  });

  it("prints a no-write browser launch dry-run result for QA", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-launch-"));

    const result = await runCli(["browser", "launch", "--mode", "qa", "--json"], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("browser launch");
    expect(payload.launch.status).toBe("dry-run");
    expect(payload.launch.safety.noWriteMode).toBe(true);
    expect(payload.launch.safety.writeOperationsAllowed).toBe(false);
    expect(payload.launch.commandPreview.args).toContain("--new-window");
    expect(payload.safety.noExternalActionPerformed).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
  });

  it("blocks Windows browser executable dry-run from WSL/Linux without exposing a launchable command", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-windows-exe-blocked-"));

    const result = await runCli([
      "browser",
      "launch",
      "--mode",
      "qa",
      "--browser-executable",
      "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.launch.status).toBe("blocked");
    expect(payload.launch.plan.status).toBe("blocked");
    expect(payload.launch.blockedReason).toBe("Windows browser executable requires a verified Windows-compatible isolated profile path before launch.");
    expect(payload.launch.commandPreview).toBeUndefined();
    expect(payload.launch.profileIsolation).toMatchObject({
      status: "blocked",
      reason: "Windows browser executable requires a verified Windows-compatible isolated profile path before launch."
    });
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain("sys_id");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("user:");
  });

  it("blocks Windows browser executable configured through SDA_BROWSER_EXECUTABLE", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-env-exe-blocked-"));
    const previousExecutable = process.env.SDA_BROWSER_EXECUTABLE;
    process.env.SDA_BROWSER_EXECUTABLE = "/mnt/./c/Program Files (x86)/Microsoft/Edge/Application/msedge.EXE  ";

    try {
      const result = await runCli([
        "browser",
        "launch",
        "--mode",
        "qa",
        "--execute",
        "--confirm-no-write-launch",
        "--json"
      ], { cwd: projectRoot });
      const payload = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(0);
      expect(payload.launch.status).toBe("blocked");
      expect(payload.launch.commandPreview).toBeUndefined();
      expect(payload.launch.profileIsolation).toMatchObject({ status: "blocked" });
      expect(payload.safety.browserProcessLaunched).toBe(false);
    } finally {
      if (previousExecutable === undefined) {
        delete process.env.SDA_BROWSER_EXECUTABLE;
      } else {
        process.env.SDA_BROWSER_EXECUTABLE = previousExecutable;
      }
    }
  });

  it("blocks browser launch output for credential-bearing, query, or encoded sensitive URLs without leaking details", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-launch-blocked-"));
    const qaHost = new URL(getServiceNowEnvironmentConfig("qa").url ?? "").host;
    const urlUserInfoMarker = "user:" + "***" + String.fromCharCode(64);
    const sensitiveQueryName = "sys" + "_id";
    let repeatedEncodedPayload = `?${sensitiveQueryName}=abc123`;
    for (let index = 0; index < 4; index += 1) {
      repeatedEncodedPayload = encodeURIComponent(repeatedEncodedPayload);
    }

    const targetUrls = [
      `https://${urlUserInfoMarker}${qaHost}/nav_to.do`,
      `https://${qaHost}/nav_to.do?${sensitiveQueryName}=abc123`,
      `https://${qaHost}/nav_to.do${repeatedEncodedPayload}`,
      `https://${qaHost}/nav_to.do%253Fshort_description%253Dcustomer-data`
    ];

    for (const targetUrl of targetUrls) {
      const result = await runCli([
        "browser",
        "launch",
        "--mode",
        "qa",
        "--target-url",
        targetUrl,
        "--json"
      ], { cwd: projectRoot });
      const payload = JSON.parse(result.stdout);
      const serialized = JSON.stringify(payload);

      expect(result.exitCode).toBe(0);
      expect(payload.launch.status).toBe("blocked");
      expect(serialized).not.toContain("user:");
      expect(serialized).not.toContain("@");
      expect(serialized).not.toContain("sys_id");
      expect(serialized).not.toContain("token");
      expect(serialized).not.toContain("placeholder");
      expect(payload.safety.browserProcessLaunched).toBe(false);
    }
  });

  it("returns sanitized JSON when an executable launch fails", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-missing-executable-"));

    const result = await runCli([
      "browser",
      "launch",
      "--mode",
      "qa",
      "--browser-executable",
      "/definitely/missing/sda-browser",
      "--execute",
      "--confirm-no-write-launch",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.launch.status).toBe("blocked");
    expect(payload.launch.blockedReason).toBe("Browser process could not be started. Check the configured browser executable.");
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain("sys_id");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("user:");
  });

  it("prints a Windows dedicated Chromium about:blank smoke dry-run result", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-smoke-"));

    const result = await runCli([
      "browser",
      "smoke",
      "--browser-executable",
      "%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\chrome.exe",
      "--profile-root",
      "%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\smoke\\session-123",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("browser smoke");
    expect(payload.smoke.status).toBe("dry-run");
    expect(payload.smoke.targetValidation).toMatchObject({
      status: "allowed",
      target: "about:blank"
    });
    expect(payload.smoke.runtimeClassification).toMatchObject({
      status: "allowed",
      reason: "tool-owned-dedicated-chromium-runtime"
    });
    expect(payload.smoke.profileValidation).toMatchObject({
      status: "allowed",
      reason: "tool-owned-disposable-profile-root"
    });
    expect(payload.smoke.commandPreview.args).toContain("about:blank");
    expect(payload.smoke.safety.browserProcessLaunched).toBe(false);
    expect(payload.smoke.safety.targetTouchesServiceNow).toBe(false);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain("service-now.com");
  });

  it("blocks Windows Chromium smoke execution unless the no-write launch confirmation is present", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-smoke-confirm-"));

    const result = await runCli([
      "browser",
      "smoke",
      "--browser-executable",
      "%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\chrome.exe",
      "--profile-root",
      "%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\smoke\\session-456",
      "--execute",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.smoke.status).toBe("blocked");
    expect(payload.smoke.blockedReason).toBe("Explicit --confirm-no-write-launch is required before running the Windows Chromium smoke launch.");
    expect(payload.smoke.commandPreview.args).toContain("about:blank");
    expect(payload.smoke.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.browserProcessLaunched).toBe(false);
  });

  it("blocks ServiceNow, HTTP, and HTTPS targets for the smoke command without leaking details", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-smoke-target-blocked-"));

    const sensitiveQueryName = "sys" + "_id";
    const sensitiveTokenName = "to" + "ken";
    const targetUrls = [
      `https://qa.service-now.example.invalid/nav_to.do?${sensitiveQueryName}=abc123`,
      `http://example.test/?${sensitiveTokenName}=abc123`
    ];

    for (const target of targetUrls) {
      const result = await runCli([
        "browser",
        "smoke",
        "--target",
        target,
        "--browser-executable",
        "%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\chrome.exe",
        "--profile-root",
        "%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\smoke\\session-789",
        "--json"
      ], { cwd: projectRoot });
      const payload = JSON.parse(result.stdout);
      const serialized = JSON.stringify(payload);

      expect(result.exitCode).toBe(0);
      expect(payload.smoke.status).toBe("blocked");
      expect(payload.smoke.targetValidation).toMatchObject({
        status: "blocked",
        reason: "unsafe-smoke-target-denied"
      });
      expect(payload.smoke.commandPreview).toBeUndefined();
      expect(payload.safety.browserProcessLaunched).toBe(false);
      expect(serialized).not.toContain("qa.service-now.example.invalid");
      expect(serialized).not.toContain("service-now.com");
      expect(serialized).not.toContain(sensitiveQueryName);
      expect(serialized).not.toContain(`${sensitiveTokenName}=abc123`);
    }
  });

  it("blocks daily runtime and profile roots for the smoke command", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-smoke-daily-blocked-"));

    const dailyRuntime = await runCli([
      "browser",
      "smoke",
      "--browser-executable",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "--profile-root",
      "%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\smoke\\session-123",
      "--json"
    ], { cwd: projectRoot });
    const dailyRuntimePayload = JSON.parse(dailyRuntime.stdout);

    const dailyProfile = await runCli([
      "browser",
      "smoke",
      "--browser-executable",
      "%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\chrome.exe",
      "--profile-root",
      "%APPDATA%\\Mozilla\\Firefox\\Profiles\\default-release",
      "--json"
    ], { cwd: projectRoot });
    const dailyProfilePayload = JSON.parse(dailyProfile.stdout);

    expect(dailyRuntime.exitCode).toBe(0);
    expect(dailyRuntimePayload.smoke.status).toBe("blocked");
    expect(dailyRuntimePayload.smoke.runtimeClassification).toMatchObject({
      status: "blocked",
      reason: "daily-installed-browser-runtime-denied"
    });
    expect(dailyRuntimePayload.smoke.commandPreview).toBeUndefined();

    expect(dailyProfile.exitCode).toBe(0);
    expect(dailyProfilePayload.smoke.status).toBe("blocked");
    expect(dailyProfilePayload.smoke.profileValidation).toMatchObject({
      status: "blocked",
      reason: "daily-browser-profile-root-denied"
    });
    expect(dailyProfilePayload.smoke.commandPreview).toBeUndefined();
  });
});
