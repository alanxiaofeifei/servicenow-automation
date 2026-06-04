import type { AssignmentMapping, KnowledgeArticle, KnowledgeMatch } from "@servicenow-automation/core";

export type SupportGroupRecommendation = {
  assignmentGroup: string;
  confidence: number;
  evidence: string[];
};

/**
 * Recommend a support group based on KB search matches and profile assignment mappings.
 *
 * Scores each assignment mapping by how many of the top-3 KB matches' tags and category
 * intersect with the mapping's keywords, weighted by match score. Returns groups with
 * confidence > 0, sorted descending.
 */
export function recommendSupportGroup(
  matches: KnowledgeMatch[],
  articles: KnowledgeArticle[],
  assignmentMappings: AssignmentMapping[]
): SupportGroupRecommendation[] {
  if (matches.length === 0 || assignmentMappings.length === 0) {
    return [];
  }

  const articleMap = new Map<string, KnowledgeArticle>();
  for (const article of articles) {
    articleMap.set(article.id, article);
  }

  // Collect keyword evidence from top-3 matched articles
  const topMatches = matches.slice(0, 3);
  const signalWords = new Map<string, number>();

  for (const match of topMatches) {
    const article = articleMap.get(match.articleId);
    if (!article) continue;

    const sourceText = [
      article.title,
      article.category,
      ...article.tags,
      ...article.symptoms,
      ...article.checks
    ]
      .join(" ")
      .toLowerCase();

    for (const keyword of match.matchedKeywords) {
      if (sourceText.includes(keyword.toLowerCase())) {
        const weight = match.score * Math.max(0.5, 1 - (article.tags.length > 0 ? 0.1 : 0));
        signalWords.set(keyword, (signalWords.get(keyword) ?? 0) + weight);
      }
    }
  }

  // Score each assignment mapping
  const scored: SupportGroupRecommendation[] = [];

  for (const mapping of assignmentMappings) {
    let totalSignal = 0;
    const evidence: string[] = [];

    for (const keyword of mapping.keywords) {
      const signal = signalWords.get(keyword.toLowerCase()) ?? 0;
      if (signal > 0) {
        totalSignal += signal;
        evidence.push(keyword);
      }
    }

    if (evidence.length > 0) {
      // Confidence is ratio of matched keywords to total keywords, capped at 1
      const confidence = Math.min(1, totalSignal / mapping.keywords.length);
      scored.push({
        assignmentGroup: mapping.assignmentGroup,
        confidence: Math.round(confidence * 100) / 100,
        evidence
      });
    }
  }

  return scored.sort((a, b) => b.confidence - a.confidence || a.assignmentGroup.localeCompare(b.assignmentGroup));
}
