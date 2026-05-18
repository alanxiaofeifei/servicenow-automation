import type { KnowledgeArticle, KnowledgeMatch } from "@servicenow-automation/core";

export type KnowledgeSearchOptions = {
  limit?: number;
  minimumScore?: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "user",
  "with"
]);

export function searchKnowledgeArticles(
  query: string,
  articles: KnowledgeArticle[],
  options: KnowledgeSearchOptions = {}
): KnowledgeMatch[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  const limit = options.limit ?? 3;
  const minimumScore = options.minimumScore ?? 0;

  return articles
    .map((article) => scoreArticle(article, queryTokens))
    .filter((match) => match.score > minimumScore)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

function scoreArticle(article: KnowledgeArticle, queryTokens: string[]): KnowledgeMatch {
  const weightedText = [
    repeatText(article.title, 4),
    repeatText(article.category, 3),
    repeatText(article.tags.join(" "), 4),
    article.symptoms.join(" "),
    article.checks.join(" "),
    article.escalationCriteria.join(" "),
    article.responseTemplate
  ].join(" ");
  const articleTokens = new Set(tokenize(weightedText));
  const matchedKeywords = Array.from(new Set(queryTokens.filter((token) => articleTokens.has(token))));
  const rawScore = matchedKeywords.length / queryTokens.length;
  const score = Math.min(1, Number(rawScore.toFixed(4)));

  return {
    articleId: article.id,
    title: article.title,
    score,
    matchedKeywords,
    excerpt: buildExcerpt(article, matchedKeywords)
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function repeatText(text: string, times: number): string {
  return Array.from({ length: times }, () => text).join(" ");
}

function buildExcerpt(article: KnowledgeArticle, matchedKeywords: string[]): string | undefined {
  const lowerKeywords = new Set(matchedKeywords.map((keyword) => keyword.toLowerCase()));
  const candidate = [...article.symptoms, ...article.checks].find((line) =>
    tokenize(line).some((token) => lowerKeywords.has(token))
  );

  return candidate ?? article.symptoms[0];
}
