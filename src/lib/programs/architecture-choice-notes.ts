import {
  coverageFor,
  type ArchitectureChoice,
  type CoverageElement,
} from "@/lib/programs/architecture-choice";
import {
  noteSentences,
  noteTerms,
  termOverlap,
} from "@/lib/programs/root-cause-notes";

/**
 * Fill P3 Step 2 from pasted notes, under the rules every step follows
 * (`root-cause-notes.ts`): deterministic, verbatim sentences with their line,
 * drafts only, and only into a field that is empty. Notes never choose an
 * option and never mark coverage; they can only supply the words for why
 * the chosen option, and the "how" line under a Partly or Doesn't.
 */

export interface ChoiceNotesProposal {
  kind: "why" | "how";
  /** For "how": the element it explains. */
  causeId?: string;
  value: string;
  sourceLines: number[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namesOption(text: string, id: string, label: string): boolean {
  const bare = id.replace(/^opt[-_ ]?/i, "");
  return [id, label, `option ${bare}`].some(
    (name) =>
      name.trim().length > 0 &&
      new RegExp(`\\b${escapeRegExp(name.trim())}\\b`, "i").test(text),
  );
}

export function proposeChoiceFromNotes(
  notes: string,
  args: {
    choice: ArchitectureChoice;
    recommendation: string;
    elements: readonly CoverageElement[];
  },
): ChoiceNotesProposal[] {
  const sentences = noteSentences(notes);
  const proposals: ChoiceNotesProposal[] = [];

  if (!args.recommendation.trim()) {
    const why = sentences
      .filter((s) =>
        namesOption(s.text, args.choice.optionId, args.choice.optionLabel),
      )
      .slice(0, 2);
    if (why.length) {
      proposals.push({
        kind: "why",
        value: why.map((s) => s.text).join(" "),
        sourceLines: why.map((s) => s.line),
      });
    }
  }

  const used = new Set<number>();
  for (const element of args.elements) {
    const entry = coverageFor(args.choice, element);
    if (!entry || entry.mark === "covers" || entry.how?.trim()) continue;
    const terms = noteTerms(`${element.short ?? ""} ${element.element ?? ""}`);
    const match = sentences.find(
      (s, i) =>
        !used.has(i) &&
        ((element.short &&
          new RegExp(`\\b${escapeRegExp(element.short)}\\b`, "i").test(
            s.text,
          )) ||
          termOverlap(terms, noteTerms(s.text)) >= 2),
    );
    if (!match) continue;
    used.add(sentences.indexOf(match));
    proposals.push({
      kind: "how",
      causeId: element.causeId,
      value: match.text.replace(/\.$/, "").trim(),
      sourceLines: [match.line],
    });
  }
  return proposals;
}
