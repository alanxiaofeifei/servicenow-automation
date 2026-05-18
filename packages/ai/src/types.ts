import type {
  CapturedContext,
  KnowledgeMatch,
  ProjectProfile,
  TicketDraft
} from "@servicenow-automation/core";

export type GenerateTicketDraftInput = {
  context: CapturedContext;
  profile: ProjectProfile;
  kbMatches: KnowledgeMatch[];
};

export interface AIProvider {
  id: string;
  displayName: string;
  generateTicketDraft(input: GenerateTicketDraftInput): Promise<TicketDraft>;
}
