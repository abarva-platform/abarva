import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { corpus } from "@/lib/intelligence/loader";
import { SOURCE_LIFECYCLE_PATTERNS } from "@/lib/intelligence/source-lifecycle-patterns";
import type {
  LifecyclePatternSeed,
  PatternSeed,
} from "@/lib/intelligence/seed-types";
import { extractPatterns } from "../../../scripts/corpus/load-authored-genome-seeds";

type SourceSystem =
  | "pattern_seed"
  | "source_lifecycle_pattern"
  | "genome_seed_jsonl"
  | "legacy_design_pack_compat";

interface PatternManifestSection {
  id: string;
  title: string;
  body: string;
}

interface PatternManifestEntry {
  id: string;
  slug: string;
  name: string;
  version: string | null;
  status: string;
  category: string | null;
  crossIndustry: boolean;
  sectorApplicability: string[];
  primarySector: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  confidenceFloor: number | null;
  nObservationsFloor: number | null;
  relatedPatternIds: string[];
  regulatoryFrameworkIds: string[];
  sourceFile: string;
  sourceSection: string | null;
  lastUpdatedAt: string;
  contentHash: string;
  evidenceCount: number;
  observationCount: number;
  observations: string[];
  demoCritical: boolean;
  sections: PatternManifestSection[];
  triggerSymptoms: string[];
  detectionSignals: string[];
  diagnosticQuestions: string[];
  evidenceRequirements: string[];
  interventions: string[];
  sourceSystem: SourceSystem;
}

type GenomeSeedPattern = {
  id?: string;
  code?: string;
  name?: string;
  title?: string;
  version?: string;
  vertical?: string;
  summary?: string;
  description?: string;
  doctrine?: string;
  domain?: string;
  category?: string;
  subcategory?: string;
  personas?: string[];
  triggers?: string[];
  applies_when?: string;
  appliesWhen?: string;
  does_not_apply_when?: string;
  doesNotApplyWhen?: string;
  supporting_evidence?: Array<Record<string, unknown>>;
  supportingEvidence?: Array<Record<string, unknown>>;
  anti_patterns?: string[];
  antiPatterns?: string[];
  failure_modes?: string[];
  failureModes?: string[];
  decision_artifacts?: string[];
  decisionArtifacts?: string[];
  regulatoryChips?: string[];
  related_patterns?: string[];
  relatedPatternIds?: string[];
  embedding_text?: string;
  confidence?: string | number;
  quality_tier?: string;
  specificity?: string;
};

const OUTPUT_PATH = join(
  process.cwd(),
  "src/lib/intelligence/generated/pattern-manifest.json",
);
const GENOME_SEED_DIR = join(process.cwd(), "scripts/corpus/generated");

const DEMO_CRITICAL_SLUGS = new Set([
  "owned-brand-margin-recovery",
  "demand-forecasting-inventory-ai",
  "analytics-modernization",
  "ai-use-case-portfolio-management",
  "healthcare-revenue-cycle-epic-ams",
]);

function main() {
  const beforeCount = readCurrentManifestCount();
  const tsPatterns = corpus.patterns.map((pattern) =>
    fromPatternSeed(pattern, "pattern_seed"),
  );
  const lifecyclePatterns = SOURCE_LIFECYCLE_PATTERNS.map((pattern) =>
    fromPatternSeed(pattern, "source_lifecycle_pattern"),
  );
  const genomePatterns = readGenomeSeedPatterns();
  const compatibilityPatterns = [legacyAnalyticsModernizationPattern()];

  const authored = [
    ...tsPatterns,
    ...lifecyclePatterns,
    ...genomePatterns,
    ...compatibilityPatterns,
  ];
  const unique = normalizeRelatedPatternIds(dedupeById(authored)).sort(
    (left, right) => {
      return (
        Number(right.demoCritical) - Number(left.demoCritical) ||
        left.sourceSystem.localeCompare(right.sourceSystem) ||
        left.name.localeCompare(right.name) ||
        left.id.localeCompare(right.id)
      );
    },
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceDir: "repo-authored-corpus",
    patternCount: unique.length,
    authoredCounts: {
      patternSeed: tsPatterns.length,
      sourceLifecyclePattern: lifecyclePatterns.length,
      genomeSeedJsonl: genomePatterns.length,
      legacyDesignPackCompatibility: compatibilityPatterns.length,
      authoredTotalBeforeDedupe: authored.length,
      duplicateIdsRemoved: authored.length - unique.length,
    },
    demoCriticalSlugs: Array.from(DEMO_CRITICAL_SLUGS),
    patterns: unique,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    [
      `pattern-manifest before=${beforeCount}`,
      `after=${unique.length}`,
      `patternSeed=${tsPatterns.length}`,
      `sourceLifecycle=${lifecyclePatterns.length}`,
      `genomeSeedJsonl=${genomePatterns.length}`,
      `legacyCompat=${compatibilityPatterns.length}`,
      `deduped=${authored.length - unique.length}`,
      `output=${OUTPUT_PATH}`,
    ].join(" "),
  );
}

function readCurrentManifestCount(): number {
  try {
    const manifest = require(OUTPUT_PATH) as {
      patternCount?: unknown;
      patterns?: unknown[];
    };
    if (typeof manifest.patternCount === "number") return manifest.patternCount;
    if (Array.isArray(manifest.patterns)) return manifest.patterns.length;
  } catch {
    // First generation in a fresh checkout.
  }
  return 0;
}

function fromPatternSeed(
  pattern: PatternSeed | LifecyclePatternSeed,
  sourceSystem: SourceSystem,
): PatternManifestEntry {
  const relatedPatternIds = [
    ...pattern.relatedPatternIds,
    ...pattern.derivedFromPatternIds,
    ...("coAppliesWithPatternIds" in pattern
      ? pattern.coAppliesWithPatternIds
      : []),
  ];
  const body = pattern.body.trim();
  const sourceFile =
    pattern.sourceDocuments[0] ?? `src/lib/intelligence/${sourceSystem}`;
  const sectors = sectorsFromVertical(pattern.vertical);
  const canonical = pattern.canonical;

  return {
    id: pattern.id,
    slug: pattern.slug,
    name: pattern.title,
    version: pattern.version ?? null,
    status: pattern.status,
    category: pattern.domain,
    crossIndustry: sectors.includes("cross_sector"),
    sectorApplicability: sectors,
    primarySector: sectors.includes("cross_sector")
      ? null
      : (sectors[0] ?? null),
    shortDescription: pattern.thesis,
    longDescription: [pattern.applicability, body].filter(Boolean).join("\n\n"),
    confidenceFloor: pattern.confidence,
    nObservationsFloor: pattern.instanceCount,
    relatedPatternIds,
    regulatoryFrameworkIds: pattern.regulatoryChips,
    sourceFile,
    sourceSection: null,
    lastUpdatedAt: dateToIso(pattern.createdAt),
    contentHash: hashContent(pattern),
    evidenceCount: Math.max(
      pattern.sourceDocuments.length + pattern.regulatoryChips.length,
      pattern.instanceCount,
    ),
    observationCount: pattern.instanceCount,
    observations: pattern.sourceDocuments,
    demoCritical: DEMO_CRITICAL_SLUGS.has(pattern.slug),
    sections: sectionsFromMarkdown(body, pattern.thesis),
    triggerSymptoms: [
      canonical?.business_problem,
      canonical?.why_now,
      ...("failureModes" in pattern
        ? pattern.failureModes.map((failureMode) => failureMode.description)
        : []),
    ].filter(isNonEmptyString),
    detectionSignals: canonical?.baseline_needed ?? [],
    diagnosticQuestions: canonical?.recommended_workshops ?? [],
    evidenceRequirements: canonical?.gate_evidence_required ?? [],
    interventions: [
      ...(canonical?.intervention_options ?? []),
      ...("expectedArtifacts" in pattern
        ? pattern.expectedArtifacts.map((artifact) => artifact.label)
        : []),
    ],
    sourceSystem,
  };
}

function readGenomeSeedPatterns(): PatternManifestEntry[] {
  const files = listJsonlFiles(GENOME_SEED_DIR);
  return files.flatMap((filePath) => {
    const sourceFile = relative(process.cwd(), filePath);
    const lastUpdatedAt = statSync(filePath).mtime.toISOString();
    return extractPatterns(filePath).map((pattern) =>
      fromGenomeSeedPattern(
        pattern as GenomeSeedPattern,
        sourceFile,
        lastUpdatedAt,
      ),
    );
  });
}

function fromGenomeSeedPattern(
  pattern: GenomeSeedPattern,
  sourceFile: string,
  lastUpdatedAt: string,
): PatternManifestEntry {
  const id = stringValue(pattern.id ?? pattern.code);
  const name = stringValue(pattern.title ?? pattern.name);
  if (!id || !name) {
    throw new Error(
      `${sourceFile}: expected every genome seed pattern to carry id/code and title/name`,
    );
  }

  const slug = slugify(id);
  const vertical = stringValue(pattern.vertical) ?? "cross_industry";
  const sectors = sectorsFromVertical(vertical);
  const supportingEvidence = arrayOfRecords(
    pattern.supporting_evidence ?? pattern.supportingEvidence,
  );
  const triggers = stringArray(pattern.triggers);
  const antiPatterns = stringArray(
    pattern.anti_patterns ?? pattern.antiPatterns,
  );
  const failureModes = stringArray(
    pattern.failure_modes ?? pattern.failureModes,
  );
  const decisionArtifacts = stringArray(
    pattern.decision_artifacts ?? pattern.decisionArtifacts,
  );
  const summary = stringValue(
    pattern.summary ?? pattern.description ?? pattern.embedding_text,
  );
  const doctrine = stringValue(pattern.doctrine);
  const appliesWhen = stringValue(pattern.applies_when ?? pattern.appliesWhen);
  const doesNotApplyWhen = stringValue(
    pattern.does_not_apply_when ?? pattern.doesNotApplyWhen,
  );

  return {
    id,
    slug,
    name,
    version: stringValue(pattern.version) ?? null,
    status: "AUTHORED-EXPERT",
    category: stringValue(pattern.category ?? pattern.domain),
    crossIndustry: sectors.includes("cross_sector"),
    sectorApplicability: sectors,
    primarySector: sectors.includes("cross_sector")
      ? null
      : (sectors[0] ?? null),
    shortDescription: summary,
    longDescription: [summary, doctrine, appliesWhen, doesNotApplyWhen]
      .filter(isNonEmptyString)
      .join("\n\n"),
    confidenceFloor: confidenceToNumber(pattern.confidence),
    nObservationsFloor: supportingEvidence.length,
    relatedPatternIds: stringArray(
      pattern.related_patterns ?? pattern.relatedPatternIds,
    ),
    regulatoryFrameworkIds: stringArray(pattern.regulatoryChips),
    sourceFile,
    sourceSection: stringValue(pattern.subcategory ?? pattern.domain),
    lastUpdatedAt,
    contentHash: hashContent(pattern),
    evidenceCount: supportingEvidence.length,
    observationCount: supportingEvidence.length,
    observations: supportingEvidence
      .map((evidence) =>
        [evidence.label, evidence.detail].filter(isNonEmptyString).join(" — "),
      )
      .filter(isNonEmptyString),
    demoCritical: DEMO_CRITICAL_SLUGS.has(slug),
    sections: sectionsFromParts([
      ["Summary", summary],
      ["Doctrine", doctrine],
      ["Applies when", appliesWhen],
      ["Does not apply when", doesNotApplyWhen],
    ]),
    triggerSymptoms: triggers,
    detectionSignals: [...antiPatterns, ...failureModes],
    diagnosticQuestions: [],
    evidenceRequirements: supportingEvidence
      .map((evidence) => stringValue(evidence.label))
      .filter(isNonEmptyString),
    interventions: decisionArtifacts,
    sourceSystem: "genome_seed_jsonl",
  };
}

function legacyAnalyticsModernizationPattern(): PatternManifestEntry {
  const body = [
    "Analytics modernization is the cross-industry pattern for making data platforms, governance, lineage, and operating cadence ready enough for AI and executive decision workflows.",
    "This compatibility entry preserves live program seeds that still cite the legacy design-pack slug while W2.1 moves the manifest to repo-authored seed and genome sources.",
  ].join("\n\n");

  return {
    id: "pattern_analytics_modernization",
    slug: "analytics-modernization",
    name: "Analytics Modernization",
    version: "1.0.0",
    status: "active",
    category: "data_platform",
    crossIndustry: true,
    sectorApplicability: ["cross_sector"],
    primarySector: null,
    shortDescription:
      "Modernize analytics foundations so AI, data products, and executive decision workflows have usable, governed, timely data.",
    longDescription: body,
    confidenceFloor: 0.7,
    nObservationsFloor: 0,
    relatedPatternIds: ["PAT-AI-001", "PAT-AI-002", "PAT-AI-004"],
    regulatoryFrameworkIds: [],
    sourceFile: "legacy-design-pack:analytics-modernization",
    sourceSection: null,
    lastUpdatedAt: "2026-06-20T00:00:00.000Z",
    contentHash: hashContent(body),
    evidenceCount: 0,
    observationCount: 0,
    observations: [],
    demoCritical: true,
    sections: sectionsFromParts([["Summary", body]]),
    triggerSymptoms: [
      "AI use cases depend on data assets whose ownership, quality, lineage, or access cadence is not yet trustworthy.",
    ],
    detectionSignals: [
      "No authoritative data-asset inventory",
      "Missing lineage or quality owner for high-value AI use cases",
      "Modernization roadmap not sequenced against portfolio demand",
    ],
    diagnosticQuestions: [
      "Which AI use cases depend on data foundations that are not ready?",
      "Who owns the data quality, lineage, and access path for those assets?",
      "Does the modernization roadmap reach the use-case window in time?",
    ],
    evidenceRequirements: [
      "Data-asset inventory",
      "Lineage and quality ownership evidence",
      "Modernization roadmap tied to portfolio demand",
    ],
    interventions: [
      "Sequence modernization from AI portfolio demand",
      "Attach data ownership and quality gates to each use-case dependency",
      "Block stage advancement when critical data foundations are not ready",
    ],
    sourceSystem: "legacy_design_pack_compat",
  };
}

function dedupeById(patterns: PatternManifestEntry[]): PatternManifestEntry[] {
  const byId = new Map<string, PatternManifestEntry>();
  for (const pattern of patterns) {
    if (!byId.has(pattern.id)) {
      byId.set(pattern.id, pattern);
      continue;
    }
    const existing = byId.get(pattern.id);
    if (
      existing?.sourceSystem === "pattern_seed" &&
      pattern.sourceSystem === "source_lifecycle_pattern"
    ) {
      byId.set(pattern.id, pattern);
    }
  }
  return Array.from(byId.values());
}

function normalizeRelatedPatternIds(
  patterns: PatternManifestEntry[],
): PatternManifestEntry[] {
  const knownIds = new Set(patterns.map((pattern) => pattern.id));
  const normalized = patterns.map((pattern) => ({
    ...pattern,
    relatedPatternIds: Array.from(new Set(pattern.relatedPatternIds)).filter(
      (id) => knownIds.has(id),
    ),
  }));
  const byId = new Map(normalized.map((pattern) => [pattern.id, pattern]));

  for (const pattern of normalized) {
    for (const targetId of pattern.relatedPatternIds) {
      const target = byId.get(targetId);
      if (!target || target.relatedPatternIds.includes(pattern.id)) continue;
      target.relatedPatternIds.push(pattern.id);
    }
  }

  return normalized.map((pattern) => ({
    ...pattern,
    relatedPatternIds: pattern.relatedPatternIds.slice().sort(),
  }));
}

function listJsonlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const filePath = join(dir, entry.name);
      if (entry.isDirectory()) return listJsonlFiles(filePath);
      return entry.isFile() && entry.name.endsWith(".jsonl") ? [filePath] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function sectorsFromVertical(vertical: string): string[] {
  const normalized = vertical.trim().toLowerCase().replace(/-/g, "_");
  if (normalized.includes("cross")) return ["cross_sector"];
  if (normalized.includes("healthcare") || normalized === "health")
    return ["healthcare"];
  if (normalized.includes("retail")) return ["retail"];
  if (
    normalized.includes("financial") ||
    normalized.includes("banking") ||
    normalized === "finserv"
  ) {
    return ["financial_services"];
  }
  if (normalized.includes("airline") || normalized.includes("aviation"))
    return ["airline"];
  if (normalized.includes("medtech")) return ["healthcare"];
  return [normalized || "cross_sector"];
}

function sectionsFromMarkdown(
  markdown: string,
  fallback: string,
): PatternManifestSection[] {
  const sections: PatternManifestSection[] = [];
  const matches = Array.from(markdown.matchAll(/^##+\s+(.+)$/gm));
  if (matches.length === 0) {
    return sectionsFromParts([["Summary", markdown || fallback]]);
  }

  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    const title = cleanInline(match[1] ?? `Section ${index + 1}`);
    const body = markdown.slice(start, end).trim();
    if (!body) return;
    sections.push({ id: slugify(title), title, body });
  });
  return sections;
}

function sectionsFromParts(
  parts: Array<[string, string | null]>,
): PatternManifestSection[] {
  return parts
    .filter((part): part is [string, string] => isNonEmptyString(part[1]))
    .map(([title, body]) => ({
      id: slugify(title),
      title,
      body: body.trim(),
    }));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => stringValue(item)).filter(isNonEmptyString);
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function confidenceToNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "validated") return 0.95;
  if (normalized === "high") return 0.85;
  if (normalized === "medium") return 0.65;
  if (normalized === "low") return 0.45;
  return null;
}

function dateToIso(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    ? new Date(parsed).toISOString()
    : new Date(0).toISOString();
}

function hashContent(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function cleanInline(value: string): string {
  return value.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

main();
