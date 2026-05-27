import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { createServer as createHttpServer, type Server as HttpServer } from "node:http";
import { createServer as createTcpServer, type AddressInfo, type Server as TcpServer, type Socket } from "node:net";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type {
  FieldDraft,
  QaAutofillFixtureField,
  QaAutofillOperation,
  QaIncidentFormFieldEvidence,
  QaIncidentDefaultFieldKey,
  QaIncidentDefaultPlannedField,
  TicketDraft
} from "@servicenow-automation/core";
import {
  alanQaIncidentTestDefaults,
  applyQaWorkNotesPrefix,
  getRequiredQaAutofillApprovalPhrase
} from "@servicenow-automation/core";
import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

import {
  inspectQaIncidentDefaultFieldsRuntime,
  QaCdpRuntimeBlockedError,
  qaAutofillRuntimeTestHooks,
  runQaIncidentDefaultFieldAutofillRuntime,
  runQaTextFieldAutofillRuntime,
  type QaIncidentDefaultFieldAutofillRuntimePageDriver,
  type QaIncidentFieldRuntimeInspection,
  type QaIncidentFieldRuntimePageDriver,
  type QaAutofillRuntimeInspection,
  type QaAutofillRuntimePageDriver
} from "./qa-autofill-runtime";

const qaEnvironment = getServiceNowEnvironmentConfig("qa");
const qaApprovalPhrase = getRequiredQaAutofillApprovalPhrase("qa");
const sensitiveIncidentQueryKey = "sys" + "_id";
const currentQaIncidentUrl = `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveIncidentQueryKey}%3Dredacted`;
const qaAssignmentGroupName = alanQaIncidentTestDefaults.assignmentGroup;
const qaDefaultTextFieldValues = {
  shortDescription: "QA short description placeholder",
  description: "QA description placeholder",
  workNotes: applyQaWorkNotesPrefix("QA work notes placeholder", alanQaIncidentTestDefaults.workNotesPrefix)
};
const loopbackCdpHost = () => ["127", "0", "0", "1"].join(".");
const localCdpHttpEndpoint = (port = 9222) => [["http", "://", loopbackCdpHost()].join(""), String(port)].join(":");
const localCdpWebSocketUrl = (pageId: string, port = 9222) =>
  `${[["ws", "://", loopbackCdpHost()].join(""), String(port)].join(":")}/devtools/page/${pageId}`;
const windowsPowerShellExecutablePath = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
const windowsHelperIt = existsSync(windowsPowerShellExecutablePath) ? it : it.skip;

const allFoundFields: QaAutofillFixtureField[] = [
  { key: "shortDescription", matchedSelectorCount: 1, elementType: "text", writable: true },
  { key: "description", matchedSelectorCount: 1, elementType: "textarea", writable: true },
  { key: "workNotes", matchedSelectorCount: 1, elementType: "textarea", writable: true }
];

describe("QA text-field autofill runtime", () => {
  it("verifies selectors and returns only a fingerprint before execution", async () => {
    const driver = fakeDriver([inspection({ pageFingerprint: "reviewed-page" })]);

    const result = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver,
      execute: false,
      qaIsolationConfirmed: false,
      dedicatedProfileConfirmed: false
    });

    expect(result.status).toBe("verified");
    expect(result.pageFingerprint).toBe("reviewed-page");
    expect(result.selectorVerification).toEqual({
      shortDescription: "found",
      description: "found",
      workNotes: "found"
    });
    expect(driver.fillCalls).toHaveLength(0);
    expect(result.safety).toMatchObject({
      browserAutomationCalled: true,
      noServiceNowWrite: true,
      noSaveSubmitUpdateClose: true,
      artifactsCaptured: false
    });
  });

  it("blocks non-QA/dev or missing configured targets before browser inspection", async () => {
    const deniedEnvironments = [
      { environment: getServiceNowEnvironmentConfig("mock"), expectedReason: "qa-dev-only" },
      { environment: getServiceNowEnvironmentConfig("production-shadow"), expectedReason: "qa-dev-only" },
      { environment: getServiceNowEnvironmentConfig("dev"), expectedReason: "current-page-target-denied" }
    ];

    for (const testCase of deniedEnvironments) {
      const driver = fakeDriver([inspection({ pageFingerprint: "should-not-be-read" })]);
      const result = await runQaTextFieldAutofillRuntime({
        draft: completeDraft(),
        environment: testCase.environment,
        driver,
        execute: false,
        qaIsolationConfirmed: false,
        dedicatedProfileConfirmed: false
      });

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe(testCase.expectedReason);
      expect(result.pageFingerprint).toBeUndefined();
      expect(result.safety.browserAutomationCalled).toBe(false);
      expect(driver.inspectCalls).toBe(0);
      expect(driver.fillCalls).toHaveLength(0);
    }
  });

  it("fills only the three approved text operations after fresh approval", async () => {
    const driver = fakeDriver([
      inspection({ pageFingerprint: "reviewed-page" }),
      inspection({ pageFingerprint: "reviewed-page" })
    ]);

    const result = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver,
      execute: true,
      approvalPhrase: qaApprovalPhrase,
      approvalPageFingerprint: "reviewed-page",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });

    expect(result.status).toBe("completed");
    expect(result.plan?.operations.map((operation) => operation.kind)).toEqual(["fill-text", "fill-text", "fill-text"]);
    expect(result.execution?.filledFields.map((field) => field.key)).toEqual(["shortDescription", "description", "workNotes"]);
    expect(result.execution).toMatchObject({
      writeActionsAttempted: false,
      artifactsCaptured: false,
      serviceNowApiCalled: false,
      stoppedBeforeSaveSubmitUpdateClose: true
    });
    expect(driver.fillCalls).toHaveLength(1);
    expect(driver.fillCalls[0].map((operation) => operation.kind)).toEqual(["fill-text", "fill-text", "fill-text"]);
  });

  it("accepts visible unique controls when ServiceNow renders hidden duplicate selector matches", async () => {
    const driver = fakeDriver([
      inspection({
        fields: [
          { key: "shortDescription", matchedSelectorCount: 5, visibleSelectorCount: 1, elementType: "text", writable: true },
          { key: "description", matchedSelectorCount: 1, visibleSelectorCount: 1, elementType: "textarea", writable: true },
          { key: "workNotes", matchedSelectorCount: 1, visibleSelectorCount: 1, elementType: "textarea", writable: true }
        ]
      })
    ]);

    const result = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver,
      execute: false,
      qaIsolationConfirmed: false,
      dedicatedProfileConfirmed: false
    });

    expect(result.status).toBe("verified");
    expect(result.selectorVerification).toEqual({
      shortDescription: "found",
      description: "found",
      workNotes: "found"
    });
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("blocks if the page fingerprint changes between approval and fill", async () => {
    const driver = fakeDriver([
      inspection({ pageFingerprint: "reviewed-page" }),
      inspection({ pageFingerprint: "changed-page" })
    ]);

    const result = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver,
      execute: true,
      approvalPhrase: qaApprovalPhrase,
      approvalPageFingerprint: "reviewed-page",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("approval-stale-after-page-change");
    expect(result.pageFingerprint).toBeUndefined();
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("blocks missing, ambiguous, wrong-type, and non-writable selector evidence before fill", async () => {
    const cases: Array<{ field: QaAutofillFixtureField; expectedReason: string }> = [
      { field: { key: "workNotes", matchedSelectorCount: 0, elementType: "textarea", writable: true }, expectedReason: "selector-verification-required" },
      { field: { key: "description", matchedSelectorCount: 2, elementType: "textarea", writable: true }, expectedReason: "selector-mismatch" },
      { field: { key: "description", matchedSelectorCount: 1, elementType: "select", writable: true }, expectedReason: "selector-verification-required" },
      { field: { key: "workNotes", matchedSelectorCount: 1, elementType: "textarea", writable: false }, expectedReason: "selector-verification-required" }
    ];

    for (const testCase of cases) {
      const driver = fakeDriver([inspection({ fields: replaceField(testCase.field) })]);
      const result = await runQaTextFieldAutofillRuntime({
        draft: completeDraft(),
        environment: qaEnvironment,
        driver,
        execute: true,
        approvalPhrase: qaApprovalPhrase,
        approvalPageFingerprint: "reviewed-page",
        qaIsolationConfirmed: true,
        dedicatedProfileConfirmed: true
      });

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe(testCase.expectedReason);
      expect(result.pageFingerprint).toBeUndefined();
      expect(driver.fillCalls).toHaveLength(0);
    }
  });

  it("blocks unexpected required fields and current page host mismatches without filling", async () => {
    const unexpectedRequired = fakeDriver([inspection({ unexpectedRequiredFieldCount: 1 })]);
    const unexpectedRequiredResult = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver: unexpectedRequired,
      execute: true,
      approvalPhrase: qaApprovalPhrase,
      approvalPageFingerprint: "reviewed-page",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });
    expect(unexpectedRequiredResult.status).toBe("blocked");
    expect(unexpectedRequiredResult.blockedReason).toBe("unexpected-required-field");
    expect(unexpectedRequiredResult.pageFingerprint).toBeUndefined();
    expect(unexpectedRequired.fillCalls).toHaveLength(0);

    const wrongHost = fakeDriver([inspection({ currentUrl: "https://other.service-now.example.invalid/nav_to.do" })]);
    const wrongHostResult = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver: wrongHost,
      execute: true,
      approvalPhrase: qaApprovalPhrase,
      approvalPageFingerprint: "reviewed-page",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });
    expect(wrongHostResult.status).toBe("blocked");
    expect(wrongHostResult.blockedReason).toBe("current-page-target-denied");
    expect(wrongHostResult.pageFingerprint).toBeUndefined();
    expect(wrongHost.fillCalls).toHaveLength(0);
  });
});

describe("QA incident default field read-only runtime", () => {
  it("returns a specific page-selection block when the current browser target cannot be selected", async () => {
    let inspectCalls = 0;
    const driver: QaIncidentFieldRuntimePageDriver = {
      async inspectIncidentFormFields() {
        inspectCalls += 1;
        throw new QaCdpRuntimeBlockedError("cdp-page-selection-denied");
      }
    };

    const result = await inspectQaIncidentDefaultFieldsRuntime({
      environment: qaEnvironment,
      driver
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("cdp-page-selection-denied");
    expect(result.safety.browserAutomationCalled).toBe(true);
    expect(inspectCalls).toBe(1);
  });

  it("preserves structurally serialized CDP blocked errors without relying on instanceof", async () => {
    const driver: QaIncidentFieldRuntimePageDriver = {
      async inspectIncidentFormFields() {
        throw { name: "QaCdpRuntimeBlockedError", blockedReason: "cdp-page-selection-denied" };
      }
    };

    const result = await inspectQaIncidentDefaultFieldsRuntime({
      environment: qaEnvironment,
      driver
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("cdp-page-selection-denied");
    expect(result.safety.browserAutomationCalled).toBe(true);
  });

  it("selects the configured-host Incident page when CDP exposes multiple page targets", async () => {
    const sensitiveQueryKey = "sys" + "_id";
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: "about:blank",
        webSocketDebuggerUrl: localCdpWebSocketUrl("blank")
      },
      {
        type: "page",
        url: `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveQueryKey}%3Dredacted`,
        webSocketDebuggerUrl: localCdpWebSocketUrl("incident")
      },
      {
        type: "page",
        url: "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do",
        webSocketDebuggerUrl: localCdpWebSocketUrl("landing")
      }
    ]);

    try {
      const webSocketUrl = await qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
        localCdpHttpEndpoint(),
        "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
      );

      expect(webSocketUrl).toBe(localCdpWebSocketUrl("incident"));
    } finally {
      restoreFetch();
    }
  });

  it("fails closed with a sanitized page-selection error when multiple configured-host Incident pages are open", async () => {
    const sensitiveQueryKey = "sys" + "_id";
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveQueryKey}%3Done`,
        webSocketDebuggerUrl: localCdpWebSocketUrl("incident-one")
      },
      {
        type: "page",
        url: `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveQueryKey}%3Dtwo`,
        webSocketDebuggerUrl: localCdpWebSocketUrl("incident-two")
      }
    ]);

    try {
      await expect(
        qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          localCdpHttpEndpoint(),
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        )
      ).rejects.toThrow("cdp-page-selection-denied");
    } finally {
      restoreFetch();
    }
  });

  it("fails closed instead of inspecting another host when no configured-host target is open", async () => {
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: "https://other.example.invalid/nav_to.do?uri=incident.do",
        webSocketDebuggerUrl: localCdpWebSocketUrl("other-incident")
      },
      {
        type: "page",
        url: "about:blank",
        webSocketDebuggerUrl: localCdpWebSocketUrl("blank")
      }
    ]);

    try {
      await expect(
        qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          localCdpHttpEndpoint(),
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        )
      ).rejects.toThrow("cdp-page-selection-denied");
    } finally {
      restoreFetch();
    }
  });

  it("fails closed when the only page target does not match the configured host", async () => {
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: "https://other.example.invalid/nav_to.do?uri=incident.do",
        webSocketDebuggerUrl: localCdpWebSocketUrl("single-other-incident")
      }
    ]);

    try {
      await expect(
        qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          localCdpHttpEndpoint(),
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        )
      ).rejects.toThrow("cdp-page-selection-denied");
    } finally {
      restoreFetch();
    }
  });

  it("requires a configured target before selecting any CDP page target", async () => {
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: "https://other.example.invalid/nav_to.do?uri=incident.do",
        webSocketDebuggerUrl: localCdpWebSocketUrl("unconfigured-target")
      }
    ]);

    try {
      await expect(qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(localCdpHttpEndpoint())).rejects.toThrow(
        "cdp-page-selection-denied"
      );
    } finally {
      restoreFetch();
    }
  });

  it("maps an unreachable local CDP target-list endpoint to a browser connection block", async () => {
    const restoreFetch = installFailingCdpTargetListFetch();

    try {
      await expect(
        qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          localCdpHttpEndpoint(),
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        )
      ).rejects.toThrow("cdp-endpoint-denied");
    } finally {
      restoreFetch();
    }
  });

  it("rejects direct page WebSocket endpoints before connecting to an unverified target", async () => {
    const fetchProbe = installCdpFetchProbe();

    try {
      await expect(
        qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          localCdpWebSocketUrl("unverified-direct-page"),
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        )
      ).rejects.toThrow("cdp-endpoint-denied");
      expect(fetchProbe.calls).toBe(0);
    } finally {
      fetchProbe.restore();
    }
  });

  it("maps malformed browser endpoints to sanitized browser connection blocks", async () => {
    const fetchProbe = installCdpFetchProbe();

    try {
      await expect(
        qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          "not-a-cdp-endpoint",
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        )
      ).rejects.toThrow("cdp-endpoint-denied");
      expect(fetchProbe.calls).toBe(0);
    } finally {
      fetchProbe.restore();
    }
  });

  it("maps malformed selected target WebSocket URLs to sanitized browser connection blocks", async () => {
    const forbiddenHost = "non-local-cdp.example.invalid";
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: "https://qa.service-now.example.invalid/nav_to.do?uri=incident.do",
        webSocketDebuggerUrl: ["ws", "://", forbiddenHost, "/devtools/page/incident"].join("")
      }
    ]);

    try {
      let thrown: Error | undefined;
      try {
        await qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          localCdpHttpEndpoint(),
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        );
      } catch (error) {
        thrown = error as Error;
      }

      expect(thrown?.message).toBe("cdp-endpoint-denied");
      expect(thrown?.message).not.toContain(forbiddenHost);
    } finally {
      restoreFetch();
    }
  });

  windowsHelperIt("waits for the matching Runtime.evaluate response instead of accepting unsolicited WebSocket events", async () => {
    const fakeCdp = await startFakeWindowsLocalCdpEndpoint();
    try {
      const helperResult = await runWindowsLocalCdpHelper({
        endpoint: fakeCdp.endpoint,
        targetUrl: "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do",
        expressionBase64: Buffer.from("globalThis.__unusedExpression", "utf8").toString("base64")
      });

      expect(helperResult.exitCode).toBe(0);
      expect(helperResult.stderr).toBe("");
      expect(JSON.parse(helperResult.stdout)).toEqual({
        status: "completed",
        value: {
          currentUrl: currentQaIncidentUrl,
          pageFingerprint: "matched-runtime-response",
          fields: []
        }
      });
    } finally {
      await fakeCdp.close();
    }
  });

  it.each([
    {
      name: "non-local HTTP",
      endpoint: "http://cdp.example.invalid:9222",
      expectedMessage: "cdp-endpoint-denied",
      forbiddenFragments: ["cdp.example.invalid"]
    },
    {
      name: "non-local HTTPS",
      endpoint: "https://cdp.example.invalid:9222",
      expectedMessage: "cdp-endpoint-denied",
      forbiddenFragments: ["cdp.example.invalid"]
    },
    {
      name: "loopback userinfo",
      endpoint: `${["http", "://local-user", String.fromCharCode(64), loopbackCdpHost()].join("")}:9222`,
      expectedMessage: "cdp-endpoint-denied",
      forbiddenFragments: ["local-user", loopbackCdpHost()]
    },
    {
      name: "malformed",
      endpoint: "not-a-cdp-endpoint",
      expectedMessage: "cdp-endpoint-denied",
      forbiddenFragments: ["not-a-cdp-endpoint"]
    }
  ])("rejects $name CDP endpoints before fetching target list", async ({ endpoint, expectedMessage, forbiddenFragments }) => {
    const fetchProbe = installCdpFetchProbe();

    try {
      let thrown: Error | undefined;
      try {
        await qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          endpoint,
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        );
      } catch (error) {
        thrown = error as Error;
      }

      expect(thrown?.message).toBe(expectedMessage);
      for (const fragment of forbiddenFragments) {
        expect(thrown?.message).not.toContain(fragment);
      }
      expect(fetchProbe.calls).toBe(0);
    } finally {
      fetchProbe.restore();
    }
  });

  it("inspects Incident controls from same-origin frames without relying on top-window element constructors", async () => {
    const frameDocument = fakeIncidentDocument([
      fakeIncidentDomControl("input", { name: "incident.short_description", "aria-label": "Short description", required: "true" }),
      fakeIncidentDomControl("textarea", { name: "incident.description", "aria-label": "Description" }),
      fakeIncidentDomControl("textarea", { name: "incident.work_notes", "aria-label": "Work notes" })
    ]);
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [],
      href: "https://qa.service-now.example.invalid/nav_to.do",
      frameDocuments: [frameDocument]
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentFieldInspectionScript();

      expect(result.currentUrl).toBe("https://qa.service-now.example.invalid/nav_to.do");
      expect(result.fields.map((field) => field.name)).toEqual([
        "incident.short_description",
        "incident.description",
        "incident.work_notes"
      ]);
      expect(result.fields.map((field) => field.type)).toEqual(["text", "textarea", "textarea"]);
      expect(result.fields[0]).toMatchObject({ required: true, starred: false, writable: true, valuePresent: false });
    } finally {
      restoreGlobals();
    }
  });

  it("checks the configured target before incident field DOM inspection", async () => {
    const queryProbe = { calls: 0 };
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [fakeIncidentDomControl("input", { name: "incident.short_description" })],
      href: "https://other.example.invalid/nav_to.do",
      queryProbe
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentFieldInspectionScript("qa.service-now.example.invalid");

      expect(result).toEqual({ currentUrl: "", pageFingerprint: "", fields: [] });
      expect(queryProbe.calls).toBe(0);
    } finally {
      restoreGlobals();
    }
  });

  it("inspects current incident fields without exposing page content or enabling writes", async () => {
    const driver = fakeIncidentFieldDriver(
      incidentFieldInspection({
        pageFingerprint: "incident-field-fingerprint",
        fields: incidentDefaultFields()
      })
    );

    const result = await inspectQaIncidentDefaultFieldsRuntime({
      environment: qaEnvironment,
      driver
    });

    expect(result.status).toBe("verified");
    expect(result.pageFingerprint).toBe("incident-field-fingerprint");
    expect(result.fields.map((field) => field.name)).toEqual([
      "incident.caller_id",
      "incident.category",
      "incident.subcategory",
      "incident.location",
      "incident.contact_type",
      "incident.impact",
      "incident.urgency",
      "incident.assignment_group",
      "incident.assigned_to",
      "incident.short_description",
      "incident.description",
      "incident.work_notes"
    ]);
    expect(driver.inspectCalls).toBe(1);
    expect(result.safety).toMatchObject({
      browserAutomationCalled: true,
      noServiceNowWrite: true,
      noSaveSubmitUpdateClose: true,
      artifactsCaptured: false,
      productionWriteAllowed: false
    });
    expect(JSON.stringify(result)).not.toContain(sensitiveIncidentQueryKey);
    expect(JSON.stringify(result)).not.toContain("redacted");
  });

  it("blocks current-page field inspection outside the configured QA/dev target", async () => {
    const driver = fakeIncidentFieldDriver(
      incidentFieldInspection({ currentUrl: "https://other.service-now.example.invalid/nav_to.do" })
    );

    const result = await inspectQaIncidentDefaultFieldsRuntime({
      environment: qaEnvironment,
      driver
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("current-page-target-denied");
    expect(result.pageFingerprint).toBeUndefined();
    expect(result.fields).toEqual([]);
    expect(result.safety.browserAutomationCalled).toBe(true);
  });
});

describe("QA incident default field autofill runtime", () => {
  it("autofills reviewed full-field reference select text and textarea fields after an explicit verify fingerprint", async () => {
    const plannedFields = reviewedFullFieldPlannedIncidentDefaultFields();
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "stable-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields,
      execute: true,
      approvalPageFingerprint: "stable-incident-form"
    });

    expect(result.status).toBe("completed");
    expect(result.blockedReason).toBeUndefined();
    expect(result.pageFingerprintMatched).toBe(true);
    expect(result.filledFields.map((field) => field.key)).toEqual([
      "requester",
      "category",
      "subcategory",
      "location",
      "assignmentGroup",
      "assignedTo",
      "shortDescription",
      "description",
      "workNotes"
    ]);
    expect(result.blockedFields).toEqual([]);
    expect(driver.inspectCalls).toBe(1);
    expect(driver.fillCalls).toHaveLength(1);
    expect(driver.fillCalls[0].plannedFields.map((field) => field.key)).toEqual([
      "requester",
      "category",
      "subcategory",
      "location",
      "assignmentGroup",
      "assignedTo",
      "shortDescription",
      "description",
      "workNotes"
    ]);
    expect(JSON.stringify(result)).not.toContain("VPN access issue after MFA change");
    expect(JSON.stringify(result)).not.toContain("Fake sanitized VPN issue details");
    expect(result.safety).toMatchObject({
      browserAutomationCalled: true,
      noServiceNowWrite: true,
      noSaveSubmitUpdateClose: true,
      artifactsCaptured: false
    });
  });

  it("blocks default reference autofill when a planned reference value is raw identity-shaped", async () => {
    const rawReferenceValue = "a".repeat(32);
    const plannedFields = [plannedIncidentDefaultField("requester", "Requester", rawReferenceValue, "qa-default-profile")];
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "stable-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields,
      execute: true,
      approvalPageFingerprint: "stable-incident-form"
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("reference-value-not-display-safe");
    expect(result.filledFields).toEqual([]);
    expect(result.blockedFields).toEqual([
      {
        key: "requester",
        label: "Requester",
        controlType: "reference",
        valueLength: rawReferenceValue.length,
        blockedReason: "reference-value-not-display-safe"
      }
    ]);
    expect(driver.fillCalls).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain(rawReferenceValue);
  });

  it("checks approval freshness before reporting unsupported control-type blockers", async () => {
    const plannedFields = plannedIncidentDefaultFields();
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "changed-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields,
      execute: true,
      approvalPageFingerprint: "stable-incident-form"
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("approval-stale-after-page-change");
    expect(result.pageFingerprint).toBeUndefined();
    expect(result.pageFingerprintMatched).toBe(false);
    expect(result.filledFields).toEqual([]);
    expect(result.blockedFields).toEqual([]);
    expect(driver.inspectCalls).toBe(1);
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("autofills route-out State before Assignment group and blank Assigned to after verify fingerprint", async () => {
    const plannedFields: QaIncidentDefaultPlannedField[] = [
      plannedIncidentDefaultField("state", "State", "New", "computed-safety-rule"),
      plannedIncidentDefaultField("assignmentGroup", "Assignment group", routeOutAssignmentGroup(), "route-out-target"),
      plannedIncidentDefaultField("assignedTo", "Assigned to", "", "route-out-clear-assigned-to")
    ];
    const driver = fakeDefaultFieldDriver(
      incidentFieldInspection({
        pageFingerprint: "stable-route-out-form",
        fields: [
          incidentField({ name: "incident.incident_state", label: undefined, type: "select", required: true, starred: true }),
          incidentField({ name: "incident.assignment_group", label: "Assignment group", type: "reference", required: true, starred: true }),
          incidentField({ name: "incident.assigned_to", label: "Assigned to", type: "reference" })
        ]
      })
    );

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields,
      execute: true,
      approvalPageFingerprint: "stable-route-out-form"
    });

    expect(result.status).toBe("completed");
    expect(result.blockedReason).toBeUndefined();
    expect(result.filledFields.map((field) => field.key)).toEqual(["state", "assignmentGroup", "assignedTo"]);
    expect(result.blockedFields).toEqual([]);
    expect(driver.fillCalls).toHaveLength(1);
    expect(driver.fillCalls[0].plannedFields.map((field) => field.key)).toEqual(["state", "assignmentGroup", "assignedTo"]);
    expect(driver.fillCalls[0].plannedFields[2].value).toBe("");
  });

  it("autofills only the three approved text fields after an explicit verify fingerprint", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "stable-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields: textOnlyFields,
      execute: true,
      approvalPageFingerprint: "stable-incident-form"
    });

    expect(result.status).toBe("completed");
    expect(result.pageFingerprint).toBeUndefined();
    expect(result.pageFingerprintMatched).toBe(true);
    expect(result.filledFields.map((field) => field.key)).toEqual([
      "shortDescription",
      "description",
      "workNotes"
    ]);
    expect(driver.fillCalls).toHaveLength(1);
    expect(driver.fillCalls[0].plannedFields.map((field) => field.key)).toEqual([
      "shortDescription",
      "description",
      "workNotes"
    ]);
  });

  it("blocks default text autofill when verify inspection reports duplicate visible writable controls", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const driver = fakeDefaultFieldDriver(
      incidentFieldInspection({
        pageFingerprint: "stable-incident-form",
        fields: incidentDefaultFields().map((field) =>
          field.name === "incident.short_description"
            ? incidentField({
                name: "incident.short_description",
                label: "Short description",
                type: "text",
                writable: true,
                matchedControlCount: 2,
                visibleControlCount: 2
              })
            : field
        )
      })
    );

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields: textOnlyFields,
      execute: true,
      approvalPageFingerprint: "stable-incident-form"
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("field-control-ambiguous");
    expect(result.pageFingerprintMatched).toBe(true);
    expect(result.filledFields).toEqual([]);
    expect(result.blockedFields).toEqual([
      {
        key: "shortDescription",
        label: "Short description",
        controlType: "text",
        valueLength: qaDefaultTextFieldValues.shortDescription.length,
        blockedReason: "field-control-ambiguous"
      }
    ]);
    expect(driver.fillCalls).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain(qaDefaultTextFieldValues.shortDescription);
  });

  it("tolerates hidden/template duplicate text controls when exactly one visible writable control remains", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const driver = fakeDefaultFieldDriver(
      incidentFieldInspection({
        pageFingerprint: "stable-incident-form",
        fields: incidentDefaultFields().map((field) =>
          field.name === "incident.short_description"
            ? incidentField({
                name: "incident.short_description",
                label: "Short description",
                type: "text",
                writable: true,
                matchedControlCount: 5,
                visibleControlCount: 1
              })
            : field
        )
      })
    );

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields: textOnlyFields,
      execute: true,
      approvalPageFingerprint: "stable-incident-form"
    });

    expect(result.status).toBe("completed");
    expect(result.filledFields.map((field) => field.key)).toEqual([
      "shortDescription",
      "description",
      "workNotes"
    ]);
    expect(driver.fillCalls).toHaveLength(1);
  });

  it("blocks execute-mode default-field autofill when the prior verify fingerprint is missing", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "stable-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields: textOnlyFields,
      execute: true
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("approval-page-fingerprint-required");
    expect(result.pageFingerprintMatched).toBe(false);
    expect(result.filledFields).toEqual([]);
    expect(driver.inspectCalls).toBe(0);
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("blocks autofill when the page fingerprint changed after verification", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "changed-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields: textOnlyFields,
      execute: true,
      approvalPageFingerprint: "previous-incident-form"
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("approval-stale-after-page-change");
    expect(result.pageFingerprint).toBeUndefined();
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("checks the configured target before invoking default-field fill inspection", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [],
      href: "https://other.example.invalid/nav_to.do"
    });
    const globals = globalThis as unknown as { __sdaInspectionProbe?: { calls: number } };
    globals.__sdaInspectionProbe = { calls: 0 };

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields: textOnlyFields,
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => { globalThis.__sdaInspectionProbe.calls += 1; return { currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] }; }"
      );

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe("current-page-target-denied");
      expect(globals.__sdaInspectionProbe?.calls).toBe(0);
    } finally {
      delete globals.__sdaInspectionProbe;
      restoreGlobals();
    }
  });

  it("fills only the visible sys_display reference control when a visible raw reference input is also present", async () => {
    const rawReferenceControl = fakeIncidentDomControl("input", { name: "incident.caller_id" });
    rawReferenceControl.value = "unchanged-raw-identity";
    const displayReferenceControl = fakeIncidentDomControl("input", { name: "sys_display.incident.caller_id" });
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [rawReferenceControl, displayReferenceControl],
      href: "https://qa.service-now.example.invalid/nav_to.do"
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields: [plannedIncidentDefaultField("requester", "Requester", "Safe requester display", "qa-default-profile")],
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => ({ currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] })"
      );

      expect(result.status).toBe("completed");
      expect(result.filledFields.map((field) => field.key)).toEqual(["requester"]);
      expect(result.blockedFields).toEqual([]);
      expect(rawReferenceControl.value).toBe("unchanged-raw-identity");
      expect(displayReferenceControl.value).toBe("Safe requester display");
      expect(result.writeActionsAttempted).toBe(false);
      expect(result.stoppedBeforeSaveSubmitUpdateClose).toBe(true);
    } finally {
      restoreGlobals();
    }
  });

  it("blocks reviewed reference autofill when only a visible raw reference input exists", async () => {
    const rawReferenceControl = fakeIncidentDomControl("input", { name: "incident.caller_id" });
    rawReferenceControl.value = "unchanged-raw-identity";
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [rawReferenceControl],
      href: "https://qa.service-now.example.invalid/nav_to.do"
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields: [plannedIncidentDefaultField("requester", "Requester", "Safe requester display", "qa-default-profile")],
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => ({ currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] })"
      );

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe("field-control-missing");
      expect(result.filledFields).toEqual([]);
      expect(result.blockedFields).toEqual([
        {
          key: "requester",
          label: "Requester",
          valueLength: "Safe requester display".length,
          blockedReason: "field-control-missing"
        }
      ]);
      expect(rawReferenceControl.value).toBe("unchanged-raw-identity");
      expect(result.writeActionsAttempted).toBe(false);
      expect(result.stoppedBeforeSaveSubmitUpdateClose).toBe(true);
    } finally {
      restoreGlobals();
    }
  });

  it("blocks the browser-evaluated default-field sink when a reference value is raw identity-shaped", async () => {
    const rawReferenceValue = "b".repeat(32);
    const displayReferenceControl = fakeIncidentDomControl("input", { name: "sys_display.incident.caller_id" });
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [displayReferenceControl],
      href: "https://qa.service-now.example.invalid/nav_to.do"
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields: [plannedIncidentDefaultField("requester", "Requester", rawReferenceValue, "qa-default-profile")],
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => ({ currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] })"
      );

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe("reference-value-not-display-safe");
      expect(result.filledFields).toEqual([]);
      expect(result.blockedFields).toEqual([
        {
          key: "requester",
          label: "Requester",
          controlType: "reference",
          valueLength: rawReferenceValue.length,
          blockedReason: "reference-value-not-display-safe"
        }
      ]);
      expect(displayReferenceControl.value).toBe("");
      expect(JSON.stringify(result)).not.toContain(rawReferenceValue);
    } finally {
      restoreGlobals();
    }
  });

  it("fills browser-evaluated reviewed reference select text and textarea controls without write actions", async () => {
    const plannedFields = reviewedFullFieldPlannedIncidentDefaultFields();
    const controlByKey: Partial<Record<QaIncidentDefaultFieldKey, FakeIncidentDomControl>> = {
      requester: fakeIncidentDomControl("input", { name: "sys_display.incident.caller_id" }),
      category: fakeIncidentDomControl("select", { name: "incident.category" }, [
        { value: "category-safe-option", textContent: alanQaIncidentTestDefaults.category }
      ]),
      subcategory: fakeIncidentDomControl("select", { name: "incident.subcategory" }, [
        { value: "subcategory-safe-option", textContent: alanQaIncidentTestDefaults.subcategory }
      ]),
      location: fakeIncidentDomControl("input", { name: "sys_display.incident.location" }),
      assignmentGroup: fakeIncidentDomControl("input", { name: "sys_display.incident.assignment_group" }),
      assignedTo: fakeIncidentDomControl("input", { name: "sys_display.incident.assigned_to" }),
      shortDescription: fakeIncidentDomControl("input", { name: "incident.short_description" }),
      description: fakeIncidentDomControl("textarea", { name: "incident.description" }),
      workNotes: fakeIncidentDomControl("textarea", { name: "incident.work_notes" })
    };
    const requiredControl = (fieldKey: QaIncidentDefaultFieldKey) => {
      const control = controlByKey[fieldKey];
      if (!control) {
        throw new Error(`Missing fake Incident DOM control for planned field ${fieldKey}`);
      }
      return control;
    };
    const restoreGlobals = installFakeBrowserGlobals({
      controls: plannedFields.map((field) => requiredControl(field.key)),
      href: "https://qa.service-now.example.invalid/nav_to.do"
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields,
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => ({ currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] })"
      );

      expect(result.status).toBe("completed");
      expect(result.filledFields.map((field) => field.key)).toEqual(plannedFields.map((field) => field.key));
      expect(result.writeActionsAttempted).toBe(false);
      expect(result.stoppedBeforeSaveSubmitUpdateClose).toBe(true);
      expect(requiredControl("requester").value).toBe(alanQaIncidentTestDefaults.requester);
      expect(requiredControl("category").value).toBe("category-safe-option");
      expect(requiredControl("subcategory").value).toBe("subcategory-safe-option");
      expect(requiredControl("location").value).toBe(alanQaIncidentTestDefaults.location);
      expect(requiredControl("assignmentGroup").value).toBe(qaAssignmentGroupName);
      expect(requiredControl("assignedTo").value).toBe(alanQaIncidentTestDefaults.assignedTo);
      expect(requiredControl("shortDescription").value).toBe(qaDefaultTextFieldValues.shortDescription);
      expect(requiredControl("description").value).toBe(qaDefaultTextFieldValues.description);
      expect(requiredControl("workNotes").value).toBe(qaDefaultTextFieldValues.workNotes);
    } finally {
      restoreGlobals();
    }
  });

  it("blocks the browser-evaluated default-field sink when a reviewed select option cannot be matched", async () => {
    const categoryControl = fakeIncidentDomControl("select", { name: "incident.category" }, [
      { value: "different-option", textContent: "Different safe option" }
    ]);
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [categoryControl],
      href: "https://qa.service-now.example.invalid/nav_to.do"
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields: [plannedIncidentDefaultField("category", "Category", alanQaIncidentTestDefaults.category, "qa-default-profile")],
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => ({ currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] })"
      );

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe("field-option-not-found");
      expect(result.blockedFields).toEqual([
        {
          key: "category",
          label: "Category",
          controlType: "select",
          valueLength: alanQaIncidentTestDefaults.category.length,
          blockedReason: "field-option-not-found"
        }
      ]);
      expect(categoryControl.value).toBe("");
    } finally {
      restoreGlobals();
    }
  });

  it.each([
    {
      key: "requester" as const,
      label: "Requester",
      tagName: "input" as const,
      name: "sys_display.incident.caller_id",
      controlType: "reference" as const
    },
    {
      key: "category" as const,
      label: "Category",
      tagName: "select" as const,
      name: "incident.category",
      controlType: "select" as const
    },
    {
      key: "shortDescription" as const,
      label: "Short description",
      tagName: "input" as const,
      name: "incident.short_description",
      controlType: "text" as const
    },
    {
      key: "description" as const,
      label: "Description",
      tagName: "textarea" as const,
      name: "incident.description",
      controlType: "textarea" as const
    },
    {
      key: "workNotes" as const,
      label: "Work notes",
      tagName: "textarea" as const,
      name: "incident.work_notes",
      controlType: "textarea" as const
    }
  ])("blocks the browser-evaluated default-field sink for duplicate visible writable $label controls", async (fieldCase) => {
    const firstControl = fakeIncidentDomControl(fieldCase.tagName, { name: fieldCase.name });
    const secondControl = fakeIncidentDomControl(fieldCase.tagName, { name: fieldCase.name });
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [firstControl, secondControl],
      href: "https://qa.service-now.example.invalid/nav_to.do"
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields: [{ key: fieldCase.key, label: fieldCase.label, value: "safe text", valueLength: 9 }],
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => ({ currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] })"
      );

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe("field-control-ambiguous");
      expect(result.blockedFields).toEqual([
        {
          key: fieldCase.key,
          label: fieldCase.label,
          controlType: fieldCase.controlType,
          valueLength: 9,
          blockedReason: "field-control-ambiguous"
        }
      ]);
      expect(firstControl.value).toBe("");
      expect(secondControl.value).toBe("");
    } finally {
      restoreGlobals();
    }
  });

  it("blocks the browser-evaluated default-field sink when an approved text key resolves to a select control", async () => {
    const selectControl = fakeIncidentDomControl("select", { name: "incident.short_description" });
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [selectControl],
      href: "https://qa.service-now.example.invalid/nav_to.do"
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields: [{ key: "shortDescription", label: "Short description", value: "safe text", valueLength: 9 }],
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => ({ currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] })"
      );

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe("unsupported-control-type");
      expect(selectControl.value).toBe("");
    } finally {
      restoreGlobals();
    }
  });
});

type FakeCdpPageTarget = {
  type?: string;
  url?: string;
  webSocketDebuggerUrl?: string;
};

type FakeIncidentSelectOption = {
  value: string;
  textContent: string;
  selected?: boolean;
};

type FakeIncidentDomControl = {
  tagName: string;
  value: string;
  type: string;
  disabled: boolean;
  readOnly: boolean;
  options?: FakeIncidentSelectOption[];
  ownerDocument?: FakeIncidentDocument;
  textContent?: string;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  getBoundingClientRect(): { width: number; height: number };
  closest(): null;
  dispatchEvent(): boolean;
};

type FakeIncidentWindow = {
  document?: FakeIncidentDocument;
  frames: FakeIncidentWindow[];
  getComputedStyle(): { display: string; visibility: string };
};

type FakeIncidentDocument = {
  title: string;
  readyState: string;
  defaultView: FakeIncidentWindow;
  querySelectorAll(selector: string): FakeIncidentDomControl[];
  querySelector(): null;
};

function fakeIncidentDomControl(
  tagName: "input" | "textarea" | "select",
  attributes: Record<string, string>,
  options: FakeIncidentSelectOption[] = []
): FakeIncidentDomControl {
  return {
    tagName: tagName.toUpperCase(),
    value: "",
    type: attributes.type ?? (tagName === "input" ? "text" : tagName),
    disabled: false,
    readOnly: false,
    options: tagName === "select" ? options : undefined,
    textContent: "",
    getAttribute(name: string) {
      return attributes[name] ?? null;
    },
    hasAttribute(name: string) {
      return Object.prototype.hasOwnProperty.call(attributes, name);
    },
    getBoundingClientRect() {
      return { width: 160, height: 24 };
    },
    closest() {
      return null;
    },
    dispatchEvent() {
      return true;
    }
  };
}

function fakeIncidentDocument(controls: FakeIncidentDomControl[], queryProbe?: { calls: number }): FakeIncidentDocument {
  const fakeWindow: FakeIncidentWindow = {
    frames: [],
    getComputedStyle: () => ({ display: "block", visibility: "visible" })
  };
  const fakeDocument: FakeIncidentDocument = {
    title: "Incident form",
    readyState: "complete",
    defaultView: fakeWindow,
    querySelectorAll(selector: string) {
      if (queryProbe) queryProbe.calls += 1;
      return selector === "input, textarea, select" ? controls : [];
    },
    querySelector() {
      if (queryProbe) queryProbe.calls += 1;
      return null;
    }
  };
  fakeWindow.document = fakeDocument;
  for (const control of controls) {
    control.ownerDocument = fakeDocument;
  }
  return fakeDocument;
}

function installFakeBrowserGlobals(options: {
  controls: FakeIncidentDomControl[];
  href: string;
  frameDocuments?: FakeIncidentDocument[];
  queryProbe?: { calls: number };
}): () => void {
  const fakeDocument = fakeIncidentDocument(options.controls, options.queryProbe);
  const frameWindows = (options.frameDocuments ?? []).map((document) => document.defaultView);
  fakeDocument.defaultView.frames = frameWindows;

  const globals = globalThis as unknown as Record<string, unknown>;
  const previousDocument = globals.document;
  const previousWindow = globals.window;
  const previousLocation = globals.location;
  globals.document = fakeDocument;
  globals.window = fakeDocument.defaultView;
  globals.location = { href: options.href };

  return () => {
    globals.document = previousDocument;
    globals.window = previousWindow;
    globals.location = previousLocation;
  };
}

function installFakeCdpTargetList(targets: FakeCdpPageTarget[]): () => void {
  const globals = globalThis as unknown as { fetch?: unknown };
  const previousFetch = globals.fetch;
  globals.fetch = async () => ({
    ok: true,
    json: async () => targets
  });

  return () => {
    globals.fetch = previousFetch;
  };
}

function installFailingCdpTargetListFetch(): () => void {
  const globals = globalThis as unknown as { fetch?: unknown };
  const previousFetch = globals.fetch;
  globals.fetch = async () => {
    throw new Error("simulated-local-cdp-target-list-unreachable");
  };

  return () => {
    globals.fetch = previousFetch;
  };
}

function installCdpFetchProbe(): { readonly calls: number; restore: () => void } {
  const globals = globalThis as unknown as { fetch?: unknown };
  const previousFetch = globals.fetch;
  let calls = 0;
  globals.fetch = async () => {
    calls += 1;
    throw new Error("Fetch must not be called for a denied browser debugging endpoint.");
  };

  return {
    get calls() {
      return calls;
    },
    restore() {
      globals.fetch = previousFetch;
    }
  };
}

async function startFakeWindowsLocalCdpEndpoint(): Promise<{ endpoint: string; close: () => Promise<void> }> {
  const runtimeValue = {
    currentUrl: currentQaIncidentUrl,
    pageFingerprint: "matched-runtime-response",
    fields: []
  };
  const webSocketServer = createTcpServer((socket) => handleFakeCdpWebSocket(socket, runtimeValue));
  await listen(webSocketServer);
  const webSocketPort = (webSocketServer.address() as AddressInfo).port;

  const httpServer = createHttpServer((request, response) => {
    if (request.url !== "/json/list") {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify([
        {
          type: "page",
          url: currentQaIncidentUrl,
          webSocketDebuggerUrl: localCdpWebSocketUrl("incident", webSocketPort)
        }
      ])
    );
  });
  await listen(httpServer);
  const httpPort = (httpServer.address() as AddressInfo).port;

  return {
    endpoint: localCdpHttpEndpoint(httpPort),
    async close() {
      await Promise.all([closeServer(httpServer), closeServer(webSocketServer)]);
    }
  };
}

function handleFakeCdpWebSocket(socket: Socket, runtimeValue: Record<string, unknown>): void {
  socket.once("data", (requestBuffer) => {
    const requestText = requestBuffer.toString("utf8");
    const key = requestText.match(/sec-websocket-key:\s*(.+)/i)?.[1]?.trim();
    if (!key) {
      socket.destroy();
      return;
    }
    const accept = createHash("sha1")
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest("base64");
    socket.write(
      [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${accept}`,
        "",
        ""
      ].join("\r\n")
    );
    socket.write(encodeWebSocketText(JSON.stringify({ method: "Runtime.consoleAPICalled", params: { type: "log" } })));
    socket.once("data", (frame) => {
      const request = JSON.parse(decodeWebSocketText(frame)) as { id?: number };
      socket.write(
        encodeWebSocketText(
          JSON.stringify({
            id: request.id,
            result: {
              result: {
                type: "object",
                value: runtimeValue
              }
            }
          })
        )
      );
      socket.write(Buffer.from([0x88, 0x00]));
      socket.end();
    });
  });
}

function encodeWebSocketText(text: string): Buffer {
  const payload = Buffer.from(text, "utf8");
  if (payload.length < 126) {
    return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  }
  if (payload.length < 65_536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }
  throw new Error("Test WebSocket payload must remain below 64 KiB.");
}

function decodeWebSocketText(frame: Buffer): string {
  const masked = (frame[1] & 0x80) === 0x80;
  let length = frame[1] & 0x7f;
  let offset = 2;
  if (length === 126) {
    length = frame.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    throw new Error("Large test WebSocket frames are not supported.");
  }
  const mask = masked ? frame.subarray(offset, offset + 4) : Buffer.alloc(0);
  if (masked) offset += 4;
  const payload = Buffer.from(frame.subarray(offset, offset + length));
  if (masked) {
    for (let index = 0; index < payload.length; index += 1) {
      payload[index] ^= mask[index % 4];
    }
  }
  return payload.toString("utf8");
}

async function listen(server: HttpServer | TcpServer): Promise<void> {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
}

async function closeServer(server: HttpServer | TcpServer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function runWindowsLocalCdpHelper(input: {
  endpoint: string;
  targetUrl: string;
  expressionBase64: string;
}): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const helperScriptPath = toWindowsTestPath(
      fileURLToPath(new URL("../../../scripts/windows/evaluate-local-cdp-expression.ps1", import.meta.url))
    );
    const child = spawn(windowsPowerShellExecutablePath, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", helperScriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (exitCode) => resolve({ exitCode, stdout: stdout.trim(), stderr: stderr.trim() }));
    child.stdin.end(JSON.stringify(input), "utf8");
  });
}

function toWindowsTestPath(pathValue: string): string {
  try {
    return execFileSync("wslpath", ["-w", pathValue], { encoding: "utf8" }).trim();
  } catch {
    return pathValue;
  }
}

function fakeDriver(
  inspections: QaAutofillRuntimeInspection[]
): QaAutofillRuntimePageDriver & { fillCalls: QaAutofillOperation[][]; inspectCalls: number } {
  const fillCalls: QaAutofillOperation[][] = [];
  let inspectionIndex = 0;
  let inspectCalls = 0;
  return {
    fillCalls,
    get inspectCalls() {
      return inspectCalls;
    },
    async inspectAllowedTextFields() {
      inspectCalls += 1;
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

function fakeDefaultFieldDriver(
  inspectionResult: QaIncidentFieldRuntimeInspection
): QaIncidentDefaultFieldAutofillRuntimePageDriver & { inspectCalls: number; fillCalls: Array<{ plannedFields: QaIncidentDefaultPlannedField[] }> } {
  let inspectCalls = 0;
  const fillCalls: Array<{ plannedFields: QaIncidentDefaultPlannedField[] }> = [];
  return {
    get inspectCalls() {
      return inspectCalls;
    },
    fillCalls,
    async inspectIncidentFormFields() {
      inspectCalls += 1;
      return inspectionResult;
    },
    async fillIncidentDefaultFields(request) {
      fillCalls.push({ plannedFields: request.plannedFields as QaIncidentDefaultPlannedField[] });
      return {
        status: "completed",
        filledFields: request.plannedFields.map((field) => ({
          key: field.key,
          label: field.label,
          valueLength: field.valueLength
        })),
        blockedFields: [],
        writeActionsAttempted: false,
        artifactsCaptured: false,
        serviceNowApiCalled: false,
        browserProcessLaunched: false,
        stoppedBeforeSaveSubmitUpdateClose: true
      };
    }
  };
}

function routeOutAssignmentGroup(): string {
  return "QA route-out assignment group placeholder";
}

function plannedIncidentDefaultFields(): QaIncidentDefaultPlannedField[] {
  return [
    plannedIncidentDefaultField("requester", "Requester", alanQaIncidentTestDefaults.requester, "qa-default-profile"),
    plannedIncidentDefaultField("category", "Category", alanQaIncidentTestDefaults.category, "qa-default-profile"),
    plannedIncidentDefaultField("subcategory", "Subcategory", alanQaIncidentTestDefaults.subcategory, "qa-default-profile"),
    plannedIncidentDefaultField("location", "Location", alanQaIncidentTestDefaults.location, "qa-default-profile"),
    {
      ...plannedIncidentDefaultField("channel", "Channel", "", "operator-confirmation-required"),
      manualConfirmationRequired: true
    },
    plannedIncidentDefaultField("impact", "Impact", alanQaIncidentTestDefaults.impact, "qa-default-profile"),
    plannedIncidentDefaultField("urgency", "Urgency", alanQaIncidentTestDefaults.urgency, "qa-default-profile"),
    plannedIncidentDefaultField("assignmentGroup", "Assignment group", qaAssignmentGroupName, "qa-default-profile"),
    plannedIncidentDefaultField("assignedTo", "Assigned to", alanQaIncidentTestDefaults.assignedTo, "qa-default-profile"),
    plannedIncidentDefaultField("shortDescription", "Short description", qaDefaultTextFieldValues.shortDescription, "ticket-draft"),
    plannedIncidentDefaultField("description", "Description", qaDefaultTextFieldValues.description, "ticket-draft"),
    plannedIncidentDefaultField("workNotes", "Work notes", qaDefaultTextFieldValues.workNotes, "ticket-draft-with-qa-prefix")
  ];
}

function reviewedFullFieldPlannedIncidentDefaultFields(): QaIncidentDefaultPlannedField[] {
  return plannedIncidentDefaultFields().filter((field) => !["channel", "impact", "urgency"].includes(field.key));
}

function plannedIncidentDefaultField(
  key: QaIncidentDefaultPlannedField["key"],
  label: string,
  value: string,
  source: QaIncidentDefaultPlannedField["source"]
): QaIncidentDefaultPlannedField {
  return {
    key,
    label,
    requirement: "required",
    value,
    valueLength: value.length,
    source,
    autofillAllowed: false
  };
}

function incidentFieldInspection(
  overrides: Partial<QaIncidentFieldRuntimeInspection> = {}
): QaIncidentFieldRuntimeInspection {
  return {
    currentUrl: currentQaIncidentUrl,
    pageFingerprint: "incident-field-fingerprint",
    fields: incidentDefaultFields(),
    ...overrides
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

function inspection(overrides: Partial<QaAutofillRuntimeInspection> = {}): QaAutofillRuntimeInspection {
  return {
    currentUrl: currentQaIncidentUrl,
    pageFingerprint: "reviewed-page",
    fields: allFoundFields,
    unexpectedRequiredFieldCount: 0,
    ...overrides
  };
}

function replaceField(field: QaAutofillFixtureField): QaAutofillFixtureField[] {
  return allFoundFields.map((candidate) => (candidate.key === field.key ? field : candidate));
}

function completeDraft(overrides: Partial<TicketDraft> = {}): TicketDraft {
  return {
    id: "draft-1",
    sourceContextId: "context-1",
    ticketType: "incident",
    shortDescription: field("VPN access issue after MFA change"),
    description: field("Fake sanitized VPN issue details for QA autofill usability test."),
    workNotes: field("Fake sanitized internal work note for QA autofill usability test."),
    caller: field("Demo requester"),
    category: field("Network"),
    subcategory: field("VPN"),
    assignmentGroup: field("Service Desk"),
    impact: field("3 - Low"),
    urgency: field("3 - Low"),
    priority: field("4 - Low"),
    kbMatches: [],
    riskFlags: [],
    missingInfoQuestions: [],
    ...overrides
  };
}

function field(value: string): FieldDraft {
  return {
    value,
    confidence: 0.9,
    evidence: "test",
    editable: true
  };
}
