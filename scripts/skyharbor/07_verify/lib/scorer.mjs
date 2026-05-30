export const WRONG_TENANT_TERMS = [
  'Apex Retail',
  'Meridian Health',
  'Northstar Clinical',
  'First Capital',
  'Wipro AMS',
  'Commerce Cloud',
  'Epic EHR',
  'Meditech',
];

export const SKYHARBOR_MARKERS = [
  'SkyHarbor',
  'IBM',
  'AWS',
  'mainframe',
  'Z',
  'GCC',
  'airline',
  'crew',
  'IROPs',
  'loyalty',
  'airport',
  'baggage',
  'cargo',
  'revenue accounting',
  'modernization',
  'MIPS',
  'TSA',
];

export const CITATION_MARKERS = [
  /\bS\d{2}_[A-Z0-9_]+\b/,
  /\bSHA-[A-Z0-9-]+\b/,
  /\bsource\b/i,
  /\bevidence\b/i,
  /\bcitation\b/i,
  /\bmodernization ledger\b/i,
  /\bmainframe inventory\b/i,
  /\bvalue ledger\b/i,
  /\bIBM engagement\b/i,
  /\bvendor portfolio\b/i,
  /\bpattern overlay\b/i,
];

const UNAVAILABLE_PATTERN =
  /\b(i don't have|hasn't been ingested|haven't been ingested|not available|not ingested|can't give you a factual|cannot give you a factual|need .* ingested|needs to be pulled|no record|no .* ledger|no .* inventory)\b/i;

export function scoreProductAnswer({ answer, sources, required }) {
  const flags = [];
  let score = 0;

  const wrongTerms = WRONG_TENANT_TERMS.filter((term) => answer.toLowerCase().includes(term.toLowerCase()));
  if (wrongTerms.length > 0) {
    return {
      score: 0,
      pass: false,
      status: 'fail-product',
      flags: [`wrong_tenant_or_hallucinated_terms:${wrongTerms.join('|')}`],
      sourceCount: sources.length,
      answerChars: answer.length,
      tenantHits: [],
      requiredHits: 0,
      citationHits: 0,
      unavailableAdmission: UNAVAILABLE_PATTERN.test(answer),
      patternOnly: false,
    };
  }

  if (answer.length >= 250 && !answer.includes('[error]')) {
    score += 1;
  } else {
    flags.push('weak_or_failed_response');
  }

  const tenantHits = SKYHARBOR_MARKERS.filter((term) => answer.toLowerCase().includes(term.toLowerCase()));
  if (tenantHits.length >= 3) {
    score += 1;
  } else {
    flags.push(`thin_skyharbor_grounding:${tenantHits.join('|') || 'none'}`);
  }

  const citationHits = CITATION_MARKERS.filter((pattern) => pattern.test(answer)).length;
  const requiredHits = required.filter((segment) => answer.includes(segment)).length;
  if (sources.length > 0 || citationHits >= 2 || requiredHits > 0) {
    score += 1;
  } else {
    flags.push('missing_visible_citations');
  }

  if (
    /\d/.test(answer) &&
    /(recommend|rank|because|risk|value|next|should|do not|leave alone|counter|validate|board|90 days)/i.test(answer)
  ) {
    score += 1;
  } else {
    flags.push('low_decision_specificity');
  }

  if (sources.length >= 3 || requiredHits >= 2) {
    score += 1;
  } else {
    flags.push('partial_segment_coverage');
  }

  const unavailableAdmission = UNAVAILABLE_PATTERN.test(answer);
  if (unavailableAdmission) {
    flags.push('data_unavailable_admission');
    score = Math.min(score, 3);
  }

  const tenantSourceCount = sources.filter((source) => {
    const haystack = [source?.id, source?.name, source?.detail, source?.type].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes('skyharbor') || haystack.includes('tenant') || required.some((segment) => haystack.includes(segment.toLowerCase()));
  }).length;
  const patternOnly = sources.length > 0 && tenantSourceCount === 0;
  if (patternOnly) {
    flags.push('pattern_overlay_only');
    score = Math.min(score, 3);
  }

  return {
    score,
    pass: score >= 4,
    status: score >= 4 ? 'pass' : 'fail-product',
    flags,
    sourceCount: sources.length,
    answerChars: answer.length,
    tenantHits,
    requiredHits,
    citationHits,
    unavailableAdmission,
    patternOnly,
  };
}

export function classifyHarnessResponse({ status, contentType, text, elapsedMs, latencyBudgetMs }) {
  if (elapsedMs > latencyBudgetMs) {
    return { status: 'timeout', reason: `latency ${elapsedMs}ms exceeded ${latencyBudgetMs}ms` };
  }
  if (status < 200 || status >= 400) {
    return { status: 'fail-harness', reason: `HTTP ${status}` };
  }
  if (looksLikeHtmlResponse(contentType, text)) {
    return { status: 'fail-harness', reason: `non-ndjson response content-type=${contentType || 'unknown'}` };
  }
  if (!text.trim()) {
    return { status: 'fail-harness', reason: 'empty NDJSON response' };
  }
  return null;
}

export function looksLikeHtmlResponse(contentType, text) {
  return /\btext\/html\b/i.test(contentType ?? '') || /^\s*<!doctype html/i.test(text) || /^\s*<html[\s>]/i.test(text);
}
