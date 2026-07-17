import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => String(cell).trim() !== ""));
}

export function rowsFromCsv(text) {
  const parsed = parseCsv(text);
  const [headers, ...dataRows] = parsed;
  return dataRows.map((cells, index) => ({
    values: Object.fromEntries(headers.map((header, col) => [header, cells[col] ?? ""])),
    sourceRowNumber: index + 2,
  }));
}

export function readCsv(filePath) {
  return rowsFromCsv(fs.readFileSync(filePath, "utf8")).map((row) => ({
    ...row.values,
    __sourceRowNumber: row.sourceRowNumber,
    __sourceFile: filePath,
  }));
}

export function readHeader(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/, 1)[0].split(",");
}

export function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function writeCsv(filePath, headers, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header] ?? "")).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

export function checksumFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function slug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function key(...parts) {
  return parts.filter(Boolean).join(":").replace(/[^a-zA-Z0-9:_./-]+/g, "_").slice(0, 360);
}

export function pickRecordName(row) {
  return row.record_name
    || row.entity_name
    || row.function_name
    || row.org_unit_name
    || row.persona_name
    || row.system_name
    || row.data_asset_name
    || row.vendor_name
    || row.priority_name
    || row.ai_use_case
    || row.process_control_name
    || row.source_artifact_label
    || row.metric_name
    || row.pattern_name
    || row.expert_lens_name
    || row.service_tower
    || row.process
    || row.estate_item_name
    || row.chunk_id
    || row.relationship_id
    || "unnamed record";
}
