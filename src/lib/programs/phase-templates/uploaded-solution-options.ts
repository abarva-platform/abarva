// Solution options the client supplied as Move evidence.
//
// The design phase asks which approach architecture should implement. A Move
// can carry its own answer set: an approved evidence file listing the options
// under consideration, each with a declared id. Until this module existed that
// file reached generation as background evidence only — the options offered
// for decision, and the one recorded as approved, came from a built-in set
// chosen by matching keywords in the Move's text. The client's "OPT-B" and the
// built-in "B" are different proposals that happen to share a letter.
//
// Identity is declared, never inferred: a table counts as an option set only
// when it has an explicit option-id column and a name column. Nothing here
// guesses that a table "looks like" options.
//
// Pure: no I/O, so the server page can call it and tests can pin it.

export interface UploadedSolutionOption {
  /** The id as the client wrote it, e.g. "OPT-B". */
  id: string;
  name: string;
  benefit: string;
  tradeoff: string;
  condition: string;
  scope: string;
}

export interface UploadedSolutionOptionSet {
  /** Title of the evidence item the options came from. */
  sourceTitle: string;
  options: UploadedSolutionOption[];
}

export interface UploadedOptionEvidence {
  title: string;
  phase: number | null;
  extractedText?: string | null;
  extractedStructured?: Record<string, unknown> | null;
}

const ID_HEADERS = new Set(["option_id", "optionid", "option id", "option"]);
const NAME_HEADERS = new Set([
  "name",
  "option_name",
  "option name",
  "label",
  "title",
]);
const BENEFIT_HEADERS = ["benefit", "benefits", "value", "impact"];
const TRADEOFF_HEADERS = [
  "tradeoff",
  "trade_off",
  "trade-off",
  "tradeoffs",
  "risk",
  "risks",
];
const CONDITION_HEADERS = [
  "condition",
  "conditions",
  "precondition",
  "preconditions",
];
const SCOPE_HEADERS = ["scope", "estimate_scope", "in_scope"];

const DESIGN_PHASE = 3;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

function normaliseHeader(header: string): string {
  return header.trim().toLowerCase();
}

/** Split one CSV line, honouring quoted fields and doubled quotes. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

interface Table {
  headers: string[];
  rows: string[][];
}

function tablesFromStructured(
  structured: Record<string, unknown> | null | undefined,
): Table[] {
  const tables = structured?.tables;
  if (!Array.isArray(tables)) return [];
  return tables.flatMap((table) => {
    const record = table as { headers?: unknown; rows?: unknown };
    if (!Array.isArray(record.headers) || !Array.isArray(record.rows))
      return [];
    return [
      {
        headers: record.headers.map(String),
        rows: record.rows
          .filter((row): row is unknown[] => Array.isArray(row))
          .map((row) => row.map((cell) => String(cell ?? "").trim())),
      },
    ];
  });
}

function tableFromCsvText(text: string | null | undefined): Table[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2 || !lines[0].includes(",")) return [];
  return [
    { headers: splitCsvLine(lines[0]), rows: lines.slice(1).map(splitCsvLine) },
  ];
}

function optionsFromTable(table: Table): UploadedSolutionOption[] {
  const headers = table.headers.map(normaliseHeader);
  const idIndex = headers.findIndex((header) => ID_HEADERS.has(header));
  const nameIndex = headers.findIndex((header) => NAME_HEADERS.has(header));
  if (idIndex < 0 || nameIndex < 0) return [];
  const column = (candidates: string[]) =>
    headers.findIndex((header) => candidates.includes(header));
  const benefitIndex = column(BENEFIT_HEADERS);
  const tradeoffIndex = column(TRADEOFF_HEADERS);
  const conditionIndex = column(CONDITION_HEADERS);
  const scopeIndex = column(SCOPE_HEADERS);
  const cell = (row: string[], index: number) =>
    index >= 0 ? (row[index] ?? "").trim() : "";

  const seen = new Set<string>();
  const options: UploadedSolutionOption[] = [];
  for (const row of table.rows) {
    const id = cell(row, idIndex);
    const name = cell(row, nameIndex);
    if (!id || !name) continue;
    const key = id.toLowerCase();
    // A repeated id is not two options; which row is meant is not ours to pick.
    if (seen.has(key)) return [];
    seen.add(key);
    options.push({
      id,
      name,
      benefit: cell(row, benefitIndex),
      tradeoff: cell(row, tradeoffIndex),
      condition: cell(row, conditionIndex),
      scope: cell(row, scopeIndex),
    });
  }
  return options.length >= MIN_OPTIONS && options.length <= MAX_OPTIONS
    ? options
    : [];
}

/**
 * The option set declared in the Move's approved design-phase evidence, or
 * null when there is not exactly one.
 *
 * Two evidence items each declaring a set is a conflict the client has to
 * resolve; returning either would be choosing for them.
 */
export function parseUploadedSolutionOptions(
  evidence: readonly UploadedOptionEvidence[],
): UploadedSolutionOptionSet | null {
  const found: UploadedSolutionOptionSet[] = [];
  for (const item of evidence) {
    if (item.phase !== null && item.phase !== DESIGN_PHASE) continue;
    const tables = [
      ...tablesFromStructured(item.extractedStructured),
      ...tableFromCsvText(item.extractedText),
    ];
    for (const table of tables) {
      const options = optionsFromTable(table);
      if (options.length > 0) {
        found.push({ sourceTitle: item.title, options });
        break;
      }
    }
  }
  return found.length === 1 ? found[0] : null;
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Which option a written recommendation names, or "" when it names none or
 * more than one cannot be told apart.
 *
 * An id is matched as a whole token. The earlier check looked for `<id>:` as a
 * substring, so the one-letter id "a" matched any word ending in "a" before a
 * colon ("data:", "criteria:") and "b" matched "OPT-B:" from a different
 * option set entirely.
 */
export function inferSelectedOptionId(
  recommendation: unknown,
  options: ReadonlyArray<{ id: string; label: string; recommended?: boolean }>,
): string {
  const text = String(recommendation ?? "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();

  const named = options.filter((option) => {
    const id = escapeForRegex(option.id.toLowerCase());
    const idPattern =
      option.id.length <= 2
        ? new RegExp(`(?:^|[^a-z0-9-])option\\s+${id}(?![a-z0-9-])`)
        : new RegExp(`(?:^|[^a-z0-9-])${id}(?![a-z0-9-])`);
    return idPattern.test(lower) || lower.includes(option.label.toLowerCase());
  });
  if (named.length === 1) return named[0].id;
  if (named.length > 1) {
    // Several options are mentioned — a recommendation usually names the
    // rejected ones too. Take the one that is stated FIRST only when the text
    // opens with it; otherwise the choice is ambiguous and stays unselected.
    const opening = lower.slice(0, 160);
    const openers = named.filter(
      (option) =>
        opening.includes(option.id.toLowerCase()) ||
        opening.includes(option.label.toLowerCase()),
    );
    if (openers.length === 1) return openers[0].id;
    return "";
  }
  const recommended = options.find((option) => option.recommended);
  return recommended && /\brecommended\b/.test(lower) ? recommended.id : "";
}

/**
 * The option a recorded approval points at, among the options now on screen.
 *
 * Selection is local to the page, so a reload forgot a decision the server
 * had already recorded and asked for it again. The approved option is
 * restored only when it is still one of the options offered: matched by name,
 * because an id like "B" means a different option in a different option set.
 */
export function restoreApprovedOptionId(
  approved: { selectedOptionId?: string; chosenOption?: string } | null | undefined,
  options: ReadonlyArray<{ id: string; label: string }>,
): string {
  const name = String(approved?.chosenOption ?? "").trim().toLowerCase();
  if (!name) return "";
  const byName = options.filter(
    (option) => option.label.trim().toLowerCase() === name,
  );
  if (byName.length === 1) return byName[0].id;
  if (byName.length > 1) {
    return (
      byName.find((option) => option.id === approved?.selectedOptionId)?.id ?? ""
    );
  }
  return "";
}
