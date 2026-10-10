import {
  ROM_DRIVERS,
  type RomCountBlock,
  type RomDriver,
  type RomEstimate,
} from "@/lib/programs/rom-estimate";
import { noteSentences } from "@/lib/programs/root-cause-notes";

/**
 * Fill P3 Step 4 from pasted notes, under the rules every step follows
 * (`root-cause-notes.ts`): deterministic, verbatim, drafts only.
 *
 * Notes can supply COUNTS and nothing else. A sentence that names a use case
 * (its code, e.g. "UC-2", or its name) and states "<number> <component>"
 * pairs ("6 sources, 30 tables") drafts those counts, each number exactly as
 * written, with the sentence and its line as the citation. A sentence that
 * names an unknown "UC-n" adds that use case, named with the words that
 * follow the code. A confirmed row, and any count a person typed, is never
 * overwritten. Unit hours, rates, factors and releases are never filled: a
 * figure that prices the work comes from the register or an approved
 * benchmark, never from notes.
 */

/** "<number> <component>", one pattern per driver. Order does not matter: each is anchored on its noun. */
const DRIVER_PATTERNS: ReadonlyArray<readonly [RomDriver, RegExp]> = [
  ["data_source_count", /\b(\d+)\s+(?:data\s+)?sources?\b(?!\s+tables?\b)/i],
  ["source_table_count", /\b(\d+)\s+(?:source\s+)?tables?\b/i],
  [
    "standard_data_entity_count",
    /\b(\d+)\s+(?:standard\s+)?(?:data\s+)?entit(?:y|ies)\b/i,
  ],
  ["dashboard_view_count", /\b(\d+)\s+(?:dashboard\s+)?views?\b/i],
  ["design_row_count", /\b(\d+)\s+design\s+rows?\b/i],
  ["validation_row_count", /\b(\d+)\s+validation\s+rows?\b/i],
];

export interface RomNotesProposal {
  code: string;
  /** Set when the notes name a use case the record does not have yet. */
  newName?: string;
  counts: Partial<Record<RomDriver, number>>;
  /** The sentence, verbatim. */
  excerpt: string;
  line: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countsIn(sentence: string): Partial<Record<RomDriver, number>> {
  const counts: Partial<Record<RomDriver, number>> = {};
  for (const [driver, pattern] of DRIVER_PATTERNS) {
    const match = pattern.exec(sentence);
    if (match) counts[driver] = Number(match[1]);
  }
  return counts;
}

/** "UC-2 lineage and serving is about …" → "lineage and serving". */
function nameAfterCode(sentence: string, code: string): string | null {
  const match = new RegExp(
    `\\b${escapeRegExp(code)}\\b[\\s:·–—-]*([^:,;.]+?)\\s+(?:is|are|has|needs|covers|counts)\\b`,
    "i",
  ).exec(sentence);
  const name = match?.[1]?.trim();
  return name && name.split(/\s+/).length >= 2 ? name : null;
}

export function proposeRomCountsFromNotes(
  notes: string,
  record: RomEstimate,
): RomNotesProposal[] {
  const proposals: RomNotesProposal[] = [];
  const taken = new Set<string>();
  const blocks: RomCountBlock[] = [
    ...record.useCases,
    ...(record.foundation ? [record.foundation] : []),
  ];
  for (const sentence of noteSentences(notes)) {
    const counts = countsIn(sentence.text);
    if (!Object.keys(counts).length) continue;
    const named = blocks.find(
      (b) =>
        !taken.has(b.code) &&
        (new RegExp(`\\b${escapeRegExp(b.code)}\\b`, "i").test(sentence.text) ||
          new RegExp(`\\b${escapeRegExp(b.name)}\\b`, "i").test(
            sentence.text,
          ) ||
          (b === record.foundation && /\bfoundation\b/i.test(sentence.text))),
    );
    if (named) {
      taken.add(named.code);
      if (named.confirmedAt) continue;
      const typed = new Set(named.typed ?? []);
      const fill = Object.fromEntries(
        Object.entries(counts).filter(([d]) => !typed.has(d as RomDriver)),
      ) as Partial<Record<RomDriver, number>>;
      if (!Object.keys(fill).length) continue;
      proposals.push({
        code: named.code,
        counts: fill,
        excerpt: sentence.text,
        line: sentence.line,
      });
      continue;
    }
    const code = /\bUC-(\d+)\b/i.exec(sentence.text);
    if (!code) continue;
    const ucCode = `UC-${code[1]}`;
    const name = nameAfterCode(sentence.text, code[0]);
    if (!name || taken.has(ucCode)) continue;
    taken.add(ucCode);
    proposals.push({
      code: ucCode,
      newName: name,
      counts,
      excerpt: sentence.text,
      line: sentence.line,
    });
  }
  return proposals;
}

/**
 * Apply proposals as session-note drafts. Each touched row carries the
 * `Session notes · review` provenance and its citation; nothing is confirmed.
 */
export function applyRomNotesProposals(
  record: RomEstimate,
  proposals: readonly RomNotesProposal[],
): RomEstimate {
  let next = record;
  for (const p of proposals) {
    const source = {
      kind: "session_notes" as const,
      citation: `your notes, line ${p.line}`,
      excerpt: p.excerpt,
    };
    const merge = (b: RomCountBlock): RomCountBlock =>
      b.confirmedAt
        ? b
        : {
            ...b,
            counts: { ...b.counts, ...p.counts },
            source,
          };
    if (p.newName) {
      if (next.useCases.some((u) => u.code === p.code)) continue;
      next = {
        ...next,
        useCases: [
          ...next.useCases,
          { code: p.code, name: p.newName, counts: { ...p.counts }, source },
        ],
      };
    } else if (next.foundation?.code === p.code) {
      next = { ...next, foundation: merge(next.foundation) };
    } else {
      next = {
        ...next,
        useCases: next.useCases.map((u) => (u.code === p.code ? merge(u) : u)),
      };
    }
  }
  return next;
}

/** Drivers in display order, for a reply that names what was filled. */
export function proposalDrivers(p: RomNotesProposal): RomDriver[] {
  return ROM_DRIVERS.filter((d) => p.counts[d] !== undefined);
}
