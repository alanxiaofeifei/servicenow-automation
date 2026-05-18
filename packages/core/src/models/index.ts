export const SourceTypes = [
  "manual_paste",
  "teams_web",
  "outlook_web",
  "outlook_classic",
  "servicenow_chat",
  "servicenow_self_service"
] as const;

export type SourceType = (typeof SourceTypes)[number];

export const TicketTypes = ["incident", "change"] as const;

export type TicketType = (typeof TicketTypes)[number];

export type FieldDraft = {
  value: string;
  confidence: number;
  evidence?: string;
  editable: boolean;
};

export type CapturedContext = {
  id: string;
  sourceType: SourceType;
  capturedAt: string;
  title?: string;
  url?: string;
  sender?: string;
  participants?: string[];
  screenshotPath?: string;
  rawText: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  symptoms: string[];
  checks: string[];
  escalationCriteria: string[];
  responseTemplate: string;
  updatedAt: string;
};

export type KnowledgeMatch = {
  articleId: string;
  title: string;
  score: number;
  matchedKeywords: string[];
  excerpt?: string;
};

export type TicketDraft = {
  id: string;
  sourceContextId: string;
  ticketType: TicketType;
  shortDescription: FieldDraft;
  description: FieldDraft;
  workNotes: FieldDraft;
  resolutionNotes?: FieldDraft;
  caller?: FieldDraft;
  category?: FieldDraft;
  subcategory?: FieldDraft;
  assignmentGroup?: FieldDraft;
  configurationItem?: FieldDraft;
  impact?: FieldDraft;
  urgency?: FieldDraft;
  priority?: FieldDraft;
  kbMatches: KnowledgeMatch[];
  riskFlags: string[];
  missingInfoQuestions: string[];
};

export type CategoryMapping = {
  keywords: string[];
  category: string;
  subcategory?: string;
};

export type AssignmentMapping = {
  keywords: string[];
  assignmentGroup: string;
};

export type KnowledgeBaseSource = {
  id: string;
  label: string;
  path: string;
};

export type ProjectProfile = {
  id: string;
  displayName: string;
  companyLabel: string;
  serviceNowBaseUrl?: string;
  defaultAssignmentGroup: string;
  categoryMappings: CategoryMapping[];
  assignmentMappings: AssignmentMapping[];
  kbSources: KnowledgeBaseSource[];
  demoMode: boolean;
};
