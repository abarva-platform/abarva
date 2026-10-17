import type { RenderableSection, RenderableTable } from "./types";

const REQUIRED_COLUMNS = [
  /\bsymptom\b/i,
  /\bcause\b/i,
  /\bevidence\b/i,
  /\bconfidence\b/i,
  /\bimplication\b/i,
];

/** A heading or slide key alone is not a rendered diagnostic matrix. */
export function isRootCauseTable(table: RenderableTable): boolean {
  return (
    table.key === "symptom_cause_table" &&
    table.targetFormat !== "xlsx" &&
    REQUIRED_COLUMNS.every((pattern) =>
      table.columns.some((column) => pattern.test(column)),
    ) &&
    table.rows.length > 0 &&
    table.rows.every(
      (row) =>
        row.length === table.columns.length &&
        row.every((cell) => cell.trim().length > 0),
    )
  );
}

function cells(line: string): string[] {
  const parts = line.trim().split(/(?<!\\)\|/);
  if (parts[0] === "") parts.shift();
  if (parts.at(-1) === "") parts.pop();
  return parts.map((part) => part.trim().replace(/\\\|/g, "|"));
}

/** Preserve a section's actual matrix when synthesis omitted its native table. */
export function preserveRootCauseTable(
  deliverableType: string,
  sections: readonly RenderableSection[],
  tables: RenderableTable[],
): void {
  if (
    !["root_cause", "root_cause_worksheet"].includes(deliverableType) ||
    tables.some(isRootCauseTable)
  )
    return;
  const section = sections.find((item) => item.key === "symptom_cause_table");
  if (!section) return;
  const lines = section.bodyMarkdown.split(/\r?\n/);
  let fenced = false;
  for (let index = 0; index < lines.length - 2; index++) {
    if (/^\s*(```|~~~)/.test(lines[index]!)) {
      fenced = !fenced;
      continue;
    }
    if (fenced || !lines[index]!.includes("|")) continue;
    const columns = cells(lines[index]!);
    const separator = cells(lines[index + 1]!);
    if (
      columns.length < REQUIRED_COLUMNS.length ||
      separator.length !== columns.length ||
      !separator.every((cell) => /^:?-{3,}:?$/.test(cell))
    )
      continue;
    const rows: string[][] = [];
    for (let row = index + 2; row < lines.length; row++) {
      if (!lines[row]!.trim() || !lines[row]!.includes("|")) break;
      rows.push(cells(lines[row]!));
    }
    const table: RenderableTable = {
      key: "symptom_cause_table",
      title: section.title,
      columns,
      rows,
      targetFormat: "pptx",
      pageShape: "register",
    };
    if (!isRootCauseTable(table)) continue;
    const existing = tables.findIndex((item) => item.key === table.key);
    if (existing < 0) tables.push(table);
    else tables[existing] = table;
    return;
  }
}
