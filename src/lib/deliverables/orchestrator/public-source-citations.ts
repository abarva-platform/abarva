import type {
  DeliverableIntelligenceRequest,
  PublicCitationSource,
  RenderableDeliverable,
} from "./types";
import {
  factTokens,
  registerCitationIds,
} from "./numeric-lineage-tokens";

const SOURCE_CITATION_RE = /\[S:([^\]]+)\]/g;
const PRIVATE_CITATION_RE = /\[(\d+)\]/g;

/** Model-authored fields only; the deterministic Sources table is excluded. */
export function authoredPublicCitationText(doc: RenderableDeliverable): string {
  return [
    doc.title,
    doc.subtitle ?? "",
    ...doc.generatedSections.map((section) =>
      section.rawBodyMarkdown ?? section.bodyMarkdown,
    ),
    ...doc.tables.flatMap((table) => [
      table.title,
      ...table.columns,
      ...table.rows.flatMap((row) => row.map(String)),
    ]),
    doc.recommendation,
    ...doc.nextActions,
    ...(doc.deckSlides ?? []).flatMap((slide) => [
      slide.title ?? "",
      slide.governingMessage,
      ...(slide.points ?? []),
      slide.speakerNotes ?? "",
    ]),
    ...doc.exhibits.flatMap((exhibit) => [
      exhibit.title,
      exhibit.description,
      JSON.stringify(exhibit.data ?? {}),
    ]),
  ].join("\n");
}

export function publicSourceCitationNumbers(text: string): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(SOURCE_CITATION_RE)) {
    const number = Number(match[1]);
    if (/^[1-9]\d*$/.test(match[1]) && Number.isSafeInteger(number)) found.add(number);
  }
  return [...found].sort((a, b) => a - b);
}

export function citedPublicSources(
  doc: RenderableDeliverable,
  sources: readonly PublicCitationSource[],
): PublicCitationSource[] {
  const cited = new Set(publicSourceCitationNumbers(authoredPublicCitationText(doc)));
  return sources.filter((source) => cited.has(source.citationNumber));
}

export function clientApplication(segment: string, req: DeliverableIntelligenceRequest): boolean {
  const names = [req.clientDisplayName, req.initiativeDisplayName]
    .filter((name) => name.trim().length > 2)
    .map((name) => name.toLowerCase());
  const lower = segment.toLowerCase();
  return (
    (names.some((name) => lower.includes(name)) &&
      /\b(?:baseline|target|sav(?:e|es|ing|ings)|benefit|cost|value|roi|payback|project|expect)\b/i.test(segment)) ||
    /\b(?:(?:the|this|our)\s+(?:client|move|initiative)|our\s+(?:baseline|target|savings?|roi|payback|business case)|client(?:'s)?\s+(?:baseline|target|savings?|roi|payback|benefit)|we\s+(?:expect|target|project|save|plan))\b/i.test(segment)
  );
}

/** Checks citations and source-supported figures before a Move artifact can be exported. */
export function validatePublicSourceCitations(
  doc: RenderableDeliverable,
  req: DeliverableIntelligenceRequest,
): string[] {
  if (!req.publicSources) return [];
  const failures: string[] = [];
  const byNumber = new Map(req.publicSources.map((source) => [source.citationNumber, source]));
  const text = authoredPublicCitationText(doc);
  const allPublicFigures = new Set(
    req.publicSources.flatMap((source) => factTokens(source.excerpt)),
  );
  const unknown = new Set<string>();
  for (const match of text.matchAll(SOURCE_CITATION_RE)) {
    const number = Number(match[1]);
    if (!/^[1-9]\d*$/.test(match[1]) || !Number.isSafeInteger(number) || !byNumber.has(number)) {
      unknown.add(match[0]);
    }
  }
  if (unknown.size) {
    failures.push(
      `cites public source(s) outside this Move's approved sources: ${[...unknown].join(", ")}. Approve the source for this Move or remove the citation.`,
    );
  }

  for (const segment of text.split(/(?<=[.!?])\s+|\n+/)) {
    const cited = publicSourceCitationNumbers(segment)
      .map((number) => byNumber.get(number))
      .filter((source): source is PublicCitationSource => source !== undefined);
    const figures = factTokens(segment);
    if (!figures.length) continue;
    const sourceFigures = new Set(cited.flatMap((source) => factTokens(source.excerpt)));
    const assumptionFigures = new Set(
      (req.approvedAssumptions ?? [])
        .filter((row) => row.registerId && registerCitationIds(segment).includes(row.registerId))
        .flatMap((row) => factTokens(row.figure ?? "")),
    );
    const privateIds = new Set(
      [...segment.matchAll(PRIVATE_CITATION_RE)].map((match) => Number(match[1])),
    );
    const privateFigures = new Set(
      req.governedEvidenceBundle
        .filter((item) => privateIds.has(item.citationNumber))
        .flatMap((item) => factTokens(`${item.label} ${item.statement}`)),
    );
    if (cited.length) {
      const unsupported = figures.filter(
        (figure) =>
          !sourceFigures.has(figure) &&
          !assumptionFigures.has(figure) &&
          !privateFigures.has(figure),
      );
      if (unsupported.length) {
        failures.push(
          `public citation ${cited.map((source) => `[S:${source.citationNumber}]`).join(", ")} does not support figure(s) ${unsupported.join(", ")} in its approved excerpt. Cite an excerpt containing each public figure, a private evidence item for a private figure, or a matching [A:ID] register row.`,
        );
      }
    }
    if (
      clientApplication(segment, req) &&
      figures.some(
        (figure) =>
          (cited.length ? sourceFigures.has(figure) : allPublicFigures.has(figure)) &&
          !assumptionFigures.has(figure) &&
          (cited.length > 0 || !privateFigures.has(figure)),
      )
    ) {
      failures.push(
        `a public figure is applied to this client as a baseline, saving, target, or benefit. Record the client working figure in this Move's assumptions register and cite its matching [A:ID] row, or remove the client application.`,
      );
    }
  }
  return [...new Set(failures)];
}
