export type ExecutiveCanvasType =
  | "investmentSequencingMap"
  | "valueReadinessMatrix"
  | "gateToValueRoadmap"
  | "proofBoundary";

export interface ExecutiveCanvasItem {
  label: string;
  value?: number;
  readiness?: number;
  risk?: number;
  action?: string;
  owner?: string;
  gate?: string;
  note?: string;
}

export interface ExecutiveCanvasColumn {
  label: string;
  items: Array<string | ExecutiveCanvasItem>;
}

export interface ExecutiveCanvasGate {
  label: string;
  owner?: string;
  dependency?: string;
  valueUnlocked?: string;
  status?: string;
}

export interface ExecutiveCanvasProofBoundary {
  known?: string[];
  assumed?: string[];
  missing?: string[];
  decisionRequired?: string;
}

export interface ExecutiveCanvasPayload {
  canvasType: ExecutiveCanvasType;
  title?: string;
  columns?: ExecutiveCanvasColumn[];
  items?: ExecutiveCanvasItem[];
  gates?: ExecutiveCanvasGate[];
  proofBoundary?: ExecutiveCanvasProofBoundary;
}

export interface ExtractedExecutiveCanvasPayloads {
  payloads: ExecutiveCanvasPayload[];
  visibleContent: string;
}

type BareExecutiveCanvasBlock = {
  start: number;
  end: number;
  payload?: ExecutiveCanvasPayload;
};

const EXECUTIVE_CANVAS_BLOCK_RE =
  /```(?:abarva-canvas|json\s+abarva-canvas)\s*\n([\s\S]*?)```/gim;

export function hasExecutiveCanvasPayload(content: string): boolean {
  EXECUTIVE_CANVAS_BLOCK_RE.lastIndex = 0;
  return (
    EXECUTIVE_CANVAS_BLOCK_RE.test(content) ||
    findBareExecutiveCanvasPayloads(content).length > 0
  );
}

export function extractExecutiveCanvasPayloads(
  content: string,
): ExtractedExecutiveCanvasPayloads {
  const payloads: ExecutiveCanvasPayload[] = [];
  const contentWithoutFencedBlocks = content
    .replace(EXECUTIVE_CANVAS_BLOCK_RE, (_match, rawPayload: string) => {
      const payload = parseExecutiveCanvasPayload(rawPayload);
      if (payload) payloads.push(payload);
      return "";
    })
    .trim();
  const bareBlocks = findBareExecutiveCanvasBlocks(contentWithoutFencedBlocks);
  for (const match of bareBlocks) {
    if (match.payload) payloads.push(match.payload);
  }
  const visibleContent = removeRanges(contentWithoutFencedBlocks, bareBlocks)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    payloads,
    visibleContent,
  };
}

function findBareExecutiveCanvasPayloads(
  content: string,
): Array<{ start: number; end: number; payload: ExecutiveCanvasPayload }> {
  return findBareExecutiveCanvasBlocks(content).filter(
    (
      block,
    ): block is {
      start: number;
      end: number;
      payload: ExecutiveCanvasPayload;
    } => Boolean(block.payload),
  );
}

function findBareExecutiveCanvasBlocks(
  content: string,
): BareExecutiveCanvasBlock[] {
  const matches: BareExecutiveCanvasBlock[] = [];
  let searchStart = 0;
  while (searchStart < content.length) {
    const canvasTypeIndex = content.indexOf('"canvasType"', searchStart);
    if (canvasTypeIndex < 0) break;
    const start = content.lastIndexOf("{", canvasTypeIndex);
    if (start < 0) {
      searchStart = canvasTypeIndex + 12;
      continue;
    }
    const end = findJsonObjectEnd(content, start);
    if (end < 0) {
      matches.push({ start, end: content.length });
      break;
    }
    const rawPayload = content.slice(start, end);
    const payload = parseExecutiveCanvasPayload(rawPayload);
    if (payload || looksLikeExecutiveCanvasPayload(rawPayload)) {
      matches.push({ start, end, ...(payload ? { payload } : {}) });
      searchStart = end;
      continue;
    }
    searchStart = canvasTypeIndex + 12;
  }
  return matches;
}

function findJsonObjectEnd(content: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < content.length; index += 1) {
    const char = content[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = inString;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function removeRanges(
  content: string,
  ranges: Array<{ start: number; end: number }>,
): string {
  if (ranges.length === 0) return content;
  let cursor = 0;
  let next = "";
  for (const range of ranges.sort((a, b) => a.start - b.start)) {
    next += content.slice(cursor, range.start);
    cursor = range.end;
  }
  next += content.slice(cursor);
  return next;
}

function parseExecutiveCanvasPayload(
  rawPayload: string,
): ExecutiveCanvasPayload | null {
  try {
    const value = parseExecutiveCanvasJson(rawPayload);
    if (!isRecord(value)) return null;
    const canvasType = stringValue(value.canvasType);
    if (!isExecutiveCanvasType(canvasType)) return null;

    const payload: ExecutiveCanvasPayload = { canvasType };
    const title = stringValue(value.title);
    if (title) payload.title = title;

    const columns = normalizeColumns(value.columns);
    if (columns.length > 0) payload.columns = columns;

    const items = normalizeItems(value.items);
    if (items.length > 0) payload.items = items;

    const gates = normalizeGates(value.gates);
    if (gates.length > 0) payload.gates = gates;

    const proofBoundary = normalizeProofBoundary(value.proofBoundary);
    if (proofBoundary) payload.proofBoundary = proofBoundary;

    return payload;
  } catch {
    return null;
  }
}

function parseExecutiveCanvasJson(rawPayload: string): unknown {
  try {
    return JSON.parse(rawPayload);
  } catch (error) {
    const repairedPayload =
      escapeControlCharactersInsideJsonStrings(rawPayload);
    if (repairedPayload === rawPayload) throw error;
    return JSON.parse(repairedPayload);
  }
}

function escapeControlCharactersInsideJsonStrings(rawPayload: string): string {
  let repaired = "";
  let inString = false;
  let escaped = false;
  for (let index = 0; index < rawPayload.length; index += 1) {
    const char = rawPayload[index] ?? "";
    if (escaped) {
      repaired += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      repaired += char;
      escaped = inString;
      continue;
    }
    if (char === '"') {
      repaired += char;
      inString = !inString;
      continue;
    }
    if (inString) {
      if (char === "\n") {
        repaired += "\\n";
        continue;
      }
      if (char === "\r") {
        repaired += "\\r";
        continue;
      }
      if (char === "\t") {
        repaired += "\\t";
        continue;
      }
    }
    repaired += char;
  }
  return repaired;
}

function looksLikeExecutiveCanvasPayload(rawPayload: string): boolean {
  return (
    rawPayload.includes('"canvasType"') &&
    (rawPayload.includes('"investmentSequencingMap"') ||
      rawPayload.includes('"valueReadinessMatrix"') ||
      rawPayload.includes('"gateToValueRoadmap"') ||
      rawPayload.includes('"proofBoundary"'))
  );
}

function normalizeColumns(value: unknown): ExecutiveCanvasColumn[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((column) => {
      if (!isRecord(column)) return null;
      const label = stringValue(column.label);
      const rawItems = Array.isArray(column.items) ? column.items : [];
      const items = rawItems
        .map((item) => (typeof item === "string" ? item : normalizeItem(item)))
        .filter((item): item is string | ExecutiveCanvasItem => Boolean(item));
      if (!label || items.length === 0) return null;
      return { label, items };
    })
    .filter((column): column is ExecutiveCanvasColumn => Boolean(column));
}

function normalizeItems(value: unknown): ExecutiveCanvasItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeItem(item))
    .filter((item): item is ExecutiveCanvasItem => Boolean(item));
}

function normalizeItem(value: unknown): ExecutiveCanvasItem | null {
  if (!isRecord(value)) return null;
  const label = stringValue(value.label);
  if (!label) return null;
  return {
    label,
    ...optionalNumber("value", value.value),
    ...optionalNumber("readiness", value.readiness),
    ...optionalNumber("risk", value.risk),
    ...optionalString("action", value.action),
    ...optionalString("owner", value.owner),
    ...optionalString("gate", value.gate),
    ...optionalString("note", value.note),
  };
}

function normalizeGates(value: unknown): ExecutiveCanvasGate[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((gate) => {
      if (!isRecord(gate)) return null;
      const label = stringValue(gate.label);
      if (!label) return null;
      return {
        label,
        ...optionalString("owner", gate.owner),
        ...optionalString("dependency", gate.dependency),
        ...optionalString("valueUnlocked", gate.valueUnlocked),
        ...optionalString("status", gate.status),
      };
    })
    .filter((gate): gate is ExecutiveCanvasGate => Boolean(gate));
}

function normalizeProofBoundary(
  value: unknown,
): ExecutiveCanvasProofBoundary | null {
  if (!isRecord(value)) return null;
  const proofBoundary: ExecutiveCanvasProofBoundary = {
    known: stringArray(value.known),
    assumed: stringArray(value.assumed),
    missing: stringArray(value.missing),
    ...optionalString("decisionRequired", value.decisionRequired),
  };
  if (
    proofBoundary.known?.length ||
    proofBoundary.assumed?.length ||
    proofBoundary.missing?.length ||
    proofBoundary.decisionRequired
  ) {
    return proofBoundary;
  }
  return null;
}

function isExecutiveCanvasType(value: string): value is ExecutiveCanvasType {
  return (
    value === "investmentSequencingMap" ||
    value === "valueReadinessMatrix" ||
    value === "gateToValueRoadmap" ||
    value === "proofBoundary"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => stringValue(item))
    .filter((item) => item.length > 0);
}

function optionalString(key: string, value: unknown): Record<string, string> {
  const text = stringValue(value);
  return text ? { [key]: text } : {};
}

function optionalNumber(key: string, value: unknown): Record<string, number> {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? { [key]: number } : {};
}
