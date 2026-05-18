import { z } from "zod";

import { SourceTypes, TicketTypes } from "../models";

const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = nonEmptyString.optional();

export const FieldDraftSchema = z.object({
  value: nonEmptyString,
  confidence: z.number().min(0).max(1),
  evidence: optionalNonEmptyString,
  editable: z.boolean()
});

export const CapturedContextSchema = z.object({
  id: nonEmptyString,
  sourceType: z.enum(SourceTypes),
  capturedAt: nonEmptyString,
  title: optionalNonEmptyString,
  url: optionalNonEmptyString,
  sender: optionalNonEmptyString,
  participants: z.array(nonEmptyString).optional(),
  screenshotPath: optionalNonEmptyString,
  rawText: nonEmptyString
});

export const KnowledgeArticleSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  category: nonEmptyString,
  tags: z.array(nonEmptyString),
  symptoms: z.array(nonEmptyString),
  checks: z.array(nonEmptyString),
  escalationCriteria: z.array(nonEmptyString),
  responseTemplate: nonEmptyString,
  updatedAt: nonEmptyString
});

export const KnowledgeMatchSchema = z.object({
  articleId: nonEmptyString,
  title: nonEmptyString,
  score: z.number().min(0).max(1),
  matchedKeywords: z.array(nonEmptyString),
  excerpt: optionalNonEmptyString
});

export const TicketDraftSchema = z.object({
  id: nonEmptyString,
  sourceContextId: nonEmptyString,
  ticketType: z.enum(TicketTypes),
  shortDescription: FieldDraftSchema,
  description: FieldDraftSchema,
  workNotes: FieldDraftSchema,
  resolutionNotes: FieldDraftSchema.optional(),
  caller: FieldDraftSchema.optional(),
  category: FieldDraftSchema.optional(),
  subcategory: FieldDraftSchema.optional(),
  assignmentGroup: FieldDraftSchema.optional(),
  configurationItem: FieldDraftSchema.optional(),
  impact: FieldDraftSchema.optional(),
  urgency: FieldDraftSchema.optional(),
  priority: FieldDraftSchema.optional(),
  kbMatches: z.array(KnowledgeMatchSchema),
  riskFlags: z.array(nonEmptyString),
  missingInfoQuestions: z.array(nonEmptyString)
});

export const CategoryMappingSchema = z.object({
  keywords: z.array(nonEmptyString),
  category: nonEmptyString,
  subcategory: optionalNonEmptyString
});

export const AssignmentMappingSchema = z.object({
  keywords: z.array(nonEmptyString),
  assignmentGroup: nonEmptyString
});

export const KnowledgeBaseSourceSchema = z.object({
  id: nonEmptyString,
  label: nonEmptyString,
  path: nonEmptyString
});

export const ProjectProfileSchema = z.object({
  id: nonEmptyString,
  displayName: nonEmptyString,
  companyLabel: nonEmptyString,
  serviceNowBaseUrl: optionalNonEmptyString,
  defaultAssignmentGroup: nonEmptyString,
  categoryMappings: z.array(CategoryMappingSchema),
  assignmentMappings: z.array(AssignmentMappingSchema),
  kbSources: z.array(KnowledgeBaseSourceSchema),
  demoMode: z.boolean()
});
