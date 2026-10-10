/** Physical value-figure gate for P4 documents governed by the value engine. */
import { authoredPublicCitationText, clientApplication, publicSourceCitationNumbers } from "./public-source-citations";
import type { DeliverableIntelligenceRequest, RenderableDeliverable } from "./types";
import { registerCitationIds } from "./numeric-lineage-tokens";

const MONEY_RE = /(?:-?\$\s*\d[\d,]*(?:\.\d+)?\s*(?:k|m|b|thousand|million|billion)?|USD\s*\d[\d,]*(?:\.\d+)?\s*(?:k|m|b|thousand|million|billion)?)/gi;
const ENGINE_REF_RE = /\[VE:([A-Za-z0-9_-]+)\]/g;

/** Amount and half-unit rounding tolerance implied by the displayed precision. */
export function readMoneyFigure(raw: string): { cents: number; toleranceCents: number } | null {
  const negative = /^-/.test(raw.trim());
  const text = raw.trim().replace(/^-/, "").replace(/^USD\s*/i, "").replace(/^\$/, "").trim();
  const match = text.match(/^([\d,]+(?:\.(\d+))?)\s*(k|m|b|thousand|million|billion)?$/i);
  if (!match) return null;
  const multiplier =
    /^(k|thousand)$/i.test(match[3] ?? "") ? 1_000 :
    /^(m|million)$/i.test(match[3] ?? "") ? 1_000_000 :
    /^(b|billion)$/i.test(match[3] ?? "") ? 1_000_000_000 : 1;
  const numeric = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const quantumCents = multiplier * 100 / Math.pow(10, match[2]?.length ?? 0);
  return {
    cents: Math.round(numeric * multiplier * 100) * (negative ? -1 : 1),
    toleranceCents: Math.max(1, quantumCents / 2),
  };
}

function near(expected: number, found: { cents: number; toleranceCents: number }): boolean {
  return Math.abs(expected - found.cents) <= found.toleranceCents;
}

function scenarioAt(sentence: string, index: number): "low" | "base" | "high" | null {
  const labels = [...sentence.matchAll(/\b(low|plan|base|high)\b/gi)].map((match) => ({
    index: match.index,
    scenario: /^(plan|base)$/i.test(match[1]) ? "base" as const : match[1].toLowerCase() as "low" | "high",
  }));
  const preceding = labels.filter((label) => label.index <= index).at(-1);
  return preceding?.scenario ?? labels[0]?.scenario ?? null;
}

export function validateValueModelFigures(
  doc: RenderableDeliverable,
  req: DeliverableIntelligenceRequest,
): string[] {
  const snapshot = req.valueGeneration;
  if (!snapshot) return [];
  const failures: string[] = [];
  const authored = [
    authoredPublicCitationText({ ...doc, exhibits: [] }),
    ...doc.assumptions.map((assumption) => assumption.statement),
    ...doc.clientCompleteChecklist.map((item) => `${item.label} ${item.placeholderText}`),
    ...doc.exhibits.map((exhibit) => `${exhibit.title}\n${JSON.stringify(exhibit.data ?? {})} ${exhibit.description}`),
  ].join("\n");
  const knownSources = new Set([
    ...snapshot.figures.map((figure) => figure.sourceId),
    ...snapshot.quantities.map((quantity) => quantity.sourceId),
  ]);
  for (const match of authored.matchAll(ENGINE_REF_RE)) {
    if (!knownSources.has(match[1])) {
      failures.push(`unknown value-engine source [VE:${match[1]}]`);
    }
  }
  for (const sentence of authored.split(/(?<=[.!?])\s+|\n+/)) {
    const amounts = [...sentence.matchAll(MONEY_RE)];
    const citedEngine = new Set([...sentence.matchAll(ENGINE_REF_RE)].map((match) => match[1]));
    const citedRegister = new Set(registerCitationIds(sentence));
    const citedRows = (req.approvedAssumptions ?? []).filter(
      (row) => row.registerId && citedRegister.has(row.registerId),
    );
    const aboutPayback = /\bpayback\b/i.test(sentence);
    const aboutBreakeven = /\bbreakeven\b/i.test(sentence);
    if (amounts.length === 0 && citedEngine.size === 0 && !aboutPayback && !aboutBreakeven) continue;
    for (const amount of amounts) {
      const found = readMoneyFigure(amount[0]);
      if (!found) continue;
      const scenario = scenarioAt(sentence, amount.index);
      const engineMatch = snapshot.figures.some(
        (figure) => citedEngine.has(figure.sourceId) &&
          (scenario === null || figure.scenario === scenario) && near(figure.cents, found),
      );
      const registerMatch = citedRows.some((row) => {
        return (row.figure?.match(MONEY_RE) ?? []).some((figure) => {
          const recorded = readMoneyFigure(figure);
          return recorded && near(recorded.cents, found);
        });
      });
      const publicMatch =
        /\b(?:external|public|benchmark|not facts about (?:the )?client)\b/i.test(sentence) &&
        !clientApplication(sentence, req) &&
        publicSourceCitationNumbers(sentence).some((number) => {
          const source = req.publicSources?.find((entry) => entry.citationNumber === number);
          return (source?.excerpt.match(MONEY_RE) ?? []).some((figure) => {
            const recorded = readMoneyFigure(figure);
            return recorded && near(recorded.cents, found);
          });
        });
      if (!engineMatch && !registerMatch && !publicMatch) {
        failures.push(
          `value figure ${amount[0].trim()} has no matching engine result with [VE:source] or matching [A:ID] assumption row`,
        );
      }
    }
    if (citedEngine.size > 0 || aboutPayback || aboutBreakeven) {
      // A value-engine marker is not a blanket citation. Check each other
      // number it appears alongside (payback month, breakeven driver, hours).
      const withoutMoneyOrCitations = sentence
        .replace(MONEY_RE, (match) => " ".repeat(match.length))
        .replace(/\[(?:VE|A):[^\]]+\]/g, (match) => " ".repeat(match.length))
        .replace(/\[[1-9]\d*\]/g, (match) => " ".repeat(match.length));
      for (const numeric of withoutMoneyOrCitations.matchAll(/\b\d+(?:\.\d+)?\b/g)) {
        const raw = numeric[0];
        const value = Number(raw);
        const scenario = scenarioAt(sentence, numeric.index);
        const relevant = snapshot.quantities.filter((quantity) =>
          citedEngine.has(quantity.sourceId) &&
          (scenario === null || !quantity.scenario || quantity.scenario === scenario) &&
          (aboutPayback ? quantity.unit === "month" :
            aboutBreakeven ? quantity.unit === "driver_delta" : true),
        );
        const engineMatch = relevant.some((quantity) => Math.abs(quantity.value - value) < 1e-6);
        const registerMatch = citedRows.some((row) =>
          (row.figure?.match(/\b\d+(?:\.\d+)?\b/g) ?? []).some((token) => Math.abs(Number(token) - value) < 1e-6),
        );
        if (!engineMatch && !registerMatch) {
          failures.push(`numeric claim ${raw} is not supported by its [VE:source] or matching [A:ID] row`);
        }
      }
    }
    if (/\bhours?\s+saved\b|\bsaved\s+hours?\b/i.test(sentence)) {
      const nonCash = snapshot.result.levers.filter((lever) => lever.conversion === "non_cash");
      const referenced = nonCash.filter((lever) =>
        citedEngine.has(lever.leverId) ||
        sentence.toLowerCase().includes(lever.name.toLowerCase()),
      );
      if (
        (referenced.length === 0 || referenced.some((lever) => lever.status !== "counted" || !lever.inCash)) &&
        amounts.some((amount) => (readMoneyFigure(amount[0])?.cents ?? 0) !== 0)
      ) {
        failures.push("hours saved are monetized without a counted role or contract release path");
      }
    }
  }
  return [...new Set(failures)];
}
