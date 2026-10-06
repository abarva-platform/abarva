/**
 * DOCX <-> PPTX material-consistency gate.
 *
 * DOCX stays deterministic this increment, which makes it the control. The deck
 * is now model-composed and may simplify wording freely; what it may not do is
 * reach a different conclusion, name a different option, drop the ask, or carry
 * a headline figure the document does not.
 *
 * This is deliberately a MATERIAL check, not a prose-similarity score. Comparing
 * wording would fail every legitimate compression and pass a deck that kept the
 * phrasing while inverting the recommendation. So it compares the things that
 * are supposed to be identical: the ask, the named option, the owners, the
 * material dates, and the headline numbers.
 */

import type { InspectedDeck } from '../orchestrator/deck-inspection';

export type CrossFinding =
  | { kind: 'missing_ask'; message: string }
  | { kind: 'missing_option'; option: string; message: string }
  | { kind: 'missing_figure'; figure: string; message: string }
  | { kind: 'missing_date'; date: string; message: string }
  | { kind: 'missing_owner'; owner: string; message: string };

export interface CrossVerdict {
  ok: boolean;
  checked: { asks: number; options: number; figures: number; dates: number; owners: number };
  findings: CrossFinding[];
}

export interface MaterialClaims {
  /** Verbs that carry the decision ask, e.g. "approve", "fund", "hold". */
  askTerms: string[];
  /** The selected option's name, as the document states it. */
  selectedOptions: string[];
  /** Headline figures the deck must not lose, as rendered strings. */
  headlineFigures: string[];
  /** Dates the decision hangs on. */
  materialDates: string[];
  /** Named owners or decision makers. */
  owners: string[];
}

function deckText(deck: InspectedDeck): string {
  return deck.slides
    .flatMap((s) => s.textRuns)
    .join(' \n ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** Currency and percentages survive reformatting; compare on digits, not glyphs. */
function figureVariants(figure: string): string[] {
  const digits = figure.replace(/[^0-9.]/g, '');
  const scale = /b\b|billion/i.test(figure) ? 'b' : /m\b|million/i.test(figure) ? 'm' : '';
  return [figure.toLowerCase(), `${digits}${scale}`, digits].filter(Boolean);
}

export function validateCrossProjection(deck: InspectedDeck, claims: MaterialClaims): CrossVerdict {
  const text = deckText(deck);
  const findings: CrossFinding[] = [];

  if (claims.askTerms.length && !claims.askTerms.some((t) => text.includes(t.toLowerCase()))) {
    findings.push({
      kind: 'missing_ask',
      message: `the deck states none of the document's decision verbs (${claims.askTerms.join(', ')})`,
    });
  }
  for (const option of claims.selectedOptions) {
    if (!text.includes(option.toLowerCase())) {
      findings.push({
        kind: 'missing_option',
        option,
        message: `the document selects "${option}"; the deck never names it`,
      });
    }
  }
  for (const figure of claims.headlineFigures) {
    const variants = figureVariants(figure);
    const compact = text.replace(/[\s,]/g, '');
    if (!variants.some((v) => compact.includes(v.replace(/[\s,]/g, '')))) {
      findings.push({
        kind: 'missing_figure',
        figure,
        message: `headline figure ${figure} is in the document and not on any slide`,
      });
    }
  }
  for (const date of claims.materialDates) {
    if (!text.includes(date.toLowerCase())) {
      findings.push({ kind: 'missing_date', date, message: `material date ${date} does not appear in the deck` });
    }
  }
  for (const owner of claims.owners) {
    if (!text.includes(owner.toLowerCase())) {
      findings.push({ kind: 'missing_owner', owner, message: `named owner "${owner}" does not appear in the deck` });
    }
  }

  return {
    ok: findings.length === 0,
    checked: {
      asks: claims.askTerms.length,
      options: claims.selectedOptions.length,
      figures: claims.headlineFigures.length,
      dates: claims.materialDates.length,
      owners: claims.owners.length,
    },
    findings,
  };
}
