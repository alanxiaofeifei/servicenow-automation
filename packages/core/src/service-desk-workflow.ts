import type { SourceType, TicketDraft } from "./models";

export type RawIntakeSource =
  | "Teams message"
  | "ServiceNow Chat transcript"
  | "Shared mailbox item"
  | "Phone call"
  | "Self-service ticket"
  | SourceType;

export type ServiceNowChannel = "Chat" | "Email" | "Phone" | "Self-service";

export type ContactConfirmationState = {
  status: "Confirmed" | "Needs confirmation" | "Pending requester";
  summary: string;
};

export type EvidenceReviewState = {
  evidenceType: "none" | "screenshot" | "document" | "table";
  reviewState: "not reviewed" | "reviewed" | "needs manual check";
  extractedFacts: string[];
  safetyLabel: "No file upload, OCR, or external AI";
};

export type RoutingPlan = {
  stage1: {
    label: "Stage 1 - Service Desk Handling";
    ownerTeam: string;
    status: "New";
    action: string;
  };
  stage2: {
    label: "Stage 2 - Final Assignment";
    assignmentGroup: string;
    reason: string;
  };
};

export type WorkNotesPlan = {
  summary: string;
  warning: string;
  plannedNotes: string;
};

export const excelDryRunRowColumns = [
  "Created At",
  "Intake Source",
  "ServiceNow Channel",
  "Requester Display",
  "Language / SD Team",
  "Service Desk Owner / Initial Group",
  "Issue Type",
  "Category",
  "Subcategory",
  "Priority",
  "Short Description",
  "Final Assignment Group",
  "Work Notes Summary",
  "Handling Status",
  "Confirmation State",
  "Evidence Review State",
  "Fake Scenario ID",
  "Required Field Check",
  "Approval Phrase Gate",
  "Stop Rule Check",
  "QA Isolation Check",
  "QA Dry-run Outcome",
  "QA Trial Result",
  "Dry-run Result"
] as const;

export type ExcelDryRunRowColumn = (typeof excelDryRunRowColumns)[number];

export type ExcelDryRunRow = Record<ExcelDryRunRowColumn, string>;

export type ExcelDryRunRowPreview = {
  row: ExcelDryRunRow;
  csvRow: string;
  markdownSummary: string;
  safetyCopy: string;
};

export type ExcelDryRunWorkbookArtifact = {
  fileName: string;
  mimeType: typeof excelDryRunWorkbookMimeType;
  sheetName: string;
  bytes: Uint8Array;
  safetyCopy: string;
};

export type ExcelDryRunWorkbookArtifactOptions = {
  fileTimestamp?: string;
  sheetName?: string;
};

export const excelDryRunWorkbookMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type ServiceDeskWorkflowPreviewInput = {
  createdAt: string;
  rawIntakeSource: RawIntakeSource;
  requesterDisplay: string;
  languageOrServiceDeskTeam: string;
  issueType: string;
  draft: TicketDraft;
  serviceDeskOwnerTeam: string;
  finalAssignmentGroup?: string;
  finalAssignmentReason?: string;
  handlingStatus?: string;
  confirmationState?: ContactConfirmationState;
  evidenceReviewState?: EvidenceReviewState;
  fakeScenarioId?: string;
  requiredFieldCheck?: string;
  approvalPhraseGate?: string;
  stopRuleCheck?: string;
  qaIsolationCheck?: string;
  qaDryRunOutcome?: string;
  qaTrialResult?: string;
};

export type ExcelDryRunRowPreviewInput = {
  createdAt: string;
  rawIntakeSource: RawIntakeSource;
  requesterDisplay: string;
  languageOrServiceDeskTeam: string;
  issueType: string;
  draft: TicketDraft;
  serviceDeskOwnerTeam: string;
  finalAssignmentGroup: string;
  workNotesSummary: string;
  handlingStatus: string;
  confirmationState: ContactConfirmationState;
  evidenceReviewState: EvidenceReviewState;
  fakeScenarioId?: string;
  requiredFieldCheck?: string;
  approvalPhraseGate?: string;
  stopRuleCheck?: string;
  qaIsolationCheck?: string;
  qaDryRunOutcome?: string;
  qaTrialResult: string;
};

export type ServiceDeskWorkflowPreview = {
  workflowStages: string[];
  rawIntakeSource: RawIntakeSource;
  mappedServiceNowChannel: ServiceNowChannel;
  confirmationState: ContactConfirmationState;
  evidenceReviewState: EvidenceReviewState;
  incidentDraftMapping: {
    category: string;
    subcategory: string;
    priority: string;
    shortDescription: string;
  };
  routingPlan: RoutingPlan;
  workNotesPlan: WorkNotesPlan;
  excelDryRunRowPreview: ExcelDryRunRowPreview;
  csvRow: string;
  markdownSummary: string;
  safety: {
    noExternalActionPerformed: true;
    noServiceNowWrite: true;
    noExcelWrite: true;
    noGraphWrite: true;
    message: string;
  };
};

export function mapIntakeSourceToServiceNowChannel(source: RawIntakeSource): ServiceNowChannel {
  switch (source) {
    case "Teams message":
    case "ServiceNow Chat transcript":
    case "teams_web":
    case "servicenow_chat":
      return "Chat";
    case "Shared mailbox item":
    case "outlook_web":
    case "outlook_classic":
      return "Email";
    case "Phone call":
      return "Phone";
    case "Self-service ticket":
    case "servicenow_self_service":
    case "manual_paste":
      return "Self-service";
  }
}

export function buildExcelDryRunRowPreview(input: ExcelDryRunRowPreviewInput): ExcelDryRunRowPreview {
  const row: ExcelDryRunRow = {
    "Created At": input.createdAt,
    "Intake Source": input.rawIntakeSource,
    "ServiceNow Channel": mapIntakeSourceToServiceNowChannel(input.rawIntakeSource),
    "Requester Display": input.requesterDisplay,
    "Language / SD Team": input.languageOrServiceDeskTeam,
    "Service Desk Owner / Initial Group": input.serviceDeskOwnerTeam,
    "Issue Type": input.issueType,
    Category: draftFieldValue(input.draft.category),
    Subcategory: draftFieldValue(input.draft.subcategory),
    Priority: draftFieldValue(input.draft.priority),
    "Short Description": input.draft.shortDescription.value,
    "Final Assignment Group": input.finalAssignmentGroup,
    "Work Notes Summary": input.workNotesSummary,
    "Handling Status": input.handlingStatus,
    "Confirmation State": input.confirmationState.status,
    "Evidence Review State": `${input.evidenceReviewState.reviewState} (${input.evidenceReviewState.evidenceType})`,
    "Fake Scenario ID": input.fakeScenarioId ?? "not specified - fake/sanitized only",
    "Required Field Check": input.requiredFieldCheck ?? defaultRequiredFieldCheck(),
    "Approval Phrase Gate": input.approvalPhraseGate ?? defaultApprovalPhraseGate(),
    "Stop Rule Check": input.stopRuleCheck ?? defaultStopRuleCheck(),
    "QA Isolation Check": input.qaIsolationCheck ?? "Pending explicit QA isolation confirmation before field trial.",
    "QA Dry-run Outcome": input.qaDryRunOutcome ?? "Not ready for QA write; dry-run preview only.",
    "QA Trial Result": input.qaTrialResult,
    "Dry-run Result": "Preview only - local XLSX artifact generated; no Graph, cloud workbook, or ServiceNow write."
  };

  return {
    row,
    csvRow: buildCsvRow(row),
    markdownSummary: buildExcelRowMarkdownSummary(row),
    safetyCopy: "This row is generated locally from the reviewed draft. XLSX export creates a local dry-run file only; no Graph, cloud workbook, or ServiceNow write is performed."
  };
}

export function buildServiceDeskWorkflowPreview(
  input: ServiceDeskWorkflowPreviewInput
): ServiceDeskWorkflowPreview {
  const finalAssignmentGroup = input.finalAssignmentGroup ?? draftFieldValue(input.draft.assignmentGroup);
  const workNotesPlan = buildWorkNotesPlan(input.draft);
  const confirmationState = input.confirmationState ?? defaultConfirmationState();
  const evidenceReviewState = input.evidenceReviewState ?? defaultEvidenceReviewState();
  const excelDryRunRowPreview = buildExcelDryRunRowPreview({
    createdAt: input.createdAt,
    rawIntakeSource: input.rawIntakeSource,
    requesterDisplay: input.requesterDisplay,
    languageOrServiceDeskTeam: input.languageOrServiceDeskTeam,
    issueType: input.issueType,
    draft: input.draft,
    serviceDeskOwnerTeam: input.serviceDeskOwnerTeam,
    finalAssignmentGroup,
    workNotesSummary: workNotesPlan.summary,
    handlingStatus: input.handlingStatus ?? "New",
    confirmationState,
    evidenceReviewState,
    fakeScenarioId: input.fakeScenarioId,
    requiredFieldCheck: input.requiredFieldCheck,
    approvalPhraseGate: input.approvalPhraseGate,
    stopRuleCheck: input.stopRuleCheck,
    qaIsolationCheck: input.qaIsolationCheck,
    qaDryRunOutcome: input.qaDryRunOutcome,
    qaTrialResult: input.qaTrialResult ?? "Not run - dry-run only."
  });
  const routingPlan: RoutingPlan = {
    stage1: {
      label: "Stage 1 - Service Desk Handling",
      ownerTeam: input.serviceDeskOwnerTeam,
      status: "New",
      action: "Local review, normalize draft fields, and prepare internal Work Notes. No Save is executed."
    },
    stage2: {
      label: "Stage 2 - Final Assignment",
      assignmentGroup: finalAssignmentGroup,
      reason: input.finalAssignmentReason ?? "Assignment group is derived from local sanitized draft mapping."
    }
  };
  const preview: Omit<ServiceDeskWorkflowPreview, "markdownSummary"> = {
    workflowStages: [
      "Intake received",
      "Contact / confirmation",
      "Incident draft prepared",
      "Service Desk ownership / team handling",
      "Final support group routing",
      "Work Notes plan",
      "Excel dry-run row"
    ],
    rawIntakeSource: input.rawIntakeSource,
    mappedServiceNowChannel: mapIntakeSourceToServiceNowChannel(input.rawIntakeSource),
    confirmationState,
    evidenceReviewState,
    incidentDraftMapping: {
      category: draftFieldValue(input.draft.category),
      subcategory: draftFieldValue(input.draft.subcategory),
      priority: draftFieldValue(input.draft.priority),
      shortDescription: input.draft.shortDescription.value
    },
    routingPlan,
    workNotesPlan,
    excelDryRunRowPreview,
    csvRow: excelDryRunRowPreview.csvRow,
    safety: {
      noExternalActionPerformed: true,
      noServiceNowWrite: true,
      noExcelWrite: true,
      noGraphWrite: true,
      message:
        "Local deterministic preview only. No real ServiceNow, Excel workbook, Graph, browser, API, mailbox, Teams, or portal write is performed."
    }
  };

  return {
    ...preview,
    markdownSummary: buildWorkflowMarkdownSummary(preview)
  };
}

function defaultConfirmationState(): ContactConfirmationState {
  return {
    status: "Needs confirmation",
    summary: "Confirm requester identity, impact, urgency, and any missing troubleshooting facts."
  };
}

function defaultEvidenceReviewState(): EvidenceReviewState {
  return {
    evidenceType: "none",
    reviewState: "not reviewed",
    extractedFacts: ["No evidence artifact is required for this local preview."],
    safetyLabel: "No file upload, OCR, or external AI"
  };
}

function defaultRequiredFieldCheck(): string {
  return "Pending manual review of required fields: requester, channel, category, subcategory, location, impact, urgency, assignment group, short description, description, and work notes.";
}

function defaultApprovalPhraseGate(): string {
  return "Separate exact Alan approval phrase is required before each real Save, Submit, Update, or Close action.";
}

function defaultStopRuleCheck(): string {
  return "Stop on production mode, real customer data, notification/escalation risk, missing QA isolation, unexpected ServiceNow workflow, DOM autofill, API use, or bulk path.";
}

export function buildExcelDryRunWorkbookArtifact(
  row: ExcelDryRunRow,
  options: ExcelDryRunWorkbookArtifactOptions = {}
): ExcelDryRunWorkbookArtifact {
  const sheetName = sanitizeWorksheetName(options.sheetName ?? "Excel Dry-run Row");
  const fileTimestamp = normalizeWorkbookFileTimestamp(options.fileTimestamp ?? row["Created At"]);
  const sheetXml = buildWorksheetXml(row);
  const archiveEntries = [
    { path: "[Content_Types].xml", content: contentTypesXml() },
    { path: "_rels/.rels", content: packageRelationshipsXml() },
    { path: "docProps/app.xml", content: appPropertiesXml(sheetName) },
    { path: "docProps/core.xml", content: corePropertiesXml() },
    { path: "xl/workbook.xml", content: workbookXml(sheetName) },
    { path: "xl/_rels/workbook.xml.rels", content: workbookRelationshipsXml() },
    { path: "xl/styles.xml", content: stylesXml() },
    { path: "xl/worksheets/sheet1.xml", content: sheetXml }
  ];

  return {
    fileName: `servicenow-dry-run-${fileTimestamp}.xlsx`,
    mimeType: excelDryRunWorkbookMimeType,
    sheetName,
    bytes: buildStoredZipArchive(archiveEntries),
    safetyCopy:
      "Local deterministic XLSX dry-run artifact only. It does not connect to Microsoft Graph, a cloud workbook, ServiceNow, browser automation, or any real write path."
  };
}

export function buildCsvRow(row: ExcelDryRunRow): string {
  return excelDryRunRowColumns.map((column) => csvEscape(row[column])).join(",");
}

function buildWorkNotesPlan(draft: TicketDraft): WorkNotesPlan {
  return {
    summary: summarizeSingleLine(draft.workNotes.value),
    warning: "Save is a real write action and is not executed in this demo.",
    plannedNotes: draft.workNotes.value
  };
}

function buildExcelRowMarkdownSummary(row: ExcelDryRunRow): string {
  return [
    "## Excel Dry-run Row Preview",
    "",
    ...excelDryRunRowColumns.map((column) => `- ${column}: ${row[column]}`)
  ].join("\n");
}

function buildWorkflowMarkdownSummary(preview: Omit<ServiceDeskWorkflowPreview, "markdownSummary">): string {
  return [
    "# Service Desk Workflow Preview",
    "",
    "## Workflow Stage",
    ...preview.workflowStages.map((stage, index) => `${index + 1}. ${stage}`),
    "",
    "## Intake",
    `- Raw Intake Source: ${preview.rawIntakeSource}`,
    `- ServiceNow Channel: ${preview.mappedServiceNowChannel}`,
    "",
    "## Routing Plan",
    `- Stage 1 - Service Desk Handling: ${preview.routingPlan.stage1.ownerTeam}; ${preview.routingPlan.stage1.status}; ${preview.routingPlan.stage1.action}`,
    `- Stage 2 - Final Assignment: ${preview.routingPlan.stage2.assignmentGroup}; ${preview.routingPlan.stage2.reason}`,
    "",
    "## Work Notes Plan",
    `- ${preview.workNotesPlan.summary}`,
    `- ${preview.workNotesPlan.warning}`,
    "",
    preview.excelDryRunRowPreview.markdownSummary,
    "",
    "## Safety",
    `- ${preview.safety.message}`
  ].join("\n");
}

function buildWorksheetXml(row: ExcelDryRunRow): string {
  const rows = [
    ["Excel Dry-run Row", "Preview only - local XLSX artifact generated; no Graph, cloud workbook, or ServiceNow write."],
    ["Column", "Value"],
    ...excelDryRunRowColumns.map((column) => [column, row[column]])
  ];
  const sheetRows = rows
    .map((cells, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const xmlCells = cells
        .map((cell, columnIndex) => inlineStringCell(`${columnLetter(columnIndex)}${rowNumber}`, cell))
        .join("");
      return `<row r="${rowNumber}">${xmlCells}</row>`;
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<sheetViews><sheetView workbookViewId="0"/></sheetViews>',
    '<sheetFormatPr defaultRowHeight="15"/>',
    '<cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="92" customWidth="1"/></cols>',
    `<sheetData>${sheetRows}</sheetData>`,
    '</worksheet>'
  ].join("");
}

function inlineStringCell(reference: string, value: string): string {
  return `<c r="${reference}" t="inlineStr"><is><t>${xmlEscape(sanitizeExcelCellText(value))}</t></is></c>`;
}

function sanitizeExcelCellText(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function columnLetter(index: number): string {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function sanitizeWorksheetName(value: string): string {
  const sanitized = value.replace(/[\\/?*\[\]:]/g, " ").replace(/\s+/g, " ").trim();
  return (sanitized || "Dry-run").slice(0, 31);
}

function normalizeWorkbookFileTimestamp(value: string): string {
  const normalized = value.trim().replace(/\s+/g, "T").replace(/:/g, "-").replace(/[^0-9A-Za-zTZ-]/g, "-");
  return normalized.replace(/-+/g, "-").replace(/^-|-$/g, "") || "local-preview";
}

function contentTypesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
    '</Types>'
  ].join("");
}

function packageRelationshipsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
    '</Relationships>'
  ].join("");
}

function workbookXml(sheetName: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<sheets>',
    `<sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>`,
    '</sheets>',
    '</workbook>'
  ].join("");
}

function workbookRelationshipsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '</Relationships>'
  ].join("");
}

function stylesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<fonts count="1"><font><sz val="11"/><name val="Aptos"/></font></fonts>',
    '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>',
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
    '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>',
    '</styleSheet>'
  ].join("");
}

function appPropertiesXml(sheetName: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
    '<Application>ServiceNow Automation Local Dry-run</Application>',
    `<TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>${xmlEscape(sheetName)}</vt:lpstr></vt:vector></TitlesOfParts>`,
    '</Properties>'
  ].join("");
}

function corePropertiesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    '<dc:title>ServiceNow Automation Local Dry-run</dc:title>',
    '<dc:creator>ServiceNow Automation</dc:creator>',
    '<cp:lastModifiedBy>ServiceNow Automation</cp:lastModifiedBy>',
    '<dcterms:created xsi:type="dcterms:W3CDTF">2026-05-18T00:00:00Z</dcterms:created>',
    '<dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-18T00:00:00Z</dcterms:modified>',
    '</cp:coreProperties>'
  ].join("");
}

function buildStoredZipArchive(entries: { path: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localRecords: Uint8Array[] = [];
  const centralRecords: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const pathBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.content);
    const crc = crc32(dataBytes);
    const localHeader = new Uint8Array(30 + pathBytes.length);
    writeUint32LE(localHeader, 0, 0x04034b50);
    writeUint16LE(localHeader, 4, 20);
    writeUint16LE(localHeader, 6, 0);
    writeUint16LE(localHeader, 8, 0);
    writeUint16LE(localHeader, 10, 0);
    writeUint16LE(localHeader, 12, 33);
    writeUint32LE(localHeader, 14, crc);
    writeUint32LE(localHeader, 18, dataBytes.length);
    writeUint32LE(localHeader, 22, dataBytes.length);
    writeUint16LE(localHeader, 26, pathBytes.length);
    writeUint16LE(localHeader, 28, 0);
    localHeader.set(pathBytes, 30);
    localRecords.push(concatUint8Arrays([localHeader, dataBytes]));

    const centralHeader = new Uint8Array(46 + pathBytes.length);
    writeUint32LE(centralHeader, 0, 0x02014b50);
    writeUint16LE(centralHeader, 4, 20);
    writeUint16LE(centralHeader, 6, 20);
    writeUint16LE(centralHeader, 8, 0);
    writeUint16LE(centralHeader, 10, 0);
    writeUint16LE(centralHeader, 12, 0);
    writeUint16LE(centralHeader, 14, 33);
    writeUint32LE(centralHeader, 16, crc);
    writeUint32LE(centralHeader, 20, dataBytes.length);
    writeUint32LE(centralHeader, 24, dataBytes.length);
    writeUint16LE(centralHeader, 28, pathBytes.length);
    writeUint16LE(centralHeader, 30, 0);
    writeUint16LE(centralHeader, 32, 0);
    writeUint16LE(centralHeader, 34, 0);
    writeUint16LE(centralHeader, 36, 0);
    writeUint32LE(centralHeader, 38, 0);
    writeUint32LE(centralHeader, 42, localOffset);
    centralHeader.set(pathBytes, 46);
    centralRecords.push(centralHeader);
    localOffset += localHeader.length + dataBytes.length;
  }

  const centralDirectory = concatUint8Arrays(centralRecords);
  const endOfCentralDirectory = new Uint8Array(22);
  writeUint32LE(endOfCentralDirectory, 0, 0x06054b50);
  writeUint16LE(endOfCentralDirectory, 4, 0);
  writeUint16LE(endOfCentralDirectory, 6, 0);
  writeUint16LE(endOfCentralDirectory, 8, entries.length);
  writeUint16LE(endOfCentralDirectory, 10, entries.length);
  writeUint32LE(endOfCentralDirectory, 12, centralDirectory.length);
  writeUint32LE(endOfCentralDirectory, 16, localOffset);
  writeUint16LE(endOfCentralDirectory, 20, 0);

  return concatUint8Arrays([...localRecords, centralDirectory, endOfCentralDirectory]);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ bytes[index]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let current = index;
  for (let bit = 0; bit < 8; bit += 1) {
    current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
  }
  return current >>> 0;
});

function writeUint16LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    combined.set(array, offset);
    offset += array.length;
  }
  return combined;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function draftFieldValue(field: TicketDraft[keyof TicketDraft] | undefined): string {
  if (typeof field === "object" && field !== null && "value" in field && typeof field.value === "string") {
    return field.value;
  }
  return "Not set";
}

function summarizeSingleLine(value: string): string {
  const singleLine = value.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 180) {
    return singleLine;
  }
  return `${singleLine.slice(0, 177).trim()}...`;
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
