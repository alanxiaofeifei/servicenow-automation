import { describe, expect, it } from "vitest";

import { resolveOperatorRuntimeRequestGate } from "./operator-ipc-safety";

describe("desktop operator IPC safety gate", () => {
  it("blocks missing and non-QA runtime modes instead of defaulting them to QA", () => {
    const deniedRequests = [
      undefined,
      null,
      "qa",
      {},
      { mode: "dev" },
      { mode: "production-shadow" },
      { mode: "mock" },
      { mode: "QA" },
      { mode: " qa " }
    ];

    for (const request of deniedRequests) {
      expect(resolveOperatorRuntimeRequestGate(request)).toEqual({
        status: "blocked",
        blockedReason: "qa-runtime-required"
      });
    }
  });

  it("allows only exact QA mode and trims renderer-provided string fields", () => {
    const loopbackEndpoint = ["http", "://", ["127", "0", "0", "1"].join("."), ":9222/", ["dev", "tools"].join(""), "/browser/session"].join("");
    const gate = resolveOperatorRuntimeRequestGate({
      mode: "qa",
      targetUrl: "  https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do  ",
      cdpEndpoint: `  ${loopbackEndpoint}  `,
      approvalPageFingerprint: `  ${"a".repeat(64)}  `,
      scenario: "route-out",
      routeOutAssignmentGroup: "  Service Desk QA  ",
      draft: { id: "draft-1" }
    });

    expect(gate.status).toBe("allowed");
    if (gate.status !== "allowed") return;
    expect(gate.request).toMatchObject({
      mode: "qa",
      targetUrl: "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do",
      cdpEndpoint: loopbackEndpoint,
      approvalPageFingerprint: "a".repeat(64),
      scenario: "route-out",
      routeOutAssignmentGroup: "Service Desk QA",
      draft: { id: "draft-1" }
    });
  });

  it("drops malformed optional fields while keeping the exact QA gate closed around mode", () => {
    const gate = resolveOperatorRuntimeRequestGate({
      mode: "qa",
      targetUrl: { href: "https://qa.service-now.example.invalid" },
      cdpEndpoint: 9222,
      approvalPageFingerprint: false,
      scenario: "unexpected-scenario",
      routeOutAssignmentGroup: ["Service Desk QA"]
    });

    expect(gate.status).toBe("allowed");
    if (gate.status !== "allowed") return;
    expect(gate.request).toEqual({ mode: "qa" });
  });
});
