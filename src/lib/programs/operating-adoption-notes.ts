import type { ChangeProfile } from "@/lib/programs/phase-workflow-registry";
import {
  CAPTURE_TEXT_ROWS,
  DECISION_RIGHTS,
  draftAnswer,
  raiseRouteFlag,
  textRowState,
  type DecisionRightId,
  type GridRow,
  type OperatingAdoption,
  type OwnerRow,
  type WorkProfile,
} from "@/lib/programs/operating-adoption";
import {
  noteSentences,
  noteTerms,
  termOverlap,
} from "@/lib/programs/root-cause-notes";

/**
 * Fill P3 Step 3 from pasted notes, under the rules every step follows
 * (`root-cause-notes.ts`): deterministic, the team's words verbatim with their
 * line, drafts only, and only into an empty cell. Notes never overwrite a
 * chosen owner, never set a mark someone already made, never write over a
 * capture answer, and never change depth: a sentence that reads as a heavier
 * change than the confirmed route becomes an advisory route flag instead.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const names = (text: string, phrase: string | undefined) => {
  const p = phrase?.trim();
  return Boolean(
    p &&
    p.length >= 4 &&
    new RegExp(`\\b${escapeRegExp(p)}\\b`, "i").test(text),
  );
};

/** "Stewardship council: a domain-steward RACI …" → "Stewardship council". */
function head(element: string): string {
  return element.split(/[:;,(]|\s[—–-]\s|\swith\s/)[0]?.trim() ?? element;
}

/** Does this clause of the notes name the grid row? */
function namesRow(clause: string, row: GridRow, short?: string): boolean {
  if (names(clause, short) || names(clause, head(row.name))) return true;
  return termOverlap(noteTerms(row.name), noteTerms(clause)) >= 2;
}

/** Clauses: the notes' sentences, split again on ";" so one line can name several owners. */
function noteClauses(notes: string) {
  return noteSentences(notes).flatMap((s) =>
    s.text
      .replace(/^[A-Za-z ]{2,30}:\s*/, "")
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.length >= 4)
      .map((part) => ({ text: part, line: s.line })),
  );
}

const RIGHT_CUES: Readonly<Record<DecisionRightId, RegExp>> = {
  certifies: /\bcertif(?:y|ies|ied|ying|ication)\b/i,
  approves_access:
    /\bapprov\w*\b[^.;]*\baccess\b|\baccess\b[^.;]*\bapprov\w*\b/i,
  releases: /\breleas(?:e|es|ed|ing)\b/i,
};

/** A labelled line in the notes, verbatim after its label: "Process: …". */
const TEXT_LABELS: Readonly<Record<string, RegExp>> = {
  workflow_delta:
    /^\s*(?:workflow(?: change)?|what changes|change to (?:people[’']s )?work)\s*[:—–-]\s*/i,
  process_adoption_boundary:
    /^\s*(?:adoption(?: boundary)?|where adoption stops|unchanged)\s*[:—–-]\s*/i,
  operating_model: /^\s*(?:operating model|who does what)\s*[:—–-]\s*/i,
  process_design:
    /^\s*(?:process(?: design)?|the changed process)\s*[:—–-]\s*/i,
};

/**
 * What reads as more change than the route allows. On a technical route, any
 * change to how people work; on a limited route, a change to roles or
 * accountability. A full route has nothing heavier.
 */
const HEAVIER_CUES: Readonly<Record<WorkProfile | "technical", RegExp | null>> =
  {
    technical:
      /\b(?:roles?|responsibilit\w*|accountab\w*|approv\w*|workflow|process|queue|every (?:morning|day|week)|daily|weekly|train(?:ed|ing|s)?|hand-?offs?|sign-?offs?)\b/i,
    limited:
      /\b(?:new (?:roles?|teams?|positions?)|(?:decision|approval) rights|accountab\w*|operating model|reorgani[sz]\w*|reporting lines?)\b/i,
    full: null,
  };

export interface RouteFlagReading {
  quote: string;
  line: number;
}

/** The first sentence that reads as a heavier change than the route, verbatim. */
export function routeFlagFromNotes(
  notes: string,
  profile: ChangeProfile,
): RouteFlagReading | null {
  const cue = HEAVIER_CUES[profile];
  if (!cue) return null;
  const hit = noteSentences(notes).find((s) => cue.test(s.text));
  return hit ? { quote: hit.text, line: hit.line } : null;
}

export interface NotesFill {
  record: OperatingAdoption;
  /** What was filled, for aVa's reply: "RC-3 (Tom Becker)", "the process design". */
  filled: string[];
  /** Rows left alone because the consultant had chosen an owner. */
  left: string[];
  flagged: boolean;
}

const lineCite = (line: number) => `From your notes, line ${line}`;

/**
 * Fill empty cells from the notes. Owners only where a clause names the row
 * and exactly one of the Move's people; rights only where none is marked yet;
 * capture text only for an empty row, from a labelled line, verbatim.
 */
export function fillFromNotes(
  notes: string,
  args: {
    profile: ChangeProfile;
    record: OperatingAdoption;
    rows: readonly GridRow[];
    /** P2's short name per Step 1 row, for matching: "lineage". */
    shorts?: Readonly<Record<string, string>>;
    people: readonly string[];
    values: Readonly<Record<string, string>>;
  },
): NotesFill {
  let record = args.record;
  const filled: string[] = [];
  const left: string[] = [];

  const flag = routeFlagFromNotes(notes, args.profile);
  let flagged = false;
  if (flag) {
    const next = raiseRouteFlag(record, { profile: args.profile, ...flag });
    flagged = next !== record;
    record = next;
  }
  if (args.profile === "technical") {
    return { record, filled, left, flagged };
  }

  const clauses = noteClauses(notes);
  const stored = (row: GridRow): OwnerRow => {
    const s = record.rows.find((r) => r.rowId === row.rowId);
    return s && s.name === row.name
      ? s
      : {
          rowId: row.rowId,
          source: row.source,
          name: row.name,
          rights: row.rights,
        };
  };
  const put = (next: OwnerRow) => {
    const at = record.rows.findIndex((r) => r.rowId === next.rowId);
    const rows =
      at < 0
        ? [...record.rows, next]
        : record.rows.map((r, i) => (i === at ? next : r));
    const { ownersAcceptedAt, ownersAcceptedBy, ...rest } = record;
    void ownersAcceptedAt;
    void ownersAcceptedBy;
    record = { ...rest, rows };
  };

  for (const row of args.rows) {
    const short = args.shorts?.[row.rowId];
    const about = clauses.filter((c) => namesRow(c.text, row, short));
    if (about.length === 0) continue;
    if (row.owner?.writtenBy === "you") {
      if (
        about.some(
          (c) => args.people.filter((p) => names(c.text, p)).length === 1,
        )
      ) {
        left.push(row.rowId);
      }
    } else if (!row.owner) {
      const hit = about.find(
        (c) => args.people.filter((p) => names(c.text, p)).length === 1,
      );
      if (hit) {
        const person = args.people.find((p) => names(hit.text, p))!;
        put({
          ...stored(row),
          owner: {
            name: person,
            writtenBy: "notes",
            citation: lineCite(hit.line),
          },
        });
        filled.push(`${row.rowId} (${person})`);
      }
    }
    for (const right of DECISION_RIGHTS) {
      const current = stored(row);
      if (current.rights[right.id]) continue;
      const hit = about.find((c) => RIGHT_CUES[right.id].test(c.text));
      if (!hit) continue;
      put({
        ...current,
        rights: {
          ...current.rights,
          [right.id]: {
            value: true,
            writtenBy: "notes",
            citation: lineCite(hit.line),
          },
        },
      });
    }
  }

  const lines = notes.split(/\r?\n/);
  for (const row of CAPTURE_TEXT_ROWS[args.profile]) {
    const state = textRowState(
      record,
      row.key,
      args.values[row.key] ?? "",
      false,
    );
    if (state.state !== "empty") continue;
    const label = TEXT_LABELS[row.key];
    const at = lines.findIndex((l) => label.test(l));
    if (at < 0) continue;
    const words = lines[at].replace(label, "").trim();
    if (words.length < 8) continue;
    record = draftAnswer(record, row.key, {
      text: words,
      writtenBy: "notes",
      citation: lineCite(at + 1),
    });
    filled.push(`the ${row.short}, word for word`);
  }

  return { record, filled, left, flagged };
}
