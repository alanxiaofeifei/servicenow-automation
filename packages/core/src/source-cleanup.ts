import type { SourceType } from "./models";

export type SourceCleanupInput = {
  sourceType: SourceType;
  rawText: string;
};

export type SourceCleanupResult = {
  rawText: string;
  normalizedText: string;
  removedLineCount: number;
};

export function normalizeSourceContextText(input: SourceCleanupInput): SourceCleanupResult {
  const rawText = normalizeLineEndings(input.rawText).trim();
  const lines = rawText.split("\n");
  const cleanedLines: string[] = [];
  let removedLineCount = 0;
  let inSignature = false;

  for (const originalLine of lines) {
    const trimmedLine = normalizeInlineWhitespace(originalLine.trim());

    if (trimmedLine.length === 0) {
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== "") {
        cleanedLines.push("");
      }
      continue;
    }

    let line = stripThreadPrefixes(trimmedLine);
    line = stripChannelSpeakerPrefix(line, input.sourceType);
    line = stripThreadPrefixesAfterTimestamp(line);
    line = normalizeInlineWhitespace(line);

    if (line.length === 0 || shouldRemoveLine(line, input.sourceType)) {
      removedLineCount += 1;
      continue;
    }

    if (isGreetingLine(line)) {
      removedLineCount += 1;
      continue;
    }

    if (inSignature || isSignatureStart(line)) {
      inSignature = true;
      removedLineCount += 1;
      continue;
    }

    cleanedLines.push(line);
  }

  const normalizedText = compactBlankLines(cleanedLines).trim() || rawText;

  return {
    rawText,
    normalizedText,
    removedLineCount
  };
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeInlineWhitespace(text: string): string {
  return text.replace(/[ \t]+/g, " ").trim();
}

function stripThreadPrefixes(text: string): string {
  let stripped = text.replace(/^(?:subject|title)\s*:\s*/i, "");
  let previous = "";

  while (stripped !== previous) {
    previous = stripped;
    stripped = stripped
      .replace(/^(?:re|fw|fwd)\s*:\s*/i, "")
      .replace(/^\[(?:external|ext|confidential)\]\s*/i, "")
      .replace(/^external\s*:\s*/i, "");
  }

  return stripped.trim();
}

function stripThreadPrefixesAfterTimestamp(text: string): string {
  const timestampMatch = text.match(/^(\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s+)(.+)$/);
  if (!timestampMatch) {
    return stripThreadPrefixes(text);
  }

  return `${timestampMatch[1]}${stripThreadPrefixes(timestampMatch[2])}`;
}

function stripChannelSpeakerPrefix(text: string, sourceType: SourceType): string {
  if (sourceType !== "servicenow_chat" && sourceType !== "teams_web") {
    return text;
  }

  return text.replace(
    /^(\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*)?(?:demo\s+)?(?:requester|user|customer|caller|employee|teammate|support|agent|analyst)\s*:\s*/i,
    (_match, timestamp: string | undefined) => timestamp ?? ""
  ).trim();
}

function shouldRemoveLine(line: string, sourceType: SourceType): boolean {
  const lower = line.toLowerCase();

  if (isDemoBoilerplate(lower) || isChannelHeader(lower) || isGenericDisclaimer(lower)) {
    return true;
  }

  if (sourceType === "outlook_web" || sourceType === "outlook_classic") {
    return /^(from|to|cc|bcc|sent|date|importance|attachments?)\s*:/i.test(line);
  }

  if (sourceType === "teams_web") {
    return /^(team|channel|thread|message link|tenant|chat)\s*:/i.test(line) || /sent from microsoft teams/i.test(line);
  }

  if (sourceType === "servicenow_self_service") {
    return /^(request|ticket|record|portal|opened by|requested for|sys_id)\s*(number|id)?\s*:/i.test(line);
  }

  if (sourceType === "servicenow_chat") {
    return /^(conversation|transcript|session|chat)\s*(id|started|ended)?\s*:/i.test(line)
      || /^(agent|support analyst) (joined|left) the chat/i.test(line);
  }

  return false;
}

function isDemoBoilerplate(lowercaseLine: string): boolean {
  return lowercaseLine.includes("fake sanitized intake data only")
    || lowercaseLine.includes("no teams tenant")
    || lowercaseLine.includes("no portal polling")
    || lowercaseLine.includes("no servicenow chat")
    || lowercaseLine.includes("no mailbox")
    || lowercaseLine.includes(".msg file")
    || lowercaseLine.includes(".eml file")
    || lowercaseLine.includes("external ai with real content");
}

function isChannelHeader(lowercaseLine: string): boolean {
  return /^(teams|self-service|servicenow chat|shared mailbox)-style demo/.test(lowercaseLine);
}

function isGenericDisclaimer(lowercaseLine: string): boolean {
  return lowercaseLine.startsWith("caution:")
    || lowercaseLine.startsWith("confidentiality notice:")
    || lowercaseLine.includes("this email and any attachments")
    || lowercaseLine.includes("intended recipient")
    || lowercaseLine.includes("do not click links or open attachments");
}

function isGreetingLine(line: string): boolean {
  const withoutTimestamp = line.replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, "").trim();
  return /^(hi|hello|dear|good morning|good afternoon|good evening)(\s+(team|support|service desk|all|there))?[,.!]*$/i.test(withoutTimestamp);
}

function isSignatureStart(line: string): boolean {
  return /^(thanks|thank you|regards|best|kind regards|sent from my iphone|sent from outlook)[,.!]*$/i.test(line)
    || /^(thanks|thank you|regards|best|kind regards),\s*demo/i.test(line);
}

function compactBlankLines(lines: string[]): string {
  const compacted: string[] = [];

  for (const line of lines) {
    if (line === "" && (compacted.length === 0 || compacted[compacted.length - 1] === "")) {
      continue;
    }
    compacted.push(line);
  }

  while (compacted[compacted.length - 1] === "") {
    compacted.pop();
  }

  return compacted.join("\n");
}
