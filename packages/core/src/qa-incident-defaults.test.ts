import { describe, expect, it } from "vitest";

import type { FieldDraft, TicketDraft } from "./models";
import {
  applyQaWorkNotesPrefix,
  buildQaIncidentDefaultRuntimeTextFieldPlan,
  buildQaIncidentDefaultValuePlan,
  executeQaIncidentDefaultFieldEvidenceVerification,
  executeQaIncidentDefaultFieldFixture,
  alanQaIncidentTestDefaults,
  type QaIncidentDefaultFieldKey,
  type QaIncidentDefaultFixtureControl,
  type QaIncidentFormFieldEvidence
} from "./qa-incident-defaults";

describe("QA incident default value planning", () => {
  it("keeps committed QA default values neutral and non-operational", () => {
    const neutralDefaults = [
      alanQaIncidentTestDefaults.requester,
      alanQaIncidentTestDefaults.category,
      alanQaIncidentTestDefaults.subcategory,
      alanQaIncidentTestDefaults.location,
      alanQaIncidentTestDefaults.impact,
      alanQaIncidentTestDefaults.urgency,
      alanQaIncidentTestDefaults.assignmentGroup,
      alanQaIncidentTestDefaults.assignedTo,
      alanQaIncidentTestDefaults.workNotesPrefix
    ];

    expect(neutralDefaults.every((value) => value.startsWith("QA "))).toBe(true);
    expect(alanQaIncidentTestDefaults.routeOutState).toBe("New");
  });

  it("plans neutral QA defaults for detected required and recommended fields without enabling autofill", () => {
    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: initialCreateEvidence(),
      scenario: "initial-create"
    });

    expect(plan.status).toBe("ready-for-local-review");
    expect(plan.blockedReason).toBeUndefined();
    expect(plan.plannedFields.map((field) => field.key)).toEqual([
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
    expect(valueFor(plan, "requester")).toBe(alanQaIncidentTestDefaults.requester);
    expect(valueFor(plan, "category")).toBe(alanQaIncidentTestDefaults.category);
    expect(valueFor(plan, "subcategory")).toBe(alanQaIncidentTestDefaults.subcategory);
    expect(valueFor(plan, "location")).toBe(alanQaIncidentTestDefaults.location);
    expect(fieldFor(plan, "channel")).toMatchObject({
      value: "",
      valueLength: 0,
      source: "operator-confirmation-required",
      manualConfirmationRequired: true
    });
    expect(valueFor(plan, "impact")).toBe(alanQaIncidentTestDefaults.impact);
    expect(valueFor(plan, "urgency")).toBe(alanQaIncidentTestDefaults.urgency);
    expect(valueFor(plan, "assignmentGroup")).toBe(alanQaIncidentTestDefaults.assignmentGroup);
    expect(valueFor(plan, "assignedTo")).toBe(alanQaIncidentTestDefaults.assignedTo);
    expect(valueFor(plan, "workNotes")).toBe(
      applyQaWorkNotesPrefix(completeDraft().workNotes?.value ?? "", alanQaIncidentTestDefaults.workNotesPrefix)
    );
    expect(plan.plannedFields.find((field) => field.key === "subcategory")?.requirement).toBe("recommended");
    expect(plan.plannedFields.every((field) => field.autofillAllowed === false)).toBe(true);
    expect(plan.safety).toMatchObject({
      localPlanOnly: true,
      browserAutomationAllowed: false,
      serviceNowApiAllowed: false,
      saveSubmitUpdateCloseAllowed: false,
      noLiveFieldMutation: true,
      productionWriteAllowed: false
    });
    expect(JSON.stringify(plan)).not.toContain("querySelector");
    expect(JSON.stringify(plan)).not.toContain("dispatchEvent");
    expect(JSON.stringify(plan)).not.toContain("sysverb");
  });

  it("builds a runtime text-field-only execution plan from the full default-field review plan", () => {
    const fullPlan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: initialCreateEvidence(),
      scenario: "initial-create"
    });

    const runtimePlan = buildQaIncidentDefaultRuntimeTextFieldPlan(fullPlan);

    expect(fullPlan.plannedFields.map((field) => field.key)).toContain("requester");
    expect(fullPlan.plannedFields.map((field) => field.key)).toContain("category");
    expect(fullPlan.plannedFields.map((field) => field.key)).toContain("assignmentGroup");
    expect(runtimePlan.status).toBe("ready-for-local-review");
    expect(runtimePlan.plannedFields.map((field) => field.key)).toEqual([
      "shortDescription",
      "description",
      "workNotes"
    ]);
    expect(runtimePlan.plannedFields.every((field) => field.autofillAllowed === false)).toBe(true);
    expect(runtimePlan.excludedFieldKeys).toEqual([
      "requester",
      "category",
      "subcategory",
      "location",
      "channel",
      "impact",
      "urgency",
      "assignmentGroup",
      "assignedTo"
    ]);
    expect(runtimePlan.stopRules).toContain(
      "Runtime autofill is limited to text fields only: Short description, Description, and Work notes. Reference, select, assignment, requester, state, and routing fields remain verify-only."
    );
  });

  it("plans route-out with State set to New before assignment group and Assigned to left blank", () => {
    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: routeOutEvidence(),
      scenario: "route-out",
      routeOutAssignmentGroup: routeOutAssignmentGroup()
    });

    expect(plan.status).toBe("ready-for-local-review");
    const keys = plan.plannedFields.map((field) => field.key);
    expect(keys.indexOf("state")).toBeLessThan(keys.indexOf("assignmentGroup"));
    expect(valueFor(plan, "state")).toBe("New");
    expect(valueFor(plan, "assignmentGroup")).toBe(routeOutAssignmentGroup());
    expect(valueFor(plan, "assignedTo")).toHaveLength(0);
    expect(plan.plannedFields.find((field) => field.key === "assignedTo")?.source).toBe("route-out-clear-assigned-to");
    expect(plan.stopRules).toContain("Route-out planning must set State to New before changing Assignment group and must leave Assigned to blank.");
  });

  it("fails closed and redacts labels when a required field is not recognized", () => {
    const rawRequiredLabel = "Confidential custom required routing field";
    const rawRequiredName = "incident.u_confidential_required_route";

    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: [
        ...initialCreateEvidence(),
        evidence({ name: rawRequiredName, label: rawRequiredLabel, required: true, starred: true, type: "text" })
      ],
      scenario: "initial-create"
    });
    const serialized = JSON.stringify(plan);

    expect(plan.status).toBe("blocked");
    expect(plan.blockedReason).toBe("unrecognized-required-field");
    expect(plan.unrecognizedRequiredFieldCount).toBe(1);
    expect(plan.unrecognizedRequiredFields).toEqual([{ label: "redacted-required-field", requirement: "required" }]);
    expect(plan.operations).toEqual([]);
    expect(serialized).not.toContain(rawRequiredLabel);
    expect(serialized).not.toContain(rawRequiredName);
  });

  it("requires an explicit route-out target assignment group before planning route-out defaults", () => {
    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: routeOutEvidence(),
      scenario: "route-out"
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockedReason).toBe("route-out-assignment-group-required");
    expect(plan.plannedFields).toEqual([]);
    expect(plan.operations).toEqual([]);
  });

  it("verifies required/reference/select fixture controls without enabling live autofill", () => {
    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: initialCreateEvidence(),
      scenario: "initial-create"
    });

    const fixture = executeQaIncidentDefaultFieldFixture(plan, {
      controls: initialCreateControls(),
      unexpectedRequiredFieldCount: 0
    });
    const serialized = JSON.stringify(fixture);

    expect(fixture.status).toBe("verified");
    expect(fixture.verifiedFields.map((field) => field.key)).toEqual(plan.plannedFields.map((field) => field.key));
    expect(fixture.verifiedFields.find((field) => field.key === "requester")?.controlType).toBe("reference");
    expect(fixture.verifiedFields.find((field) => field.key === "category")?.controlType).toBe("select");
    expect(fixture.verifiedFields.find((field) => field.key === "shortDescription")?.controlType).toBe("text");
    expect(fixture.verifiedFields.every((field) => field.autofillAllowed === false)).toBe(true);
    expect(fixture.verifiedFields.every((field) => field.value === undefined)).toBe(true);
    expect(fixture.writeActionsAttempted).toBe(false);
    expect(fixture.browserProcessLaunched).toBe(false);
    expect(fixture.realServiceNowPageTouched).toBe(false);
    expect(fixture.serviceNowApiCalled).toBe(false);
    expect(fixture.saveSubmitUpdateCloseAttempted).toBe(false);
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
  });

  it("verifies route-out fields with State first and Assigned to intentionally blank", () => {
    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: routeOutEvidence(),
      scenario: "route-out",
      routeOutAssignmentGroup: routeOutAssignmentGroup()
    });

    const fixture = executeQaIncidentDefaultFieldFixture(plan, {
      controls: routeOutControls(),
      unexpectedRequiredFieldCount: 0
    });

    expect(fixture.status).toBe("verified");
    expect(fixture.verifiedFields.map((field) => field.key)).toEqual(["state", "assignmentGroup", "assignedTo", "workNotes"]);
    expect(fixture.verifiedFields.find((field) => field.key === "state")?.valueLength).toBe("New".length);
    expect(fixture.verifiedFields.find((field) => field.key === "assignedTo")?.valueLength).toBe(0);
    expect(fixture.writeActionsAttempted).toBe(false);
  });

  it("fails closed when no current-page Incident fields are recognized", () => {
    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: [],
      scenario: "initial-create"
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockedReason).toBe("no-recognized-incident-fields");
    expect(plan.plannedFields).toEqual([]);
    expect(plan.operations).toEqual([]);
  });

  it("verifies current-page read-only field evidence without enabling live autofill", () => {
    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: initialCreateEvidence(),
      scenario: "initial-create"
    });

    const verification = executeQaIncidentDefaultFieldEvidenceVerification(plan, initialCreateEvidence());
    const serialized = JSON.stringify(verification);

    expect(verification.status).toBe("verified");
    expect(verification.verifiedFields.map((field) => field.key)).toEqual(plan.plannedFields.map((field) => field.key));
    expect(verification.verifiedFields.find((field) => field.key === "requester")?.controlType).toBe("reference");
    expect(verification.verifiedFields.find((field) => field.key === "category")?.controlType).toBe("select");
    expect(verification.verifiedFields.every((field) => field.autofillAllowed === false)).toBe(true);
    expect(verification.verifiedFields.every((field) => field.value === undefined)).toBe(true);
    expect(verification.writeActionsAttempted).toBe(false);
    expect(verification.browserProcessLaunched).toBe(false);
    expect(verification.realServiceNowPageTouched).toBe(true);
    expect(verification.serviceNowApiCalled).toBe(false);
    expect(verification.saveSubmitUpdateCloseAttempted).toBe(false);
    expect(verification.operatorStopInstruction).toBe("current-page-readonly-verify-only-before-live-runtime");
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
  });

  it("fails closed when current-page read-only evidence has ambiguous, wrong-type, or non-writable controls", () => {
    const cases: Array<{ fields: QaIncidentFormFieldEvidence[]; expectedReason: string }> = [
      {
        fields: [
          ...initialCreateEvidence(),
          evidence({ name: "incident.u_duplicate_category", label: "Category", required: true, starred: true, type: "select" })
        ],
        expectedReason: "ambiguous-control"
      },
      {
        fields: replaceEvidence(initialCreateEvidence(), "shortDescription", {
          name: "incident.short_description",
          label: "Short description",
          required: true,
          starred: true,
          type: "select"
        }),
        expectedReason: "field-type-mismatch"
      },
      {
        fields: replaceEvidence(initialCreateEvidence(), "location", {
          name: "incident.location",
          label: "Location",
          required: true,
          starred: true,
          type: "reference",
          writable: false
        }),
        expectedReason: "non-writable-control"
      },
      {
        fields: replaceEvidence(initialCreateEvidence(), "requester", {
          name: "incident.caller_id",
          label: "Requester",
          required: true,
          starred: true,
          type: "reference",
          matchedControlCount: 2,
          visibleControlCount: 2
        }),
        expectedReason: "ambiguous-control"
      }
    ];

    for (const testCase of cases) {
      const plan = buildQaIncidentDefaultValuePlan({
        draft: completeDraft(),
        fields: testCase.fields,
        scenario: "initial-create"
      });
      const verification = executeQaIncidentDefaultFieldEvidenceVerification(plan, testCase.fields);

      expect(verification.status).toBe("blocked");
      expect(verification.blockedReason).toBe(testCase.expectedReason);
      expect(verification.verifiedFields).toEqual([]);
      expect(verification.writeActionsAttempted).toBe(false);
      expect(verification.realServiceNowPageTouched).toBe(true);
    }
  });

  it("fails closed on missing, ambiguous, wrong-type, non-writable, unexpected required controls, or blocked plans", () => {
    const plan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: initialCreateEvidence(),
      scenario: "initial-create"
    });
    const blockedPlan = buildQaIncidentDefaultValuePlan({
      draft: completeDraft(),
      fields: [...initialCreateEvidence(), evidence({ label: "Custom required", required: true, starred: true })],
      scenario: "initial-create"
    });
    const baseControls = initialCreateControls();
    const cases: Array<{ controls: QaIncidentDefaultFixtureControl[]; unexpectedRequiredFieldCount?: number; expectedReason: string }> = [
      {
        controls: replaceControl(baseControls, { key: "requester", matchedControlCount: 0, type: "reference", writable: true }),
        expectedReason: "missing-control"
      },
      {
        controls: replaceControl(baseControls, { key: "category", matchedControlCount: 2, type: "select", writable: true }),
        expectedReason: "ambiguous-control"
      },
      {
        controls: replaceControl(baseControls, { key: "shortDescription", matchedControlCount: 1, type: "select", writable: true }),
        expectedReason: "field-type-mismatch"
      },
      {
        controls: replaceControl(baseControls, { key: "location", matchedControlCount: 1, type: "reference", writable: false }),
        expectedReason: "non-writable-control"
      },
      {
        controls: baseControls,
        unexpectedRequiredFieldCount: 1,
        expectedReason: "unexpected-required-field"
      }
    ];

    for (const testCase of cases) {
      const fixture = executeQaIncidentDefaultFieldFixture(plan, {
        controls: testCase.controls,
        unexpectedRequiredFieldCount: testCase.unexpectedRequiredFieldCount ?? 0
      });

      expect(fixture.status).toBe("blocked");
      expect(fixture.blockedReason).toBe(testCase.expectedReason);
      expect(fixture.verifiedFields).toEqual([]);
      expect(fixture.writeActionsAttempted).toBe(false);
    }

    const blockedFixture = executeQaIncidentDefaultFieldFixture(blockedPlan, { controls: baseControls });
    expect(blockedFixture.status).toBe("blocked");
    expect(blockedFixture.blockedReason).toBe("plan-not-ready");
  });

  it("prefixes Work notes with the neutral QA prefix once", () => {
    const note = "QA analyst note";
    const prefixedNote = `${alanQaIncidentTestDefaults.workNotesPrefix} - ${note}`;

    expect(applyQaWorkNotesPrefix(note, alanQaIncidentTestDefaults.workNotesPrefix)).toBe(prefixedNote);
    expect(applyQaWorkNotesPrefix(prefixedNote, alanQaIncidentTestDefaults.workNotesPrefix)).toBe(prefixedNote);
  });
});

type PlanLike = ReturnType<typeof buildQaIncidentDefaultValuePlan>;

function routeOutAssignmentGroup(): string {
  return "QA route-out assignment group placeholder";
}

function fieldFor(plan: PlanLike, key: PlanLike["plannedFields"][number]["key"]): PlanLike["plannedFields"][number] {
  const field = plan.plannedFields.find((candidate) => candidate.key === key);
  expect(field, `Expected planned field ${key}`).toBeDefined();
  return field as PlanLike["plannedFields"][number];
}

function valueFor(plan: PlanLike, key: PlanLike["plannedFields"][number]["key"]): string {
  return fieldFor(plan, key).value;
}

function initialCreateEvidence(): QaIncidentFormFieldEvidence[] {
  return [
    evidence({ name: "incident.caller_id", label: "Requester", required: true, starred: true, type: "reference" }),
    evidence({ name: "incident.category", label: "Category", required: true, starred: true, type: "select" }),
    evidence({ name: "incident.subcategory", label: "Subcategory", type: "select" }),
    evidence({ name: "incident.location", label: "Location", required: true, starred: true, type: "reference" }),
    evidence({ name: "incident.contact_type", label: "Channel", required: true, starred: true, type: "select" }),
    evidence({ name: "incident.impact", label: "Impact", required: true, starred: true, type: "select" }),
    evidence({ name: "incident.urgency", label: "Urgency", required: true, starred: true, type: "select" }),
    evidence({ name: "incident.assignment_group", label: "Assignment group", required: true, starred: true, type: "reference" }),
    evidence({ name: "incident.assigned_to", label: "Assigned to", type: "reference" }),
    evidence({ name: "incident.short_description", label: "Short description", required: true, starred: true, type: "text" }),
    evidence({ name: "incident.description", label: "Description", required: true, starred: true, type: "textarea" }),
    evidence({ name: "incident.work_notes", label: "Work notes", type: "textarea" })
  ];
}

function routeOutEvidence(): QaIncidentFormFieldEvidence[] {
  return [
    evidence({ name: "incident.state", label: "State", type: "select" }),
    evidence({ name: "incident.assignment_group", label: "Assignment group", required: true, starred: true, type: "reference" }),
    evidence({ name: "incident.assigned_to", label: "Assigned to", type: "reference" }),
    evidence({ name: "incident.work_notes", label: "Work notes", type: "textarea" })
  ];
}

function initialCreateControls(): QaIncidentDefaultFixtureControl[] {
  return [
    control("requester", "reference"),
    control("category", "select"),
    control("subcategory", "select"),
    control("location", "reference"),
    control("channel", "select"),
    control("impact", "select"),
    control("urgency", "select"),
    control("assignmentGroup", "reference"),
    control("assignedTo", "reference"),
    control("shortDescription", "text"),
    control("description", "textarea"),
    control("workNotes", "textarea")
  ];
}

function routeOutControls(): QaIncidentDefaultFixtureControl[] {
  return [control("state", "select"), control("assignmentGroup", "reference"), control("assignedTo", "reference"), control("workNotes", "textarea")];
}

function control(
  key: QaIncidentDefaultFieldKey,
  type: QaIncidentDefaultFixtureControl["type"]
): QaIncidentDefaultFixtureControl {
  return {
    key,
    matchedControlCount: 1,
    type,
    writable: true
  };
}

function replaceControl(
  controls: QaIncidentDefaultFixtureControl[],
  replacement: QaIncidentDefaultFixtureControl
): QaIncidentDefaultFixtureControl[] {
  return controls.map((candidate) => (candidate.key === replacement.key ? replacement : candidate));
}

function replaceEvidence(
  fields: QaIncidentFormFieldEvidence[],
  key: QaIncidentDefaultFieldKey,
  replacement: Partial<QaIncidentFormFieldEvidence>
): QaIncidentFormFieldEvidence[] {
  const matchers: Record<QaIncidentDefaultFieldKey, RegExp> = {
    requester: /caller_id|requester/i,
    category: /incident\.category|\bcategory\b/i,
    subcategory: /subcategory/i,
    location: /location/i,
    channel: /contact_type|channel/i,
    impact: /impact/i,
    urgency: /urgency/i,
    assignmentGroup: /assignment_group|assignment group/i,
    assignedTo: /assigned_to|assigned to/i,
    state: /state/i,
    shortDescription: /short_description|short description/i,
    description: /incident\.description|\bdescription\b/i,
    workNotes: /work_notes|work notes/i
  };
  return fields.map((candidate) => {
    const haystack = `${candidate.name ?? ""} ${candidate.label ?? ""}`;
    return matchers[key].test(haystack) ? { ...candidate, ...replacement } : candidate;
  });
}

function evidence(overrides: Partial<QaIncidentFormFieldEvidence>): QaIncidentFormFieldEvidence {
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

function completeDraft(overrides: Partial<TicketDraft> = {}): TicketDraft {
  return {
    id: "draft-1",
    sourceContextId: "context-1",
    ticketType: "incident",
    shortDescription: field("Local QA access request for fixture user"),
    description: field("Fake local QA access-request description."),
    workNotes: field("Initial local QA triage note."),
    caller: field("Draft requester should be overridden by QA defaults"),
    category: field("Draft category should be overridden by QA defaults"),
    subcategory: field("Draft subcategory should be overridden by QA defaults"),
    assignmentGroup: field("Draft group should be overridden by QA defaults"),
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
