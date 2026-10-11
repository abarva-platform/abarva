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
const chartSchema = z
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

/** Decode explicit transport blocks only. Invalid blocks stay verbatim in prose. */
export function decodeModelAuthoredAnswer(rawText: string) {
  const artifacts: AvaArtifact[] = [];
  const followups: string[] = [];
  const protocolIssues: string[] = [];
  const prose = rawText.replace(
    /^```(table|chart|graph|followups)[ \t]*\r?\n([\s\S]*?)^```[ \t]*(?=\r?$)/gm,
    (block, kind: string, payload: string) => {
      try {
        const value: unknown = JSON.parse(payload);
        if (kind === "followups") {
          if (followups.length) throw new Error("Duplicate follow-up block");
          followups.push(...followupSchema.parse(value));
        } else {
          const schema =
            kind === "table"
              ? tableSchema
              : kind === "chart"
                ? chartSchema
                : graphSchema;
          const decoded = schema.parse(value);
          if (artifacts.some((a) => a.id === decoded.id))
            throw new Error("Duplicate exhibit ID");
          artifacts.push({ ...decoded, artifact: kind } as AvaArtifact);
        }
        return "";
      } catch {
        protocolIssues.push(
          `Unrendered ${kind} block; original content retained.`,
        );
        return block;
      }
    },
  );
  return { prose, artifacts, followups, protocolIssues };
}

export function modelAuthoredAnswerPacket(
  rawText: string,
  question: string,
  tenantKey: string,
  sources: AskSource[],
): AvaAnswerPacket {
  const decoded = decodeModelAuthoredAnswer(rawText);
  const referenced = new Set(
    decoded.artifacts.flatMap((a) => a.citationIds ?? []),
  );
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
  const openingWords = words(paragraphs[0] ?? "");
  return {
    openingWords,
    proseWords: words(prose),
    paragraphs: paragraphs.length,
    openingWithinTarget: openingWords <= 40,
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
  const decoded = decodeModelAuthoredAnswer(packet.modelAuthored.rawText);
  return (
    packet.directAnswer === decoded.prose &&
    (packet.prose === undefined || packet.prose === decoded.prose) &&
    JSON.stringify(packet.artifacts) === JSON.stringify(decoded.artifacts) &&
    JSON.stringify(packet.modelAuthored.protocolIssues) ===
      JSON.stringify(decoded.protocolIssues) &&
    JSON.stringify(packet.nextSteps.map((s) => s.label)) ===
      JSON.stringify(decoded.followups)
  );
}
