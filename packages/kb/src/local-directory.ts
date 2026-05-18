import { readdir, readFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";

import type { KnowledgeArticle } from "@servicenow-automation/core";

export type LocalKnowledgeBaseLoadOptions = {
  limit?: number;
  updatedAt?: string;
};

const SUPPORTED_EXTENSIONS = new Set([".md", ".txt"]);

export async function loadMarkdownKnowledgeArticlesFromDirectory(
  directoryPath: string,
  options: LocalKnowledgeBaseLoadOptions = {}
): Promise<KnowledgeArticle[]> {
  const files = await collectKnowledgeFiles(directoryPath);
  const selectedFiles = files.slice(0, options.limit ?? files.length);

  return Promise.all(
    selectedFiles.map(async (filePath) => {
      const markdown = await readFile(filePath, "utf-8");
      const id = toArticleId(relative(directoryPath, filePath));
      return parseMarkdownKnowledgeArticle(markdown, {
        id,
        updatedAt: options.updatedAt ?? "2026-05-18T00:00:00.000Z",
        fallbackTitle: basename(filePath, extname(filePath))
      });
    })
  );
}

export function parseMarkdownKnowledgeArticle(
  markdown: string,
  options: { id: string; updatedAt: string; fallbackTitle: string }
): KnowledgeArticle {
  const title = firstHeading(markdown) ?? titleFromFilename(options.fallbackTitle);
  const symptoms = sectionList(markdown, ["symptoms", "症状"], [plainSummary(markdown)]);
  const checks = sectionList(markdown, ["checks", "排查", "检查"], [plainSummary(markdown)]);
  const escalationCriteria = sectionList(markdown, ["escalation criteria", "escalation", "升级条件"], [
    "Escalate when standard checks do not resolve the issue."
  ]);
  const responseTemplate = sectionText(markdown, ["response template", "reply template", "回复模板"])
    ?? plainSummary(markdown);

  return {
    id: options.id,
    title,
    category: "External KB",
    tags: tokenizeForTags(`${title} ${markdown}`).slice(0, 8),
    symptoms,
    checks,
    escalationCriteria,
    responseTemplate,
    updatedAt: options.updatedAt
  };
}

async function collectKnowledgeFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        return collectKnowledgeFiles(fullPath);
      }
      if (entry.isFile() && SUPPORTED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        return [fullPath];
      }
      return [];
    })
  );

  return nested.flat().sort((a, b) => a.localeCompare(b));
}

function firstHeading(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function titleFromFilename(filename: string): string {
  return filename.replace(/[-_]+/g, " ").trim();
}

function sectionList(markdown: string, headings: string[], fallback: string[]): string[] {
  const text = sectionText(markdown, headings);
  if (!text) {
    return fallback;
  }

  const bulletItems = text
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);

  return bulletItems.length > 0 ? bulletItems : fallback;
}

function sectionText(markdown: string, headings: string[]): string | undefined {
  const lines = markdown.split(/\r?\n/);
  const normalizedHeadings = new Set(headings.map(normalizeHeading));
  const captured: string[] = [];
  let capturing = false;

  for (const line of lines) {
    const headingMatch = line.match(/^#{2,4}\s+(.+)$/);
    if (headingMatch) {
      capturing = normalizedHeadings.has(normalizeHeading(headingMatch[1] ?? ""));
      continue;
    }
    if (capturing) {
      captured.push(line);
    }
  }

  const text = captured.join("\n").trim();
  return text.length > 0 ? text : undefined;
}

function normalizeHeading(value: string): string {
  return value.toLowerCase().replace(/[:：]/g, "").trim();
}

function plainSummary(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500) || "Review the source knowledge article for details.";
}

function tokenizeForTags(text: string): string[] {
  const stopWords = new Set(["the", "and", "for", "with", "this", "that", "from", "are", "can", "cannot"]);
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !stopWords.has(token))
    )
  );
}

function toArticleId(relativePath: string): string {
  return `external-${relativePath
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()}`;
}
