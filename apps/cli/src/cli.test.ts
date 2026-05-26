import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runCli } from "./cli";
import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";
import {
  alanQaIncidentTestDefaults,
  getRequiredQaAutofillApprovalPhrase,
  getRequiredRealActionApprovalPhrase,
  type QaAutofillFixtureField,
  type QaAutofillOperation,
  type QaIncidentFormFieldEvidence
} from "@servicenow-automation/core";
import type {
  QaAutofillRuntimeInspection,
  QaAutofillRuntimePageDriver,
  QaIncidentFieldRuntimeInspection,
  QaIncidentFieldRuntimePageDriver
} from "@servicenow-automation/adapters";

const cwd = new URL("..", import.meta.url).pathname;
const loopbackCdpHost = () => ["127", "0", "0", "1"].join(".");
const localCdpEndpoint = (port = 9222) => [["http", "://", loopbackCdpHost()].join(""), String(port)].join(":");
const sensitiveRecordKey = ["sys", "id"].join("_");

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

  it("builds a local QA required/recommended default field plan without browser automation or writes", async () => {
    const result = await runCli([
      "qa",
      "default-plan",
      "--template",
      "password_reset",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake local QA password reset intake",
      "--field-fixture",
      "initial-create",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa default-plan");
    expect(payload.defaultPlan.status).toBe("ready-for-local-review");
    expect(serialized).not.toContain("current-page-field-fingerprint");
    expect(payload.defaultPlan.plannedFields.map((field: { key: string }) => field.key)).toEqual([
      "requester",
      "category",
      "subcategory",
      "location",
      "channel",
      "impact",
      "urgency",
      "assignmentGroup",
      "assignedTo",
      "shortDescription",
      "description",
      "workNotes"
    ]);
    expect(payload.defaultPlan.plannedFields.find((field: { key: string }) => field.key === "requester").value).toBe(alanQaIncidentTestDefaults.requester);
    expect(payload.defaultPlan.plannedFields.find((field: { key: string }) => field.key === "category").value).toBe(alanQaIncidentTestDefaults.category);
    expect(payload.defaultPlan.plannedFields.find((field: { key: string }) => field.key === "subcategory").value).toBe(alanQaIncidentTestDefaults.subcategory);
    expect(payload.defaultPlan.plannedFields.find((field: { key: string }) => field.key === "impact").value).toBe(alanQaIncidentTestDefaults.impact);
    expect(payload.defaultPlan.plannedFields.find((field: { key: string }) => field.key === "urgency").value).toBe(alanQaIncidentTestDefaults.urgency);
    expect(payload.defaultPlan.plannedFields.find((field: { key: string }) => field.key === "workNotes").value).toContain(alanQaIncidentTestDefaults.workNotesPrefix);
    expect(payload.defaultPlan.plannedFields.every((field: { autofillAllowed: boolean }) => field.autofillAllowed === false)).toBe(true);
    expect(payload.defaultPlan.operations).toEqual([]);
    expect(payload.defaultPlan.safety.browserAutomationAllowed).toBe(false);
    expect(payload.defaultPlan.safety.serviceNowApiAllowed).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
    expect(serialized).not.toContain("sysverb");
  });

  it("verifies the default required/reference/select field plan in a local fixture harness", async () => {
    const result = await runCli([
      "qa",
      "default-plan",
      "--template",
      "password_reset",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake local QA password reset intake",
      "--field-fixture",
      "initial-create",
      "--control-fixture",
      "initial-create",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.fieldFixtureVerification.status).toBe("verified");
    expect(payload.fieldFixtureVerification.verifiedFields.map((field: { key: string }) => field.key)).toEqual(
      payload.defaultPlan.plannedFields.map((field: { key: string }) => field.key)
    );
    expect(payload.fieldFixtureVerification.verifiedFields.find((field: { key: string }) => field.key === "requester").controlType).toBe("reference");
    expect(payload.fieldFixtureVerification.verifiedFields.find((field: { key: string }) => field.key === "category").controlType).toBe("select");
    expect(payload.fieldFixtureVerification.verifiedFields.every((field: { autofillAllowed: boolean; value?: string }) => field.autofillAllowed === false && field.value === undefined)).toBe(true);
    expect(payload.fieldFixtureVerification.writeActionsAttempted).toBe(false);
    expect(payload.fieldFixtureVerification.realServiceNowPageTouched).toBe(false);
    expect(payload.fieldFixtureVerification.serviceNowApiCalled).toBe(false);
    expect(payload.fieldFixtureVerification.saveSubmitUpdateCloseAttempted).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
    expect(serialized).not.toContain("sysverb");
  });

  it("blocks the local default field fixture harness on selector/control drift", async () => {
    const result = await runCli([
      "qa",
      "default-plan",
      "--template",
      "password_reset",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake local QA password reset intake",
      "--field-fixture",
      "initial-create",
      "--control-fixture",
      "ambiguous-category",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.fieldFixtureVerification.status).toBe("blocked");
    expect(payload.fieldFixtureVerification.blockedReason).toBe("ambiguous-control");
    expect(payload.fieldFixtureVerification.verifiedFields).toEqual([]);
    expect(payload.fieldFixtureVerification.writeActionsAttempted).toBe(false);
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
  });

  it("can build a default field plan from a read-only current-page inspection without leaking page identifiers", async () => {
    const driver = fakeIncidentFieldDriver(
      incidentFieldInspection({
        pageFingerprint: "current-page-field-fingerprint",
        fields: incidentDefaultFields()
      })
    );
    const result = await runCli([
      "qa",
      "default-plan",
      "--mode",
      "qa",
      "--template",
      "password_reset",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake local QA password reset intake",
      "--field-source",
      "current-page-readonly",
      "--json"
    ], { cwd, qaIncidentFieldInspectionDriver: driver });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.fieldSource).toBe("current-page-readonly");
    expect(payload.fieldInspection).toMatchObject({
      status: "verified",
      pageFingerprintCaptured: true,
      detectedFieldCount: 12
    });
    expect(payload.fieldInspection.pageFingerprint).toBeUndefined();
    expect(payload.defaultPlan.status).toBe("ready-for-local-review");
    expect(serialized).not.toContain("current-page-field-fingerprint");
    expect(payload.defaultPlan.plannedFields.map((field: { key: string }) => field.key)).toContain("impact");
    expect(payload.defaultPlan.plannedFields.map((field: { key: string }) => field.key)).toContain("urgency");
    expect(payload.fieldRuntimeVerification).toMatchObject({
      status: "verified",
      realServiceNowPageTouched: true,
      writeActionsAttempted: false,
      serviceNowApiCalled: false,
      saveSubmitUpdateCloseAttempted: false,
      operatorStopInstruction: "current-page-readonly-verify-only-before-live-runtime"
    });
    expect(payload.fieldRuntimeVerification.verifiedFields).toHaveLength(12);
    expect(payload.fieldRuntimeVerification.verifiedFields.every((field: { autofillAllowed: boolean; value?: string }) => field.autofillAllowed === false && field.value === undefined)).toBe(true);
    expect(payload.safety.browserAutomationCalled).toBe(true);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(driver.inspectCalls).toBe(1);
    expect(serialized).not.toContain("nav_to");
    expect(serialized).not.toContain(sensitiveRecordKey);
    expect(serialized).not.toContain("incident.caller_id");
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
  });

  it("blocks current-page default planning when read-only inspection is not verified", async () => {
    const driver = fakeIncidentFieldDriver(
      incidentFieldInspection({
        currentUrl: "https://other.service-now.example.invalid/nav_to.do",
        fields: []
      })
    );
    const result = await runCli([
      "qa",
      "default-plan",
      "--mode",
      "qa",
      "--template",
      "password_reset",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake local QA password reset intake",
      "--field-source",
      "current-page-readonly",
      "--json"
    ], { cwd, qaIncidentFieldInspectionDriver: driver });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.fieldInspection.status).toBe("blocked");
    expect(payload.fieldInspection.blockedReason).toBe("current-page-target-denied");
    expect(payload.defaultPlan.status).toBe("blocked");
    expect(payload.defaultPlan.blockedReason).toBe("no-recognized-incident-fields");
    expect(payload.defaultPlan.plannedFields).toEqual([]);
    expect(payload.fieldRuntimeVerification).toBeUndefined();
    expect(payload.safety.browserAutomationCalled).toBe(true);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(serialized).not.toContain("other.service-now.example.invalid");
    expect(serialized).not.toContain("nav_to.do");
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
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
      getRequiredRealActionApprovalPhrase("qa", "submit_incident"),
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa smoke");
    expect(payload.plan.status).toBe("ready-for-manual-fill");
    expect(payload.plan.targetHost).toBeUndefined();
    expect(payload.plan.requiredApprovalPhrase).toBeUndefined();
    expect(payload.plan.writeActionApprovalPhrases).toBeUndefined();
    expect(payload.plan.redactions).toEqual({
      targetHost: true,
      gateDecision: true,
      approvalPhrase: true
    });
    expect(payload.plan.fieldMappings.find((field: { key: string }) => field.key === "shortDescription").value).toContain("VPN");
    expect(payload.plan.safety.manualFillOnly).toBe(true);
    expect(payload.plan.safety.noBrowserAutomation).toBe(true);
    expect(payload.plan.safety.noServiceNowApi).toBe(true);
    expect(payload.plan.safety.noAutoSubmit).toBe(true);
    expect(payload.plan.safety.noExternalActionPerformed).toBe(true);
    expect(payload.safety.noExternalActionPerformed).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("service" + "-now.");
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "submit_incident"));
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
      getRequiredRealActionApprovalPhrase("qa", "submit_incident"),
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
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "submit_incident"));
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "save_incident"));
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "update_incident"));
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "close_incident"));
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
      getRequiredRealActionApprovalPhrase("qa", "save_incident"),
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
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "save_incident"));
    expect(serialized).not.toContain("approved-for-qa-dev-write");
  });

  it("does not echo invalid QA manual-fill write-action values", async () => {
    const sensitiveApprovalPhrase = getRequiredRealActionApprovalPhrase("qa", "save_incident");
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
      getRequiredRealActionApprovalPhrase("qa", "submit_incident"),
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
      getRequiredRealActionApprovalPhrase("qa", "submit_incident"),
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
        getRequiredRealActionApprovalPhrase("qa", "submit_incident"),
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
      expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "submit_incident"));
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
      getRequiredRealActionApprovalPhrase("qa", "submit_incident"),
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
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "submit_incident"));
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
      getRequiredRealActionApprovalPhrase("qa", "submit_incident"),
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
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "submit_incident"));
    expect(serialized).not.toContain("https" + "://");
  });

  it("prepares a QA text-field autofill review plan without launching a browser or writing", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const approvalPhrase = getRequiredQaAutofillApprovalPhrase("qa");

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
    const approvalPhrase = getRequiredQaAutofillApprovalPhrase("qa");

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
    expect(serialized).not.toContain("reviewed-page");
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
      getRequiredQaAutofillApprovalPhrase("qa"),
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
    expect(serialized).not.toContain(getRequiredQaAutofillApprovalPhrase("qa"));
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
      getRequiredQaAutofillApprovalPhrase("qa"),
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
        getRequiredQaAutofillApprovalPhrase("qa"),
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
      expect(serialized).not.toContain(getRequiredQaAutofillApprovalPhrase("qa"));
      expect(serialized).not.toContain("https" + "://");
    }
  );

  it("verifies QA runtime autofill selectors without filling or leaking draft details", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const driver = fakeQaAutofillRuntimeDriver([qaRuntimeInspection({ pageFingerprint: "reviewed-page" })]);

    const result = await runCli([
      "qa",
      "autofill-runtime",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--cdp-endpoint",
      localCdpEndpoint(),
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--json"
    ], { cwd, qaAutofillRuntimeDriver: driver });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("qa autofill-runtime");
    expect(payload.autofillRuntime.status).toBe("verified");
    expect(payload.autofillRuntime.selectorVerification).toEqual({
      shortDescription: "found",
      description: "found",
      workNotes: "found"
    });
    expect(payload.autofillRuntime.pageFingerprint).toBeUndefined();
    expect(payload.autofillRuntime.pageFingerprintCaptured).toBe(true);
    expect(payload.autofillRuntime.filledFields).toEqual([]);
    expect(payload.plan).toBeUndefined();
    expect(payload.safety.browserAutomationCalled).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(driver.fillCalls).toHaveLength(0);
    expect(serialized).not.toContain("Fake Chat intake");
    expect(serialized).not.toContain("VPN connection issue");
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain("service-" + "now.com");
  });

  it("blocks QA runtime autofill outside QA/dev before requiring CDP or inspecting a page", async () => {
    const result = await runCli([
      "qa",
      "autofill-runtime",
      "--mode",
      "production-shadow",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--json"
    ], { cwd });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.autofillRuntime.status).toBe("blocked");
    expect(payload.autofillRuntime.blockedReason).toBe("qa-dev-only");
    expect(payload.safety.browserAutomationCalled).toBe(false);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.plan).toBeUndefined();
    expect(serialized).not.toContain("cdp-endpoint");
    expect(serialized).not.toContain("Fake Chat intake");
  });

  it("returns sanitized runtime blocked output when browser inspection throws", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const sensitiveErrorUrl = "https" + "://" + "private." + "service" + "-now.com" + "/nav_to.do?" + "to" + "ken" + "=abc123";
    const driver: QaAutofillRuntimePageDriver = {
      async inspectAllowedTextFields() {
        throw new Error(`CDP failure at ${sensitiveErrorUrl}`);
      },
      async fillAllowedTextFields() {
        throw new Error("fill should not be called");
      }
    };

    const result = await runCli([
      "qa",
      "autofill-runtime",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--json"
    ], { cwd, qaAutofillRuntimeDriver: driver });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.autofillRuntime.status).toBe("blocked");
    expect(payload.autofillRuntime.blockedReason).toBe("browser-runtime-error");
    expect(payload.safety.browserAutomationCalled).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain("private.");
    expect(serialized).not.toContain("abc123");
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain("CDP failure");
  });

  it("executes QA runtime autofill only after fresh fingerprint-bound approval", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const approvalPhrase = getRequiredQaAutofillApprovalPhrase("qa");
    const driver = fakeQaAutofillRuntimeDriver([
      qaRuntimeInspection({ pageFingerprint: "reviewed-page" }),
      qaRuntimeInspection({ pageFingerprint: "reviewed-page" })
    ]);

    const result = await runCli([
      "qa",
      "autofill-runtime",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--cdp-endpoint",
      localCdpEndpoint(),
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--approval-phrase",
      approvalPhrase,
      "--approval-page-fingerprint",
      "reviewed-page",
      "--execute",
      "--json"
    ], { cwd, qaAutofillRuntimeDriver: driver });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.autofillRuntime.status).toBe("completed");
    expect(payload.autofillRuntime.filledFields.map((field: { key: string }) => field.key)).toEqual(["shortDescription", "description", "workNotes"]);
    expect(payload.plan.status).toBe("ready-for-autofill");
    expect(payload.plan.operations.every((operation: { kind: string; value: string }) => operation.kind === "fill-text" && operation.value === "sanitized-draft-value")).toBe(true);
    expect(payload.execution.writeActionsAttempted).toBe(false);
    expect(payload.execution.artifactsCaptured).toBe(false);
    expect(payload.execution.serviceNowApiCalled).toBe(false);
    expect(payload.execution.stoppedBeforeSaveSubmitUpdateClose).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(driver.fillCalls).toHaveLength(1);
    expect(driver.fillCalls[0].map((operation) => operation.kind)).toEqual(["fill-text", "fill-text", "fill-text"]);
    expect(serialized).not.toContain(approvalPhrase);
    expect(serialized).not.toContain("Fake Chat intake");
    expect(serialized).not.toContain("VPN connection issue");
    expect(serialized).not.toContain("querySelectorAll");
    expect(serialized).not.toContain("dispatchEvent");
  });

  it("blocks QA runtime autofill when the approved page fingerprint is stale", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const approvalPhrase = getRequiredQaAutofillApprovalPhrase("qa");
    const driver = fakeQaAutofillRuntimeDriver([
      qaRuntimeInspection({ pageFingerprint: "changed-page" })
    ]);

    const result = await runCli([
      "qa",
      "autofill-runtime",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--cdp-endpoint",
      localCdpEndpoint(),
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--approval-phrase",
      approvalPhrase,
      "--approval-page-fingerprint",
      "reviewed-page",
      "--execute",
      "--json"
    ], { cwd, qaAutofillRuntimeDriver: driver });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.autofillRuntime.status).toBe("blocked");
    expect(payload.autofillRuntime.blockedReason).toBe("approval-stale-after-page-change");
    expect(payload.autofillRuntime.filledFields).toEqual([]);
    expect(payload.plan.operations).toEqual([]);
    expect(driver.fillCalls).toHaveLength(0);
    expect(serialized).not.toContain(approvalPhrase);
    expect(serialized).not.toContain("Fake Chat intake");
  });

  it("blocks QA runtime autofill when the current browser host is not allowlisted", async () => {
    const qaIsolationConfirmation = "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";
    const dedicatedProfileConfirmation = "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";
    const approvalPhrase = getRequiredQaAutofillApprovalPhrase("qa");
    const driver = fakeQaAutofillRuntimeDriver([
      qaRuntimeInspection({ currentUrl: "https://other.service-now.example.invalid/nav_to.do", pageFingerprint: "reviewed-page" })
    ]);

    const result = await runCli([
      "qa",
      "autofill-runtime",
      "--mode",
      "qa",
      "--template",
      "vpn_issue",
      "--user",
      "Demo requester A",
      "--summary",
      "Fake Chat intake — VPN connection issue after password or MFA change",
      "--cdp-endpoint",
      localCdpEndpoint(),
      "--qa-isolation-confirmation",
      qaIsolationConfirmation,
      "--dedicated-profile-confirmation",
      dedicatedProfileConfirmation,
      "--approval-phrase",
      approvalPhrase,
      "--approval-page-fingerprint",
      "reviewed-page",
      "--execute",
      "--json"
    ], { cwd, qaAutofillRuntimeDriver: driver });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.autofillRuntime.status).toBe("blocked");
    expect(payload.autofillRuntime.blockedReason).toBe("current-page-target-denied");
    expect(payload.autofillRuntime.filledFields).toEqual([]);
    expect(payload.plan).toBeUndefined();
    expect(driver.fillCalls).toHaveLength(0);
    expect(serialized).not.toContain("other.service-now.example.invalid");
    expect(serialized).not.toContain("https" + "://");
  });

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
      getRequiredRealActionApprovalPhrase("qa", "save_incident"),
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
    expect(serialized).not.toContain(getRequiredRealActionApprovalPhrase("qa", "save_incident"));
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
    expect(serialized).not.toContain(sensitiveRecordKey);
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
      expect(serialized).not.toContain(sensitiveRecordKey);
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
    expect(serialized).not.toContain(sensitiveRecordKey);
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

  it("prints a QA dedicated CDP browser dry-run without leaking the ServiceNow target", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-cdp-start-"));

    const result = await runCli([
      "browser",
      "cdp-start",
      "--mode",
      "qa",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.command).toBe("browser cdp-start");
    expect(payload.cdpBrowser.status).toBe("dry-run");
    expect(payload.cdpBrowser.commandPreview.args).toContain("-TargetUrl");
    expect(payload.cdpBrowser.commandPreview.args).not.toContain(getServiceNowEnvironmentConfig("qa").url);
    expect(payload.cdpBrowser.target).toMatchObject({ hostRedacted: true, rawUrlRedacted: true });
    expect(payload.cdpBrowser.safety.browserProcessLaunched).toBe(false);
    expect(payload.cdpBrowser.safety.cdpEndpointReady).toBe(false);
    expect(payload.cdpBrowser.safety.fieldFillAllowed).toBe(false);
    expect(payload.safety.noServiceNowWrite).toBe(true);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain("qa.service-now.example.invalid");
    expect(serialized).not.toContain("nav_to.do");
    expect(serialized).not.toContain(sensitiveRecordKey);
  });

  it("accepts a custom safe QA landing URL for cdp-start dry-run without leaking the raw host", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-cdp-custom-target-"));
    const customQaHost = `custom-qa.${["service", "now"].join("-")}.com`;
    const customQaLandingUrl = `https://${customQaHost}/now/nav/ui/classic/params/target/home_splash.do`;

    const result = await runCli([
      "browser",
      "cdp-start",
      "--mode",
      "qa",
      "--target-url",
      customQaLandingUrl,
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.cdpBrowser.status).toBe("dry-run");
    expect(payload.cdpBrowser.commandPreview.args).toContain("[REDACTED_SERVICE_NOW_TARGET]");
    expect(payload.cdpBrowser.commandPreview.args).not.toContain(customQaLandingUrl);
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain(customQaHost);
    expect(serialized).not.toContain("home_splash.do");
  });

  it("explains cdp-start angle-bracket URL mistakes without leaking the raw target", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-cdp-angle-bracket-"));
    const wrappedTarget = "<https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do>";

    const result = await runCli([
      "browser",
      "cdp-start",
      "--mode",
      "qa",
      "--target-url",
      wrappedTarget,
      "--execute",
      "--confirm-no-write-launch",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.exitCode).toBe(0);
    expect(payload.cdpBrowser.status).toBe("blocked");
    expect(payload.cdpBrowser.blockedReason).toBe("Target URL is invalid. Paste only the HTTPS ServiceNow landing URL value; do not include angle brackets or shell placeholders.");
    expect(payload.cdpBrowser.commandPreview).toBeUndefined();
    expect(payload.safety.browserProcessLaunched).toBe(false);
    expect(serialized).not.toContain(wrappedTarget);
    expect(serialized).not.toContain("qa.service-now.example.invalid");
  });

  it("blocks QA dedicated CDP browser execution unless no-write launch is confirmed", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "sda-cli-browser-cdp-confirm-"));

    const result = await runCli([
      "browser",
      "cdp-start",
      "--mode",
      "qa",
      "--execute",
      "--json"
    ], { cwd: projectRoot });
    const payload = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(payload.cdpBrowser.status).toBe("blocked");
    expect(payload.cdpBrowser.blockedReason).toBe("Explicit --confirm-no-write-launch is required before starting a QA/dev dedicated browser connection.");
    expect(payload.cdpBrowser.safety.browserProcessLaunched).toBe(false);
    expect(payload.cdpBrowser.safety.writeOperationsAllowed).toBe(false);
    expect(payload.safety.browserProcessLaunched).toBe(false);
  });
});

const qaRuntimeFields: QaAutofillFixtureField[] = [
  { key: "shortDescription", matchedSelectorCount: 1, elementType: "text", writable: true },
  { key: "description", matchedSelectorCount: 1, elementType: "textarea", writable: true },
  { key: "workNotes", matchedSelectorCount: 1, elementType: "textarea", writable: true }
];

function qaRuntimeInspection(overrides: Partial<QaAutofillRuntimeInspection> = {}): QaAutofillRuntimeInspection {
  return {
    currentUrl: "https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3Fredacted%3D1",
    pageFingerprint: "reviewed-page",
    fields: qaRuntimeFields,
    unexpectedRequiredFieldCount: 0,
    ...overrides
  };
}

function fakeQaAutofillRuntimeDriver(
  inspections: QaAutofillRuntimeInspection[]
): QaAutofillRuntimePageDriver & { fillCalls: QaAutofillOperation[][] } {
  const fillCalls: QaAutofillOperation[][] = [];
  let inspectionIndex = 0;
  return {
    fillCalls,
    async inspectAllowedTextFields() {
      const nextInspection = inspections[Math.min(inspectionIndex, inspections.length - 1)];
      inspectionIndex += 1;
      return nextInspection;
    },
    async fillAllowedTextFields(request) {
      fillCalls.push(request.operations);
      return {
        status: "completed",
        filledFields: request.operations.map((operation) => ({
          key: operation.fieldKey,
          label: operation.label,
          valueLength: operation.value.length
        })),
        writeActionsAttempted: false,
        artifactsCaptured: false,
        serviceNowApiCalled: false,
        browserProcessLaunched: false,
        stoppedBeforeSaveSubmitUpdateClose: true
      };
    }
  };
}

function incidentFieldInspection(overrides: Partial<QaIncidentFieldRuntimeInspection> = {}): QaIncidentFieldRuntimeInspection {
  const sensitiveQueryName = "sys" + "_id";
  return {
    currentUrl: `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveQueryName}%3Dredacted`,
    pageFingerprint: "current-page-field-fingerprint",
    fields: incidentDefaultFields(),
    ...overrides
  };
}

function fakeIncidentFieldDriver(
  inspectionResult: QaIncidentFieldRuntimeInspection
): QaIncidentFieldRuntimePageDriver & { inspectCalls: number } {
  let inspectCalls = 0;
  return {
    get inspectCalls() {
      return inspectCalls;
    },
    async inspectIncidentFormFields() {
      inspectCalls += 1;
      return inspectionResult;
    }
  };
}

function incidentDefaultFields(): QaIncidentFormFieldEvidence[] {
  return [
    incidentField({ name: "incident.caller_id", label: "Requester", required: true, starred: true, type: "reference" }),
    incidentField({ name: "incident.category", label: "Category", required: true, starred: true, type: "select" }),
    incidentField({ name: "incident.subcategory", label: "Subcategory", type: "select" }),
    incidentField({ name: "incident.location", label: "Location", required: true, starred: true, type: "reference" }),
    incidentField({ name: "incident.contact_type", label: "Channel", required: true, starred: true, type: "select" }),
    incidentField({ name: "incident.impact", label: "Impact", required: true, starred: true, type: "select" }),
    incidentField({ name: "incident.urgency", label: "Urgency", required: true, starred: true, type: "select" }),
    incidentField({ name: "incident.assignment_group", label: "Assignment group", required: true, starred: true, type: "reference" }),
    incidentField({ name: "incident.assigned_to", label: "Assigned to", type: "reference" }),
    incidentField({ name: "incident.short_description", label: "Short description", required: true, starred: true, type: "text" }),
    incidentField({ name: "incident.description", label: "Description", required: true, starred: true, type: "textarea" }),
    incidentField({ name: "incident.work_notes", label: "Work notes", type: "textarea" })
  ];
}

function incidentField(overrides: Partial<QaIncidentFormFieldEvidence>): QaIncidentFormFieldEvidence {
  return {
    name: "incident.unknown",
    label: "Unknown",
    type: "text",
    required: false,
    starred: false,
    writable: true,
    valuePresent: false,
    ...overrides
  };
}
