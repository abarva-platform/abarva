import type { ChangeProfile } from "@/lib/programs/phase-workflow-registry";
import {
  traceRows,
  type DesignTraceability,
} from "@/lib/programs/design-traceability";
import {
  resolveStepNextAction,
  type StepNextAction,
  type StepRow,
} from "@/lib/programs/step-page-model";

/**
 * P3 Step 3, "Name the owners and describe the change" (template v1.10).
 *
 * How deep this step goes is never set here: it comes from the change profile
 * of the route the consultant confirmed in P2 (`resolveChangeProfile`). On a
 * technical route the step is Skipped and the business-change boundary
 * attestation stands in for it. On a limited or full route the team names an
 * owner for each of Step 1's accepted design elements (plus any rows it adds),
 * writes the change in its own words to two capture answers, and names who
 * receives the baseline.
 *
 * Stored in the P3 `operating_adoption` step record as JSON with an explicit
 * kind marker. The record keeps who wrote what (notes, aVa or you), the drafts
 * not yet accepted, the owners grid, the baseline owner and any route flag. The
 * capture answers themselves hold only the team's words, as plain text.
 *
 * The owners grid is also written into a capture answer (product decision,
 * Oct 2026): `process_adoption_boundary` on a limited route, `operating_model`
 * on a full one, so generation and the gate's phrase checks read it. The page
 * never overwrites words it did not write. It appends ONE section of plain
 * owner lines after the team's text and remembers that section verbatim in
 * this record; later it removes or replaces only an exact match of what it
 * wrote. If the team edits those lines elsewhere they become the team's words
 * and are never removed; the page then writes its current lines after them.
 */

export const OPERATING_ADOPTION_KIND = "operating_adoption";

/**
 * The decision-rights glossary: the grid's three columns (template v1.10 keeps
 * them at three). A new right is added here first, never on a page.
 */
export const DECISION_RIGHTS = [
  {
    id: "certifies",
    label: "Certifies output",
    phrase: "certifies its output",
  },
  {
    id: "approves_access",
    label: "Approves access",
    phrase: "approves access",
  },
  { id: "releases", label: "Releases changes", phrase: "releases changes" },
] as const;

export type DecisionRightId = (typeof DECISION_RIGHTS)[number]["id"];
const RIGHT_IDS = new Set<string>(DECISION_RIGHTS.map((r) => r.id));

/** Who wrote the words: the badge names the writer, not where the idea came from. */
export type Writer = "notes" | "ava" | "you";

export interface OwnerChoice {
  name: string;
  writtenBy: "notes" | "you";
  /** For a fill from notes: "From your notes, line 3". */
  citation?: string;
}

export interface RightMark {
  value: boolean;
  writtenBy: "notes" | "you";
  citation?: string;
}

export interface OwnerRow {
  /** A Step 1 cause id ("RC-1"), or a team row id ("T-1"). */
  rowId: string;
  source: "step1" | "team";
  /**
   * A team row's own name; for a Step 1 row, the design element's words when
   * the row was last edited, so an element Step 1 rewrites is asked again.
   */
  name: string;
  owner?: OwnerChoice;
  rights: Partial<Record<DecisionRightId, RightMark>>;
}

/** The page's provenance for the words it wrote to one capture answer. */
export interface AnswerRecord {
  key: string;
  /** A draft not yet accepted. It is never written to the capture answer. */
  draft?: { text: string; writtenBy: "notes" | "ava"; citation?: string };
  /** The words accepted or saved, exactly as written to the capture answer. */
  accepted?: {
    text: string;
    writtenBy: Writer;
    citation?: string;
    /** `Accept` takes someone else's words; `Save` stores words just typed. */
    action: "accepted" | "saved";
    by: string;
    at: string;
  };
}

/** Notes that read as a heavier change than the confirmed route. */
export interface RouteFlag {
  /** The route profile the notes were read against. */
  profile: ChangeProfile;
  /** The notes' own sentence, verbatim. */
  quote: string;
  line: number;
  dismissedBy?: string;
  dismissedAt?: string;
}

export interface OperatingAdoption {
  kind: typeof OPERATING_ADOPTION_KIND;
  version: 1;
  rows: OwnerRow[];
  ownersAcceptedBy?: string;
  ownersAcceptedAt?: string;
  /** The owner lines this page last wrote into a capture answer, verbatim. */
  ownerLines?: { key: string; text: string };
  answers: AnswerRecord[];
  baseline?: { name: string; savedBy: string; savedAt: string };
  routeFlag?: RouteFlag;
}

export function emptyOperatingAdoption(): OperatingAdoption {
  return { kind: OPERATING_ADOPTION_KIND, version: 1, rows: [], answers: [] };
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** A string kept exactly as written (capture text keeps the team's spacing). */
function raw(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

const PROFILES = new Set<ChangeProfile>(["technical", "limited", "full"]);

function parseOwner(value: unknown): OwnerChoice | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const o = value as Record<string, unknown>;
  const name = text(o.name);
  if (!name || (o.writtenBy !== "notes" && o.writtenBy !== "you")) return;
  return {
    name,
    writtenBy: o.writtenBy,
    ...(text(o.citation) ? { citation: text(o.citation) } : {}),
  };
}

function parseRights(value: unknown): OwnerRow["rights"] {
  const rights: OwnerRow["rights"] = {};
  if (typeof value !== "object" || value === null) return rights;
  for (const [id, mark] of Object.entries(value as Record<string, unknown>)) {
    if (!RIGHT_IDS.has(id) || typeof mark !== "object" || mark === null) {
      continue;
    }
    const m = mark as Record<string, unknown>;
    if (typeof m.value !== "boolean") continue;
    if (m.writtenBy !== "notes" && m.writtenBy !== "you") continue;
    rights[id as DecisionRightId] = {
      value: m.value,
      writtenBy: m.writtenBy,
      ...(text(m.citation) ? { citation: text(m.citation) } : {}),
    };
  }
  return rights;
}

function parseAnswer(value: unknown): AnswerRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const a = value as Record<string, unknown>;
  const key = text(a.key);
  if (!key) return null;
  const answer: AnswerRecord = { key };
  if (typeof a.draft === "object" && a.draft !== null) {
    const d = a.draft as Record<string, unknown>;
    const words = raw(d.text);
    if (words && (d.writtenBy === "notes" || d.writtenBy === "ava")) {
      answer.draft = {
        text: words,
        writtenBy: d.writtenBy,
        ...(text(d.citation) ? { citation: text(d.citation) } : {}),
      };
    }
  }
  if (typeof a.accepted === "object" && a.accepted !== null) {
    const c = a.accepted as Record<string, unknown>;
    const words = raw(c.text);
    const by = text(c.by);
    const at = text(c.at);
    if (
      words &&
      by &&
      at &&
      (c.writtenBy === "notes" ||
        c.writtenBy === "ava" ||
        c.writtenBy === "you")
    ) {
      answer.accepted = {
        text: words,
        writtenBy: c.writtenBy,
        ...(text(c.citation) ? { citation: text(c.citation) } : {}),
        action: c.action === "accepted" ? "accepted" : "saved",
        by,
        at,
      };
    }
  }
  return answer;
}

export function parseOperatingAdoption(
  value: string | null | undefined,
): OperatingAdoption | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed.startsWith("{")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const o = parsed as Record<string, unknown>;
  if (o.kind !== OPERATING_ADOPTION_KIND || o.version !== 1) return null;

  const seen = new Set<string>();
  const rows: OwnerRow[] = [];
  for (const item of Array.isArray(o.rows) ? o.rows : []) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    const rowId = text(r.rowId);
    const source = r.source;
    if (!rowId || seen.has(rowId)) continue;
    if (source !== "step1" && source !== "team") continue;
    seen.add(rowId);
    const owner = parseOwner(r.owner);
    rows.push({
      rowId,
      source,
      name: typeof r.name === "string" ? r.name.trim() : "",
      ...(owner ? { owner } : {}),
      rights: parseRights(r.rights),
    });
  }

  const keys = new Set<string>();
  const answers: AnswerRecord[] = [];
  for (const item of Array.isArray(o.answers) ? o.answers : []) {
    const answer = parseAnswer(item);
    if (!answer || keys.has(answer.key)) continue;
    keys.add(answer.key);
    answers.push(answer);
  }

  const record: OperatingAdoption = {
    kind: OPERATING_ADOPTION_KIND,
    version: 1,
    rows,
    answers,
  };
  if (text(o.ownersAcceptedBy) && text(o.ownersAcceptedAt)) {
    record.ownersAcceptedBy = text(o.ownersAcceptedBy);
    record.ownersAcceptedAt = text(o.ownersAcceptedAt);
  }
  if (typeof o.ownerLines === "object" && o.ownerLines !== null) {
    const l = o.ownerLines as Record<string, unknown>;
    if (text(l.key) && raw(l.text)) {
      record.ownerLines = { key: text(l.key)!, text: raw(l.text)! };
    }
  }
  if (typeof o.baseline === "object" && o.baseline !== null) {
    const b = o.baseline as Record<string, unknown>;
    if (text(b.name) && text(b.savedBy) && text(b.savedAt)) {
      record.baseline = {
        name: text(b.name)!,
        savedBy: text(b.savedBy)!,
        savedAt: text(b.savedAt)!,
      };
    }
  }
  if (typeof o.routeFlag === "object" && o.routeFlag !== null) {
    const f = o.routeFlag as Record<string, unknown>;
    const quote = text(f.quote);
    const profile = f.profile as ChangeProfile;
    if (
      quote &&
      PROFILES.has(profile) &&
      typeof f.line === "number" &&
      Number.isFinite(f.line)
    ) {
      record.routeFlag = {
        profile,
        quote,
        line: f.line,
        ...(text(f.dismissedBy) && text(f.dismissedAt)
          ? {
              dismissedBy: text(f.dismissedBy),
              dismissedAt: text(f.dismissedAt),
            }
          : {}),
      };
    }
  }
  return record;
}

export function serializeOperatingAdoption(value: OperatingAdoption): string {
  return JSON.stringify(value);
}

// ── What the step asks, per profile ─────────────────────────────────────────

export type WorkProfile = Exclude<ChangeProfile, "technical">;

export interface CaptureTextRow {
  /** The capture answer it writes. Never shown on screen. */
  key: string;
  /** The row's subject: "What changes in people's work". */
  label: string;
  /** How the page names the answer: "the Move's workflow change answer". */
  short: string;
  /** The change-size lines sit under this row. */
  size?: true;
}

/** Two capture-text rows per profile; their keys are the registry's P3.3 keys. */
export const CAPTURE_TEXT_ROWS: Readonly<
  Record<WorkProfile, readonly CaptureTextRow[]>
> = {
  limited: [
    {
      key: "workflow_delta",
      label: "What changes in people’s work",
      short: "workflow change",
      size: true,
    },
    {
      key: "process_adoption_boundary",
      label: "Where adoption stops",
      short: "adoption boundary",
    },
  ],
  full: [
    {
      key: "operating_model",
      label: "Who does what once it’s live",
      short: "operating model",
      size: true,
    },
    {
      key: "process_design",
      label: "The changed process, start to finish",
      short: "process design",
    },
  ],
};

/** Where the accepted owners grid is written as plain owner lines. */
export const OWNER_LINES_KEY: Readonly<Record<WorkProfile, string>> = {
  limited: "process_adoption_boundary",
  full: "operating_model",
};

// ── The owners grid ─────────────────────────────────────────────────────────

/** One row of the grid as the page shows it. */
export interface GridRow {
  rowId: string;
  source: "step1" | "team";
  rank: number;
  /** The design element as Step 1 accepted it, or a team row's name. */
  name: string;
  owner?: OwnerChoice;
  rights: OwnerRow["rights"];
}

/** An element Step 1 handed to another program: listed, never staffed here. */
export interface HandedOffRow {
  causeId: string;
  cause: string;
  program: string;
  owner: string;
}

export interface OwnerGrid {
  rows: GridRow[];
  handedOff: HandedOffRow[];
}

/**
 * The grid: Step 1's accepted design elements in rank, then the team's rows in
 * the order they were added. A stored owner carries over only while Step 1
 * still holds the same element words.
 */
export function ownerGrid(
  p2RootCauses: string,
  traceability: DesignTraceability,
  record: OperatingAdoption,
): OwnerGrid {
  const stored = new Map(record.rows.map((r) => [r.rowId, r]));
  const rows: GridRow[] = [];
  const handedOff: HandedOffRow[] = [];
  for (const t of traceRows(p2RootCauses, traceability)) {
    const link = t.link;
    if (link?.status === "accepted" && link.element) {
      const s = stored.get(t.causeId);
      const same = s?.source === "step1" && s.name === link.element;
      rows.push({
        rowId: t.causeId,
        source: "step1",
        rank: t.rank,
        name: link.element,
        ...(same && s.owner ? { owner: s.owner } : {}),
        rights: same ? s.rights : {},
      });
    } else if (link?.status === "handed_off" && link.program && link.owner) {
      handedOff.push({
        causeId: t.causeId,
        cause: t.cause,
        program: link.program,
        owner: link.owner,
      });
    }
  }
  const base = rows.length;
  record.rows
    .filter((r) => r.source === "team")
    .forEach((r, index) =>
      rows.push({
        rowId: r.rowId,
        source: "team",
        rank: base + index + 1,
        name: r.name,
        ...(r.owner ? { owner: r.owner } : {}),
        rights: r.rights,
      }),
    );
  return { rows, handedOff };
}

export function missingOwnerCount(grid: OwnerGrid): number {
  return grid.rows.filter((r) => !r.owner).length;
}

/** Every row has a name and an owner: the grid may be accepted. */
export function canAcceptOwners(grid: OwnerGrid): boolean {
  return grid.rows.every((r) => r.owner && r.name.trim());
}

/**
 * Accepted, and still true of the grid on screen: every row (including one
 * Step 1 added since) has its name and owner, as accepted.
 */
export function ownersSettled(
  record: OperatingAdoption,
  grid: OwnerGrid,
): boolean {
  return Boolean(record.ownersAcceptedAt) && canAcceptOwners(grid);
}

const rightPhrases = (row: Pick<GridRow, "rights">) =>
  DECISION_RIGHTS.filter((r) => row.rights[r.id]?.value).map((r) => r.phrase);

/**
 * The plain owner lines the page writes into a capture answer: the team's
 * words only — the element's name, the owner, the rights it holds — with no
 * label, id or badge. "Stewardship council: owner Data governance lead;
 * certifies its output, approves access".
 */
export function ownerLinesText(grid: OwnerGrid): string {
  return grid.rows
    .filter((r) => r.owner && r.name.trim())
    .map((r) => {
      const rights = rightPhrases(r);
      return `${r.name.trim()}: owner ${r.owner!.name}${rights.length ? `; ${rights.join(", ")}` : ""}`;
    })
    .join("\n");
}

/**
 * Remove an exact copy of a section the page wrote. Words the page cannot
 * prove it wrote are left exactly as they are.
 */
export function withoutPageSection(
  current: string,
  section: string | undefined,
): string {
  if (!section?.trim()) return current;
  const at = current.lastIndexOf(section);
  if (at < 0) return current;
  const before = current.slice(0, at).replace(/\s+$/, "");
  const after = current.slice(at + section.length).replace(/^\s+/, "");
  return before && after ? `${before}\n\n${after}` : before || after;
}

/** The team's words, followed by the page's section when there is one. */
export function withPageSection(teamWords: string, section: string): string {
  const words = teamWords.replace(/\s+$/, "");
  if (!section.trim()) return words;
  return words.trim() ? `${words}\n\n${section}` : section;
}

/** The team's own words in a capture answer: the page's owner lines removed. */
export function teamWords(
  record: OperatingAdoption,
  key: string,
  value: string,
): string {
  return record.ownerLines?.key === key
    ? withoutPageSection(value, record.ownerLines.text)
    : value;
}

// ── Edits ───────────────────────────────────────────────────────────────────

export type OperatingEdit =
  | { ok: true; value: OperatingAdoption }
  | { ok: false; reason: string };

/** Any change to the grid reopens it: an accepted grid is the grid accepted. */
function gridEdited(
  record: OperatingAdoption,
  rows: OwnerRow[],
): OperatingAdoption {
  const { ownersAcceptedAt, ownersAcceptedBy, ...rest } = record;
  void ownersAcceptedAt;
  void ownersAcceptedBy;
  return { ...rest, rows };
}

function storedRowFor(record: OperatingAdoption, row: GridRow): OwnerRow {
  const s = record.rows.find((r) => r.rowId === row.rowId);
  return s && s.name === row.name && s.source === row.source
    ? s
    : { rowId: row.rowId, source: row.source, name: row.name, rights: {} };
}

function putRow(record: OperatingAdoption, next: OwnerRow): OwnerRow[] {
  const at = record.rows.findIndex((r) => r.rowId === next.rowId);
  if (at < 0) return [...record.rows, next];
  return record.rows.map((r, i) => (i === at ? next : r));
}

/** The consultant chooses an owner: theirs from now on, badge removed. */
export function chooseOwner(
  record: OperatingAdoption,
  row: GridRow,
  name: string,
): OperatingAdoption {
  const base = storedRowFor(record, row);
  const { owner, ...rest } = base;
  void owner;
  const next: OwnerRow = name.trim()
    ? { ...rest, owner: { name: name.trim(), writtenBy: "you" } }
    : rest;
  return gridEdited(record, putRow(record, next));
}

export function markRight(
  record: OperatingAdoption,
  row: GridRow,
  right: DecisionRightId,
  value: boolean,
): OperatingAdoption {
  const base = storedRowFor(record, row);
  const next: OwnerRow = {
    ...base,
    rights: { ...base.rights, [right]: { value, writtenBy: "you" } },
  };
  return gridEdited(record, putRow(record, next));
}

export function addTeamRow(record: OperatingAdoption): OperatingAdoption {
  const used = record.rows
    .map((r) => /^T-(\d+)$/.exec(r.rowId)?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number);
  const id = `T-${(used.length ? Math.max(...used) : 0) + 1}`;
  return gridEdited(record, [
    ...record.rows,
    { rowId: id, source: "team", name: "", rights: {} },
  ]);
}

export function nameTeamRow(
  record: OperatingAdoption,
  rowId: string,
  name: string,
): OperatingEdit {
  const row = record.rows.find((r) => r.rowId === rowId);
  if (row?.source !== "team") {
    return {
      ok: false,
      reason:
        "Only a row the team added can be renamed here; Step 1 names its design elements.",
    };
  }
  return {
    ok: true,
    value: gridEdited(record, putRow(record, { ...row, name })),
  };
}

export function removeTeamRow(
  record: OperatingAdoption,
  rowId: string,
): OperatingEdit {
  const row = record.rows.find((r) => r.rowId === rowId);
  if (row?.source !== "team") {
    return {
      ok: false,
      reason:
        "Only a row the team added can be removed; Step 1 owns its design elements.",
    };
  }
  return {
    ok: true,
    value: gridEdited(
      record,
      record.rows.filter((r) => r.rowId !== rowId),
    ),
  };
}

/** A capture-answer write the edit implies, beside the record. */
export interface StepWrite {
  record: OperatingAdoption;
  /** Capture answers to write, by key. */
  answers: Record<string, string>;
}

export type StepWriteResult =
  | ({ ok: true } & StepWrite)
  | { ok: false; reason: string };

/**
 * Accept the owners and decision rights, and write them as plain owner lines
 * into the profile's capture answer, after the team's own words. Only the
 * section this page wrote before is replaced; nothing else in the answer moves.
 */
export function acceptOwners(args: {
  record: OperatingAdoption;
  grid: OwnerGrid;
  profile: WorkProfile;
  values: Readonly<Record<string, string>>;
  by: string;
  at: string;
}): StepWriteResult {
  const { record, grid, profile } = args;
  const open = missingOwnerCount(grid);
  if (open > 0) {
    return {
      ok: false,
      reason: `${open} design element${open === 1 ? " still needs" : "s still need"} an owner.`,
    };
  }
  if (!canAcceptOwners(grid)) {
    return { ok: false, reason: "Name every row you added before accepting." };
  }
  const key = OWNER_LINES_KEY[profile];
  const lines = ownerLinesText(grid);
  const words = teamWords(record, key, args.values[key] ?? "");
  const rows: OwnerRow[] = grid.rows.map((r) => ({
    rowId: r.rowId,
    source: r.source,
    name: r.name.trim(),
    ...(r.owner ? { owner: r.owner } : {}),
    rights: r.rights,
  }));
  const next: OperatingAdoption = {
    ...record,
    rows,
    ownersAcceptedBy: args.by,
    ownersAcceptedAt: args.at,
  };
  if (lines) next.ownerLines = { key, text: lines };
  else delete next.ownerLines;
  return {
    ok: true,
    record: next,
    answers: { [key]: withPageSection(words, lines) },
  };
}

/** Reopen the grid: the page takes back only the owner lines it wrote. */
export function reopenOwners(args: {
  record: OperatingAdoption;
  values: Readonly<Record<string, string>>;
}): StepWrite {
  const { record } = args;
  const { ownersAcceptedAt, ownersAcceptedBy, ownerLines, ...rest } = record;
  void ownersAcceptedAt;
  void ownersAcceptedBy;
  if (!ownerLines) return { record: rest, answers: {} };
  return {
    record: rest,
    answers: {
      [ownerLines.key]: withoutPageSection(
        args.values[ownerLines.key] ?? "",
        ownerLines.text,
      ),
    },
  };
}

function putAnswer(
  record: OperatingAdoption,
  answer: AnswerRecord,
): AnswerRecord[] {
  const rest = record.answers.filter((a) => a.key !== answer.key);
  return answer.draft || answer.accepted ? [...rest, answer] : rest;
}

export function answerFor(
  record: OperatingAdoption,
  key: string,
): AnswerRecord | undefined {
  return record.answers.find((a) => a.key === key);
}

/**
 * Accept someone else's words, or save words just typed: the text is written
 * to its capture answer as plain text. On the owner-lines answer the page's
 * own section stays after the team's words.
 */
export function commitAnswer(args: {
  record: OperatingAdoption;
  key: string;
  text: string;
  writtenBy: Writer;
  citation?: string;
  action: "accepted" | "saved";
  by: string;
  at: string;
}): StepWriteResult {
  const words = args.text.trim();
  if (!words)
    return { ok: false, reason: "Write the answer before saving it." };
  const { record, key } = args;
  const answer: AnswerRecord = {
    key,
    accepted: {
      text: words,
      writtenBy: args.writtenBy,
      ...(args.citation?.trim() ? { citation: args.citation.trim() } : {}),
      action: args.action,
      by: args.by,
      at: args.at,
    },
  };
  const section = record.ownerLines?.key === key ? record.ownerLines.text : "";
  return {
    ok: true,
    record: { ...record, answers: putAnswer(record, answer) },
    answers: { [key]: withPageSection(words, section) },
  };
}

/** Reopen an answer: it stays in its capture answer, unconfirmed. */
export function reopenAnswer(
  record: OperatingAdoption,
  key: string,
): OperatingAdoption {
  const current = answerFor(record, key);
  return {
    ...record,
    answers: putAnswer(record, {
      key,
      ...(current?.draft ? { draft: current.draft } : {}),
    }),
  };
}

/** A draft from notes or aVa, kept on the record until someone accepts it. */
export function draftAnswer(
  record: OperatingAdoption,
  key: string,
  draft: NonNullable<AnswerRecord["draft"]>,
): OperatingAdoption {
  const current = answerFor(record, key);
  return {
    ...record,
    answers: putAnswer(record, {
      key,
      draft,
      ...(current?.accepted ? { accepted: current.accepted } : {}),
    }),
  };
}

export function saveBaselineOwner(
  record: OperatingAdoption,
  name: string,
  by: string,
  at: string,
): OperatingEdit {
  if (!name.trim()) {
    return { ok: false, reason: "Choose who receives the baseline first." };
  }
  return {
    ok: true,
    value: {
      ...record,
      baseline: { name: name.trim(), savedBy: by, savedAt: at },
    },
  };
}

export function reopenBaselineOwner(
  record: OperatingAdoption,
): OperatingAdoption {
  const { baseline, ...rest } = record;
  void baseline;
  return rest;
}

export function raiseRouteFlag(
  record: OperatingAdoption,
  flag: Pick<RouteFlag, "profile" | "quote" | "line">,
): OperatingAdoption {
  const prior = record.routeFlag;
  // A dismissed flag stays dismissed for the same words.
  if (
    prior?.dismissedAt &&
    prior.profile === flag.profile &&
    prior.quote === flag.quote
  ) {
    return record;
  }
  return { ...record, routeFlag: { ...flag } };
}

export function dismissRouteFlag(
  record: OperatingAdoption,
  by: string,
  at: string,
): OperatingAdoption {
  if (!record.routeFlag) return record;
  return {
    ...record,
    routeFlag: { ...record.routeFlag, dismissedBy: by, dismissedAt: at },
  };
}

/** A route flag still waiting on the consultant, for this route only. */
export function openRouteFlag(
  record: OperatingAdoption,
  profile: ChangeProfile,
): RouteFlag | null {
  const flag = record.routeFlag;
  return flag &&
    flag.profile === profile &&
    profile !== "full" &&
    !flag.dismissedAt
    ? flag
    : null;
}

// ── Readiness ───────────────────────────────────────────────────────────────

export type TextRowState =
  | {
      state: "settled";
      text: string;
      accepted: NonNullable<AnswerRecord["accepted"]>;
    }
  /** Words in the capture answer that this page has not accepted. */
  | { state: "draft"; text: string; writtenBy: "capture" | "ava" }
  /** A draft on the record (from notes or aVa), not yet in the capture answer. */
  | {
      state: "record_draft";
      text: string;
      writtenBy: "notes" | "ava";
      citation?: string;
    }
  | { state: "empty" };

/**
 * One capture-text row's state. Settled only while the capture answer still
 * holds exactly the words accepted here: an edit made elsewhere asks again.
 */
export function textRowState(
  record: OperatingAdoption,
  key: string,
  value: string,
  avaDraft: boolean,
): TextRowState {
  const words = teamWords(record, key, value).trim();
  const answer = answerFor(record, key);
  if (words && answer?.accepted && answer.accepted.text.trim() === words) {
    return { state: "settled", text: words, accepted: answer.accepted };
  }
  if (words) {
    return {
      state: "draft",
      text: words,
      writtenBy: avaDraft ? "ava" : "capture",
    };
  }
  if (answer?.draft) {
    return {
      state: "record_draft",
      text: answer.draft.text,
      writtenBy: answer.draft.writtenBy,
      ...(answer.draft.citation ? { citation: answer.draft.citation } : {}),
    };
  }
  return { state: "empty" };
}

export interface OperatingAdoptionInputs {
  profile: ChangeProfile;
  record: OperatingAdoption;
  grid: OwnerGrid;
  /** The profile's capture answers, by key. */
  values: Readonly<Record<string, string>>;
  /** Capture answers that hold an unsaved aVa draft. */
  avaDraftKeys?: readonly string[];
}

/** Row ids, in the step's fixed order. */
export const ROW_IDS = {
  owners: "OWN",
  baseline: "MEAS",
  flag: "FLAG",
} as const;

/**
 * The step's rows as the template counts them: the owners grid, the two
 * capture-text rows, the baseline owner, then any route flag (an advisory:
 * never counted, never blocking, its clause last). Each open row carries its
 * own clause in the page's row order.
 */
export function operatingAdoptionRows(
  input: OperatingAdoptionInputs,
): StepRow[] {
  if (input.profile === "technical") {
    const flag = openRouteFlag(input.record, "technical");
    return flag ? [flagRow()] : [];
  }
  const { record, grid } = input;
  const missing = missingOwnerCount(grid);
  const owners: StepRow = {
    id: ROW_IDS.owners,
    rank: 1,
    subject: "Owners and decision rights",
    state: ownersSettled(record, grid) ? "settled" : "decision",
    clause:
      missing > 0
        ? `name ${missing} owner${missing === 1 ? "" : "s"} and accept the decision rights`
        : "accept the owners and decision rights",
  };
  const texts = CAPTURE_TEXT_ROWS[input.profile].map((row, index): StepRow => {
    const state = textRowState(
      record,
      row.key,
      input.values[row.key] ?? "",
      Boolean(input.avaDraftKeys?.includes(row.key)),
    );
    return {
      id: row.key,
      rank: 2 + index,
      subject: row.label,
      state:
        state.state === "settled"
          ? "settled"
          : state.state === "empty"
            ? "decision"
            : "draft",
      clause: `write the ${row.short}`,
      draftClause: `confirm the ${row.short}`,
    };
  });
  const baseline: StepRow = {
    id: ROW_IDS.baseline,
    rank: 4,
    subject: "Who receives the baseline",
    state: record.baseline ? "settled" : "decision",
    clause: "name who receives the baseline",
  };
  const flag = openRouteFlag(record, input.profile);
  return [owners, ...texts, baseline, ...(flag ? [flagRow()] : [])];
}

function flagRow(): StepRow {
  return {
    id: ROW_IDS.flag,
    rank: 5,
    subject: "Your notes suggest a heavier change than the route",
    state: "advisory",
    clause: "decide whether to re-check the P2 route",
  };
}

export const OPERATING_SKIPPED_SENTENCE =
  "Nothing to do here. The P2 route makes this a technical change, so the business-change boundary attestation stands in for this step.";
export const OPERATING_READY_SENTENCE =
  "Owners are named, the change is written in the team’s words, and the baseline owner is named. Continue to Delivery & estimate";
export const OPERATING_BLOCKED_SENTENCE =
  "Waiting on Step 2: no direction is settled yet, so there is nothing to staff";

const DEPTH_OF: Readonly<Record<ChangeProfile, "skip" | "light" | "full">> = {
  technical: "skip",
  limited: "light",
  full: "full",
};

/**
 * The step's NextAction: skipped on a technical route (Continue enabled),
 * blocked until Step 2 is settled, otherwise the clauses in row order with
 * the route flag last. `extraRows` are the page's own rows that sit beside
 * these (evidence to review), counted and stated by the same rules.
 */
export function operatingAdoptionNextAction(args: {
  input: OperatingAdoptionInputs;
  step2Done: boolean;
  extraRows?: readonly StepRow[];
}): StepNextAction {
  return resolveStepNextAction({
    depth: DEPTH_OF[args.input.profile],
    rows: [...(args.extraRows ?? []), ...operatingAdoptionRows(args.input)],
    blockedBy: args.step2Done ? null : OPERATING_BLOCKED_SENTENCE,
    readySentence: OPERATING_READY_SENTENCE,
    emptySentence: "Name the owners and describe the change",
    clausesInRowOrder: true,
    skippedSentence: OPERATING_SKIPPED_SENTENCE,
  });
}

/**
 * Step 3 is done: Skipped counts as done on a technical route; otherwise every
 * counted row is settled. The route flag never holds it.
 */
export function isOperatingAdoptionComplete(
  input: OperatingAdoptionInputs,
): boolean {
  if (input.profile === "technical") return true;
  return operatingAdoptionRows(input)
    .filter((r) => r.state !== "advisory")
    .every((r) => r.state === "settled");
}

// ── Text readers ────────────────────────────────────────────────────────────

/** For the build's decision context, the next phase and cited evidence. */
export function operatingAdoptionText(value: OperatingAdoption): string {
  const named = value.rows.filter((r) => r.owner && r.name.trim());
  const lines: string[] = [];
  if (named.length) {
    lines.push(
      value.ownersAcceptedAt
        ? `Owners and decision rights, accepted by ${value.ownersAcceptedBy} on ${value.ownersAcceptedAt}:`
        : "Owners and decision rights (not yet accepted):",
      ...named.map((r) => {
        const rights = DECISION_RIGHTS.filter((d) => r.rights[d.id]?.value).map(
          (d) => d.label.toLowerCase(),
        );
        return `- ${r.name}: owner ${r.owner!.name}${rights.length ? `; ${rights.join(", ")}` : ""}`;
      }),
    );
  }
  if (value.baseline) {
    lines.push(
      `Receives the baseline: ${value.baseline.name}, named by ${value.baseline.savedBy} on ${value.baseline.savedAt}.`,
    );
  }
  return lines.length ? lines.join("\n") : "No owners named yet.";
}

/**
 * Only the team's words, for the gate's phrase checks: the rows' names and
 * owners once accepted, and the baseline owner. No labels, ids or rights
 * glossary, and nothing unaccepted.
 */
export function operatingAdoptionGateText(value: OperatingAdoption): string {
  const owners = value.ownersAcceptedAt
    ? value.rows.flatMap((r) => (r.owner ? [r.name, r.owner.name] : []))
    : [];
  return [...owners, value.baseline?.name]
    .filter((part): part is string => Boolean(part?.trim()))
    .join("\n");
}
