import type { AvaArtifact } from "@/lib/ava-answer/contract";

export function executiveReadingBudget(question: string): number {
  const explicit = question.match(/\b(\d{2,4})\s+words?\b/i);
  if (explicit) return Math.max(50, Math.min(3000, Number(explicit[1])));
  return wordCount(question) <= 25 &&
    !/\b(compare|comparison|options|discovery|plan|brief|portfolio|detailed)\b/i.test(
      question,
    )
    ? 100
    : 300;
}

export function wordCount(text: string): number {
  return text
    .replace(/[#*|`_]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function artifactWords(a: AvaArtifact): number {
  if (a.artifact === "table") {
    return wordCount(
      [
        a.title,
        ...a.columns.map((c) => c.label),
        ...a.rows.flatMap((r) => a.columns.map((c) => r[c.key])),
        a.note,
      ]
        .filter((v) => v !== undefined && v !== null)
        .join(" "),
    );
  }
  if (a.artifact === "graph") {
    return (
      wordCount(
        [
          a.title,
          ...a.nodes.map((n) => n.label),
          ...a.edges.flatMap((e) => [e.from, e.to, e.label]),
        ].join(" "),
      ) + a.nodes.length
    );
  }
  const data = Array.isArray(a.data) ? a.data : [];
  return (
    wordCount(
      [
        a.title,
        a.subtitle,
        a.xKey,
        a.yKey,
        a.unit,
        a.sourceNote,
        ...data.flatMap((row) => Object.values(row as Record<string, unknown>)),
      ].join(" "),
    ) + 20
  );
}

function prosePrefix(prose: string, budget: number): string {
  if (wordCount(prose) <= budget) return prose;
  const blocks = prose.trim().split(/\n\s*\n/);
  const included: string[] = [];
  let used = 0;
  for (const block of blocks) {
    const cost = wordCount(block);
    if (used + cost > budget) break;
    included.push(block);
    used += cost;
  }
  // A heading belongs with its following content, never by itself.
  while (included.length && /^#{1,6}\s+[^\n]+$/.test(included.at(-1)!.trim())) {
    included.pop();
  }
  if (included.some((block) => !/^#{1,6}\s+[^\n]+$/.test(block.trim())))
    return included.join("\n\n");

  // A table-only or code-only opening has no prose excerpt. Keep that
  // complete unit in the full analysis instead of clipping cells or payloads.
  if (
    /^\s*```/m.test(prose) ||
    /^\s*\|?.+\|.+\n\s*\|?[\s:|\-]+\|?\s*$/m.test(prose)
  )
    return "";

  // Long opening paragraphs are excerpts, ended at a sentence when possible.
  const sentences = prose.match(/[^.!?]+[.!?](?:\s+|$)|[^.!?]+$/g) ?? [prose];
  let prefix = "";
  for (const sentence of sentences) {
    if (wordCount(prefix + sentence) > budget) break;
    prefix += sentence;
  }
  return (
    prefix.trim() ||
    prose
      .trim()
      .split(/\s+/)
      .slice(0, budget - 1)
      .join(" ") + "…"
  );
}

/** A reading view only: the packet, complete authored text and exports stay intact. */
export function compactReadingView(
  prose: string,
  artifacts: AvaArtifact[],
  budget: number,
) {
  const totalWords =
    wordCount(prose) + artifacts.reduce((n, a) => n + artifactWords(a), 0);
  if (totalWords <= budget)
    return { prose, artifacts, hasMore: false, visibleWords: totalWords };

  // Keep a useful compact exhibit alongside the opening recommendation.
  // A large exhibit stays whole in the full analysis rather than losing rows.
  const firstArtifact = artifacts[0];
  const exhibitCost = firstArtifact ? artifactWords(firstArtifact) : 0;
  const openingBlocks = prose.trim().split(/\n\s*\n/);
  const firstContent = openingBlocks.findIndex(
    (block) => !/^#{1,6}\s+[^\n]+$/.test(block.trim()),
  );
  const openingWords =
    firstContent < 0
      ? 0
      : wordCount(openingBlocks.slice(0, firstContent + 1).join("\n\n"));
  const showArtifact = Boolean(
    firstArtifact && exhibitCost + openingWords <= budget,
  );
  const previewArtifacts = showArtifact ? [firstArtifact] : [];
  const previewProse = prosePrefix(
    prose,
    budget - (showArtifact ? exhibitCost : 0),
  );
  return {
    prose: previewProse,
    artifacts: previewArtifacts,
    hasMore: true,
    visibleWords: wordCount(previewProse) + (showArtifact ? exhibitCost : 0),
  };
}
