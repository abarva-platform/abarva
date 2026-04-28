export type AtlasCitationKind = 'pattern' | 'signal' | 'solution' | 'contradiction';

export interface AtlasCitation {
  primitiveId: string;
  kind: AtlasCitationKind;
  title?: string;
  sourceId?: string;
}

export function renderInlineCitation(primitiveIds: readonly string[]): string {
  const ids = Array.from(new Set(primitiveIds.filter(Boolean)));

  if (ids.length === 0) {
    return '';
  }

  return `[${ids.join(', ')}]`;
}

export function renderCitationLabel(citation: AtlasCitation): string {
  const title = citation.title?.trim();
  return title ? `${citation.primitiveId} - ${title}` : citation.primitiveId;
}

export function renderCitationFootnote(citation: AtlasCitation, index: number): string {
  const source = citation.sourceId ? ` Source: ${citation.sourceId}.` : '';
  return `${index + 1}. ${renderCitationLabel(citation)} (${citation.kind}).${source}`;
}

export function renderCitationFootnotes(citations: readonly AtlasCitation[]): string[] {
  return citations.map(renderCitationFootnote);
}
