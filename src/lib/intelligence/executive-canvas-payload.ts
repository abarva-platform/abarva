import {
  APPROVED_CXO_CANVAS_TYPES,
  LEGACY_CXO_CANVAS_TYPE_ALIASES,
  type LegacyCxoCanvasType,
  type CxoCanvasGate,
  type CxoCanvasItem,
  type CxoCanvasLane,
  type CxoCanvasPayload,
  type CxoCanvasProofBoundary,
  type CxoCanvasType,
} from "@/lib/cxo-canvas/canvasTypes";
import { parseCxoCanvasJson } from "@/lib/cxo-canvas/canvasSchemas";
import { validateCxoCanvasPayload } from "@/lib/cxo-canvas/validateCxoCanvasPayload";

export type ExecutiveCanvasType = CxoCanvasType;
export type ExecutiveCanvasItem = CxoCanvasItem;
export type ExecutiveCanvasColumn = CxoCanvasLane;
export type ExecutiveCanvasGate = CxoCanvasGate;
export type ExecutiveCanvasProofBoundary = CxoCanvasProofBoundary;
export type ExecutiveCanvasPayload = Omit<CxoCanvasPayload, "canvasType"> & {
  canvasType: CxoCanvasType | LegacyCxoCanvasType;
  columns?: CxoCanvasLane[];
};

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

const KNOWN_CANVAS_TYPE_MARKERS = [
  ...APPROVED_CXO_CANVAS_TYPES,
  ...Object.keys(LEGACY_CXO_CANVAS_TYPE_ALIASES),
];

export function hasExecutiveCanvasPayload(content: string): boolean {
  EXECUTIVE_CANVAS_BLOCK_RE.lastIndex = 0;
  for (const match of content.matchAll(EXECUTIVE_CANVAS_BLOCK_RE)) {
    const payload = parseExecutiveCanvasPayload(match[1] ?? "");
    if (payload) return true;
  }
  return findBareExecutiveCanvasPayloads(content).length > 0;
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
    .replace(/(?:^|\n)\s*`{0,3}\s*abarva-canvas\s*`{0,3}\s*(?=\n|$)/gi, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    payloads,
    visibleContent: stripInternalMarkersFromVisibleContent(visibleContent),
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

function parseExecutiveCanvasPayload(
  rawPayload: string,
): ExecutiveCanvasPayload | null {
  try {
    const result = validateCxoCanvasPayload(parseCxoCanvasJson(rawPayload));
    return result.ok ? result.payload : null;
  } catch {
    return null;
  }
}

function looksLikeExecutiveCanvasPayload(rawPayload: string): boolean {
  return (
    rawPayload.includes('"canvasType"') &&
    KNOWN_CANVAS_TYPE_MARKERS.some((marker) =>
      rawPayload.includes(`"${marker}"`),
    )
  );
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

function stripInternalMarkersFromVisibleContent(content: string): string {
  return content
    .replace(/<<<TAB:[^\n>]*(?:>>>|$)/gi, "")
    .replace(/>>>/g, "")
    .replace(/\bgrounding\s*:\s*[\w-]+/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
