import type { RetrievalContext, RetrievedChunk } from './retrieval';

const SNIPPET_CHARS = 720;

function industryLabel(code: RetrievalContext['industry']): string {
  if (code === 'HEALTHCARE_IDN') return 'Healthcare IDN';
  if (code === 'FINSERV') return 'Financial Services';
  if (code === 'RETAIL') return 'Retail';
  return 'Cross-industry';
}

function truncate(text: string, max = SNIPPET_CHARS): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max)}…`;
}

function chunkCitation(c: RetrievedChunk): string {
  if (!c.sourceKey) return '';
  if (c.section) return `[${c.sourceKey} § ${c.section}]`;
  if (c.pageNumber) return `[${c.sourceKey}, page ${c.pageNumber}]`;
  return `[${c.sourceKey}]`;
}

function formatChunk(c: RetrievedChunk): string[] {
  const lines: string[] = [];
  const cite = chunkCitation(c);
  lines.push(cite);
  if (c.attribution) lines.push(`  Attribution: ${c.attribution}`);
  lines.push(`  ${truncate(c.text)}`);
  return lines;
}

export function formatRetrievedContext(ctx: RetrievalContext): string {
  const anyContent =
    ctx.clientChunks.length > 0 || ctx.industryChunks.length > 0 || ctx.topicChunks.length > 0;
  if (!anyContent) return '';

  const lines: string[] = ['RETRIEVED CONTEXT', ''];

  if (ctx.industryChunks.length > 0) {
    lines.push(`INDUSTRY KNOWLEDGE · ${industryLabel(ctx.industry)}`);
    for (const c of ctx.industryChunks) lines.push(...formatChunk(c), '');
  }

  if (ctx.topicChunks.length > 0) {
    lines.push('CROSS-CUTTING KNOWLEDGE · AI Governance');
    for (const c of ctx.topicChunks) lines.push(...formatChunk(c), '');
  }

  if (ctx.clientChunks.length > 0) {
    lines.push('CLIENT CONTEXT');
    for (const c of ctx.clientChunks) lines.push(...formatChunk(c), '');
  }

  return lines.join('\n').trim();
}

export const CITATION_INSTRUCTION = `CITATION FORMAT

When you reference something from the RETRIEVED CONTEXT above, cite it
inline in brackets. Use the exact source_key shown with the chunk.

Formats:
- [source_key § section]       when the chunk has a section
- [source_key, page N]         when the chunk has a page number
- [source_key]                 otherwise

Examples:
- "NIST AI RMF [nist_ai_rmf_1_0 § 3.2.1] requires continuous monitoring..."
- "HIPAA Security Rule [hhs_hipaa_security_rule § 164.308] requires..."
- "CMS national median readmission is 21.8% [cms_hospital_compare]."

Rules:
- Never invent a citation. If the statistic or quote is not in RETRIEVED
  CONTEXT, do not cite it; either omit the claim or say "I don't have a
  benchmark for that — want to treat as a hypothesis?".
- Cite once per claim. Don't pepper every sentence with citations.
- Preserve the attribution line from fair-use-excerpted sources when
  quoting directly.`;
