import { z } from "zod";
import type { AvaAnswerPacket, AvaArtifact } from "@/lib/ava-answer/contract";
import type { AskSource } from "@/lib/intelligence/ask/types";

const citationIds = z.array(z.string()).optional();
const common = {
  id: z.string().min(1),
  title: z.string().optional(),
  citationIds,
};
const cell = z.union([z.string(), z.number().finite(), z.null()]);
const tableSchema = z
  .object({
    ...common,
    columns: z
      .array(z.object({ key: z.string().min(1), label: z.string() }).strict())
      .min(2)
      .max(5),
    rows: z.array(z.record(z.string(), cell)).min(1).max(8),
    note: z.string().optional(),
  })
  .strict()
  .refine(
    (t) => t.rows.every((r) => t.columns.every((c) => c.key in r)),
    "Missing table cell",
  );
const numericChartSchema = z
  .object({
    ...common,
    kind: z.enum(["bar", "horizontal-bar", "line"]),
    xKey: z.string().min(1),
    yKey: z.string().min(1),
    unit: z.string().optional(),
    subtitle: z.string().optional(),
    sourceNote: z.string().optional(),
    data: z.array(z.record(z.string(), cell)).min(2).max(8),
  })
  .strict()
  .refine(
    (c) =>
      c.data.every(
        (r) => typeof r[c.xKey] === "string" && typeof r[c.yKey] === "number",
      ),
    "Invalid chart axis values",
  );
const matrixChartSchema = z
  .object({
    ...common,
    kind: z.literal("quadrant-matrix"),
    xKey: z.string().min(1),
    yKey: z.string().min(1),
    subtitle: z.string().min(1),
    sourceNote: z.string().optional(),
    data: z.array(z.record(z.string(), cell)).min(2).max(8),
  })
  .strict()
  .refine(
    (c) =>
      c.data.every(
        (r) =>
          typeof r.label === "string" &&
          ["low", "high"].includes(String(r[c.xKey])) &&
          ["low", "high"].includes(String(r[c.yKey])),
      ),
    "Matrix needs authored labels and qualitative low/high categories",
  );
const chartSchema = z.union([numericChartSchema, matrixChartSchema]);
const graphSchema = z
  .object({
    ...common,
    nodes: z
      .array(z.object({ id: z.string().min(1), label: z.string() }).strict())
      .min(2)
      .max(8),
    edges: z
      .array(
        z
          .object({
            from: z.string(),
            to: z.string(),
            label: z.string().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict()
  .refine((g) => {
    const ids = new Set(g.nodes.map((n) => n.id));
    return (
      ids.size === g.nodes.length &&
      g.edges.every((e) => ids.has(e.from) && ids.has(e.to))
    );
  }, "Invalid graph endpoints");
const followupSchema = z.array(z.string().min(1)).length(3);
const sourceIdsSchema = z.array(z.string().regex(/^S[1-9]\d*$/));
const exhibitSchemas = {
  table: tableSchema,
  chart: chartSchema,
  "quadrant-matrix": matrixChartSchema,
  graph: graphSchema,
};

// Locate a complete object without treating escaped quotes or braces in labels
// as boundaries. JSON.parse and the strict schemas still own validation.
function jsonValueEnd(text: string, start: number): number | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === "{" || char === "[") depth++;
    else if ((char === "}" || char === "]") && --depth === 0) return i + 1;
  }
  return null;
}

/** Decode transport blocks. Unsupported content stays verbatim in prose. */
export function decodeModelAuthoredAnswer(
  rawText: string,
  transport: "current" | "named-fences-only" = "current",
) {
  const artifacts: AvaArtifact[] = [];
  const followups: string[] = [];
  const sourceIds: string[] = [];
  const protocolIssues: string[] = [];
  let seenSources = false;
  function decodePayload(block: string, kind: string, payload: string): string {
    if (
      kind &&
      kind !== "json" &&
      kind !== "sources" &&
      kind !== "followups" &&
      !Object.hasOwn(exhibitSchemas, kind)
    )
      return block;
    try {
      const value: unknown = JSON.parse(payload);
      // Generic fences and bare objects are accepted only when they match an
      // existing complete schema. No values, fields or chart scores are repaired.
      if (!kind || kind === "json") {
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          sourceIdsSchema.safeParse(value).success
        )
          kind = "sources";
        else if (
          followupSchema.safeParse(value).success &&
          (value as string[]).every((q) => q.trim().endsWith("?"))
        )
          kind = "followups";
        else {
          if (transport === "named-fences-only") return block;
          const matched = Object.entries(exhibitSchemas).find(
            ([, schema]) => schema.safeParse(value).success,
          );
          if (!matched) return block;
          kind = matched[0];
        }
      }
      if (kind === "sources") {
        if (seenSources) throw new Error("Duplicate sources block");
        sourceIds.push(
          ...(transport === "named-fences-only"
            ? sourceIdsSchema.min(1)
            : sourceIdsSchema
          ).parse(value),
        );
        seenSources = true;
      } else if (kind === "followups") {
        if (followups.length) throw new Error("Duplicate follow-up block");
        followups.push(...followupSchema.parse(value));
      } else {
        const schema = exhibitSchemas[kind as keyof typeof exhibitSchemas];
        if (!schema) return block;
        const decoded = schema.parse(value);
        if (artifacts.some((a) => a.id === decoded.id))
          throw new Error("Duplicate exhibit ID");
        artifacts.push({
          ...decoded,
          artifact: kind === "quadrant-matrix" ? "chart" : kind,
        } as AvaArtifact);
      }
      return "";
    } catch {
      if (!kind || kind === "json") return block;
      protocolIssues.push(
        `Unrendered ${kind} block; original content retained.`,
      );
      return block;
    }
  }

  function decodeBareObjects(text: string): string {
    if (transport === "named-fences-only") return text;
    const starts = /^ {0,3}(?:```|[\[{])/gm;
    let result = "";
    let cursor = 0;
    for (let match = starts.exec(text); match; match = starts.exec(text)) {
      if (match[0].endsWith("```")) break;
      const start = match.index + match[0].length - 1;
      const end = jsonValueEnd(text, start);
      if (end === null) break;
      starts.lastIndex = end;
      if (text[start] !== "{") continue;
      const lineEnd = text.indexOf("\n", end);
      if (text.slice(end, lineEnd < 0 ? text.length : lineEnd).trim()) continue;
      const block = text.slice(match.index, end);
      result +=
        text.slice(cursor, match.index) +
        decodePayload(block, "json", text.slice(start, end));
      cursor = end;
    }
    return result + text.slice(cursor);
  }

  // Decode bare objects only outside complete code fences so ordinary code
  // examples cannot accidentally become exhibits.
  const fences =
    transport === "named-fences-only"
      ? /^```(table|chart|quadrant-matrix|graph|sources|followups|json)?[ \t]*\r?\n([\s\S]*?)^```[ \t]*(?=\r?$)/gm
      : /^ {0,3}```([\w-]*)[ \t]*\r?\n([\s\S]*?)^ {0,3}```[ \t]*(?=\r?$)/gm;
  let prose = "";
  let cursor = 0;
  for (let match = fences.exec(rawText); match; match = fences.exec(rawText)) {
    prose += decodeBareObjects(rawText.slice(cursor, match.index));
    prose += decodePayload(match[0], match[1] ?? "", match[2]);
    cursor = match.index + match[0].length;
  }
  prose += decodeBareObjects(rawText.slice(cursor));
  return { prose, artifacts, followups, sourceIds, protocolIssues };
}

/** Preview completed prose while transport blocks are still arriving. */
export function modelAuthoredStreamingProse(rawText: string): string {
  const { prose } = decodeModelAuthoredAnswer(rawText);
  // Complete valid blocks are decoded above. Hold an incomplete or malformed
  // fence or bare object, including a split opener, until the final packet can account for it.
  const pendingFence = prose.search(/^ {0,3}(?:`|\{)/m);
  return pendingFence < 0 ? prose : prose.slice(0, pendingFence);
}

export function modelAuthoredAnswerPacket(
  rawText: string,
  question: string,
  tenantKey: string,
  sources: AskSource[],
): AvaAnswerPacket {
  const decoded = decodeModelAuthoredAnswer(rawText);
  const referenced = new Set([
    ...decoded.sourceIds,
    ...decoded.artifacts.flatMap((a) => a.citationIds ?? []),
  ]);
  for (const [i] of sources.entries()) {
    if (decoded.prose.includes(`[S${i + 1}]`)) referenced.add(`S${i + 1}`);
  }
  return {
    surface: "intelligence",
    mode: "DECIDE",
    tenantKey,
    question,
    intent: "executive_brief",
    status: "answered",
    directAnswer: decoded.prose,
    prose: decoded.prose,
    modelAuthored: { rawText, protocolIssues: decoded.protocolIssues },
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: decoded.artifacts,
    citations: sources
      .map((s, i) => ({ ...s, citationId: `S${i + 1}` }))
      .filter((s) => referenced.has(s.citationId))
      .map((s) => ({
        id: s.citationId,
        recordId: s.id ?? undefined,
        label: s.name,
        excerpt: s.detail,
        url: s.url,
        sourceClass:
          s.type === "GRAPH"
            ? "graph"
            : s.type === "TENANT"
              ? "tenant-fact"
              : s.type === "WORLDVIEW"
                ? "worldview"
                : "corpus-pattern",
      })),
    gaps: [],
    caveats: [],
    nextSteps: decoded.followups.map((label, i) => ({
      id: `followup-${i + 1}`,
      label,
    })),
    // These are conservative envelope defaults, not an assessment of Claude's claims.
    quality: {
      confidence: "low",
      evidenceStrength: "thin",
      tenantGrounding: "partial",
      answerCompleteness: "partial",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: false,
      forbiddenLanguagePassed: false,
      unsupportedClaimsBlocked: false,
    },
  };
}

/** Observational checks; never used to rewrite, hide, or grade an answer. */
export function measureExecutiveAnswer(prose: string) {
  const paragraphs = prose
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);
  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const opening =
    paragraphs
      .map((paragraph) =>
        paragraph.replace(/^ {0,3}#{1,6}[\t ]+[^\n]*(?:\n|$)/gm, "").trim(),
      )
      .find(Boolean) ?? "";
  const openingWords = words(opening);
  return {
    openingWords,
    proseWords: words(prose),
    paragraphs: paragraphs.length,
    openingWithinTarget: openingWords > 0 && openingWords <= 35,
  };
}

const exportPacketSchema = z
  .object({
    surface: z.literal("intelligence"),
    tenantKey: z.string(),
    question: z.string(),
    directAnswer: z.string(),
    prose: z.string().optional(),
    modelAuthored: z.object({
      rawText: z.string().max(100_000),
      protocolIssues: z.array(z.string()),
    }),
    artifacts: z.array(z.unknown()),
    citations: z.array(
      z
        .object({
          id: z.string(),
          label: z.string(),
          url: z.string().optional(),
        })
        .loose(),
    ),
    nextSteps: z.array(z.object({ id: z.string(), label: z.string() }).loose()),
  })
  .loose();

/** Structural transport check only. A poor answer must remain reviewable. */
export function isIntactModelAuthoredPacket(
  value: unknown,
): value is AvaAnswerPacket {
  const result = exportPacketSchema.safeParse(value);
  if (!result.success) return false;
  const packet = result.data;
  // Already-open conversations may contain a packet decoded before generic
  // exhibits were recognized. Validate that exact historical projection too;
  // do not rewrite its prose, artifacts or original model output on export.
  return (["current", "named-fences-only"] as const).some((transport) => {
    const decoded = decodeModelAuthoredAnswer(
      packet.modelAuthored.rawText,
      transport,
    );
    return (
      packet.directAnswer === decoded.prose &&
      (packet.prose === undefined || packet.prose === decoded.prose) &&
      JSON.stringify(packet.artifacts) === JSON.stringify(decoded.artifacts) &&
      JSON.stringify(packet.modelAuthored.protocolIssues) ===
        JSON.stringify(decoded.protocolIssues) &&
      JSON.stringify(packet.nextSteps.map((s) => s.label)) ===
        JSON.stringify(decoded.followups)
    );
  });
}
