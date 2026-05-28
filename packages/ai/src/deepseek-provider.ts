import { TicketDraftSchema, type TicketDraft } from "@servicenow-automation/core";

import type { AIProvider, GenerateTicketDraftInput } from "./types";
import {
  ExternalAIBlockedError,
  assertExternalAISendAllowed,
  createExternalAIRedactionPreview,
  type ExternalAIRedactionPreview,
  type ExternalAISendApproval
} from "./redaction-gate";

export type DeepSeekTransportRequest = {
  providerId: "deepseek";
  baseUrl: string;
  model: string;
  apiKey: string;
  redactionPreviewId: string;
  redactedContext: string;
  disclosure: string;
  sourceContextId: string;
  kbMatchCount: number;
  profileId: string;
};

export type DeepSeekTransport = (request: DeepSeekTransportRequest) => Promise<unknown>;

export type DeepSeekProviderOptions = {
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  transport?: DeepSeekTransport;
};

export type DeepSeekProviderInput = GenerateTicketDraftInput & {
  externalSendApproval?: ExternalAISendApproval;
};

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";

export class DeepSeekProvider implements AIProvider {
  readonly id = "deepseek-provider";
  readonly displayName = "DeepSeek External AI Provider (disabled by default)";
  private readonly enabled: boolean;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly transport?: DeepSeekTransport;

  constructor(options: DeepSeekProviderOptions = {}) {
    this.enabled = options.enabled === true;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.model = options.model ?? DEFAULT_MODEL;
    this.transport = options.transport;
  }

  createRedactionPreview(input: GenerateTicketDraftInput): ExternalAIRedactionPreview {
    return createExternalAIRedactionPreview(input);
  }

  async generateTicketDraft(input: DeepSeekProviderInput): Promise<TicketDraft> {
    if (!this.enabled) {
      throw new ExternalAIBlockedError("external-ai-provider-disabled", ["external-ai-provider-disabled"]);
    }

    const preview = this.createRedactionPreview(input);
    assertExternalAISendAllowed(preview, input.externalSendApproval);

    if (!this.apiKey) {
      throw new ExternalAIBlockedError("external-ai-api-key-missing", ["external-ai-api-key-missing"]);
    }
    if (!this.transport) {
      throw new ExternalAIBlockedError("external-ai-transport-missing", ["external-ai-transport-missing"]);
    }

    const response = await this.transport({
      providerId: "deepseek",
      baseUrl: this.baseUrl,
      model: this.model,
      apiKey: this.apiKey,
      redactionPreviewId: preview.id,
      redactedContext: preview.redactedContext,
      disclosure: preview.disclosure,
      sourceContextId: input.context.id,
      kbMatchCount: input.kbMatches.length,
      profileId: input.profile.id
    });

    return TicketDraftSchema.parse(response);
  }
}

export function createDeepSeekProviderFromEnv(
  env: Record<string, string | undefined>,
  transport?: DeepSeekTransport
): DeepSeekProvider {
  return new DeepSeekProvider({
    enabled: env.SDA_EXTERNAL_AI_ENABLED === "true" && env.SDA_EXTERNAL_AI_PROVIDER === "deepseek",
    apiKey: env.SDA_DEEPSEEK_API_KEY ?? env.DEEPSEEK_API_KEY,
    baseUrl: env.SDA_DEEPSEEK_BASE_URL,
    model: env.SDA_DEEPSEEK_MODEL,
    transport
  });
}
