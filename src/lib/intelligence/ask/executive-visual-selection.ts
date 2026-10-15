export type ExecutiveVisualForm =
  | "none"
  | "comparison-table"
  | "gate-table"
  | "numeric-chart"
  | "qualitative-matrix"
  | "auto";

export function executiveVisualForm(question: string): ExecutiveVisualForm {
  const q = question.toLowerCase();
  if (
    /\b(?:no|without|do not (?:use|include))\s+(?:any\s+)?(?:visuals?|exhibits?)\b/.test(
      q,
    )
  )
    return "none";
  const noCharts =
    /\b(?:no|without|avoid|do not (?:use|include))\s+(?:any\s+)?charts?\b/.test(
      q,
    );
  const positive = q.replace(
    /\b(?:not|no|avoid|without|do not use|don't use)\s+(?:(?:a|an|another)\s+)?(?:2\s*[x\u00d7]\s*2|quadrant(?:\s+matrix)?|(?:bar|line|trend)\s+chart)/g,
    "",
  );
  if (!noCharts && /\bquadrant\b|\b2\s*[x\u00d7]\s*2\b/.test(positive))
    return "qualitative-matrix";
  if (
    !noCharts &&
    /\b(?:bar|line|trend)\s+chart\b|\btime[- ]series\b|\bplot\b[^.!?]{0,70}\bover time\b/.test(
      positive,
    )
  )
    return "numeric-chart";
  const explicitTable =
    /\b(?:as|in|into|using)\s+(?:(?:a|an|one|single|compact|concise|advisory|comparison|markdown)\s+){0,5}(?:table|tabular)\b|\b(?:show|give|provide|return|create|render|use|make)\s+(?:(?:me|us|this|that|it|the|a|an|one|single|compact|concise|advisory|comparison|markdown)\s+){0,6}(?:table|tabular)\b|\btabulate\b/.test(
      positive,
    );
  if (explicitTable) return "comparison-table";
  if (
    /\b(?:gates?|discovery plan|validation sequence|roadmap|next steps)\b/.test(
      q,
    )
  )
    return "gate-table";
  if (
    /\b(?:compare|comparison|options?|rank|ranking|prioriti[sz]e|scorecard|in-house|managed[- ]service|build\/buy)\b/.test(
      q,
    )
  )
    return "comparison-table";
  if (/\b(?:how many|who is|what is|define)\b/.test(q)) return "none";
  return "auto";
}

export function executiveVisualSelectionContract(question: string): string {
  const form = executiveVisualForm(question);
  const instructions: Record<ExecutiveVisualForm, string> = {
    none: "Prefer a direct concise answer without an exhibit. Do not add a matrix or decorative chart to a factual answer or a request for no visuals.",
    "comparison-table":
      "Use ONE compact table for the literal requested options, on the same capability and criteria. An explicit table request requires a table transport block, not a chart or quadrant, even when its columns are Effort and Potential. Keep supplied qualitative categories as table cells. Do not convert a ranking, operating-model comparison or sourcing choice into an Effort/Potential quadrant. Unknown economics stay unknown; qualitative recommendations are advisory judgment, not numeric scores.",
    "gate-table":
      "Use ONE compact sequence table: gate, evidence needed, proposed accountable role, and decision condition. Keep proposed sequence distinct from committed dates. Do not substitute an Effort/Potential quadrant or fabricate a timeline, completion percentages or durations.",
    "numeric-chart":
      "Prefer ONE Recharts-compatible bar, horizontal-bar or line chart matching the requested comparison. Require at least two compatible sourced numeric values; preserve units, dates, population and counting basis. A target alone is not a baseline, series, measured outcome or complementary split. If compatible values are absent, say which inputs are needed and use a compact evidence-request table, not invented scores or a substitute quadrant.",
    "qualitative-matrix":
      "The user explicitly requested a quadrant. Use only the two meaningful comparison axes supported by the evidence, and label placement as advisory judgment when qualitative. No invented numeric scores. Keep labels short and evidence limits visible; use a table instead if the two axes cannot be supported.",
    auto: "Use no exhibit unless it materially clarifies the decision. When useful, choose a compact table for qualitative options or evidence gaps, and a chart only for compatible sourced measurements. A 2x2 is not the default. Do not manufacture visual variety or repeat an exhibit's contents in prose.",
  };
  return `QUESTION-SPECIFIC EXHIBIT SELECTION\n${instructions[form]}\nWhen redrawing a prior view, preserve the exact options and supplied categories from this conversation. Do not replace them with a representative portfolio, add options or change their placements unless asked. If the referenced view is unavailable, ask a focused clarification instead of substituting a different list. Honor explicit requests to omit charts or exhibits. Keep the existing executive word budget, source rules and three follow-ups. This selection never licenses new facts, calculations, scores or graph edges. These are private drafting instructions, not visible labels.`;
}
