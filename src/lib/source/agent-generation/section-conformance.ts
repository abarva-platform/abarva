import type { SourceArtifactBodyGenerationMetadata } from "./types";
import { getSourceArtifactProfile } from "@/lib/source/documentation-standards/source-artifact-profiles";

export type SourceSectionVerificationStatus = "verified" | "incomplete";

export interface SourceSectionVerification {
  status: SourceSectionVerificationStatus;
  checkedAt: string;
  requiredSections: string[];
  missingSections: string[];
}

// Hand-tuned literal overrides. `source-artifact-profiles.ts`'s
// `requiredExhibits` is the canonical artifact-quality contract for what a
// Source artifact must contain — these two entries exist because their
// authored section titles were written independently of (and, for d05,
// materially differ in content from) that profile's exhibit keys, and
// changing them would alter behavior that generation prompts were tuned
// against. New artifact codes should NOT be added here — extend
// `requiredExhibits` on the profile instead; `getRequiredSectionsForArtifact`
// below derives a heading list from it automatically.
const SOURCE_ARTIFACT_REQUIRED_SECTIONS_OVERRIDES = {
  d01_strategy_memo: [
    "Decision requested",
    "Why now",
    "Recommended approach",
    "What we know",
    "What remains open",
    "Value hypothesis",
    "Next gate",
  ],
  d05_scope_memo: [
    "Executive summary",
    "In scope",
    "Out of scope",
    "Boundary clarifications",
    "Scope owner + approval",
  ],
} as const satisfies Record<string, readonly string[]>;

/** @deprecated Kept for external callers reading the literal override map directly; prefer `getRequiredSectionsForArtifact`. */
export const SOURCE_ARTIFACT_REQUIRED_SECTIONS =
  SOURCE_ARTIFACT_REQUIRED_SECTIONS_OVERRIDES;

export type SourceSectionVerifiedArtifactCode =
  keyof typeof SOURCE_ARTIFACT_REQUIRED_SECTIONS_OVERRIDES;

// Long generation-pipeline codes are `<shortProfileCode>_<slug>` (e.g.
// "d01_strategy_memo" -> "d01"). Mirrors quality-review.ts's
// shortSourceArtifactCode — duplicated locally (a one-line pure split) rather
// than imported, to avoid a cross-module dependency between the gate layer
// and this structural-verification layer for a trivial helper.
function shortArtifactCode(artifactCode: string): string {
  return artifactCode.split("_")[0] ?? artifactCode;
}

function humanizeExhibitKey(key: string): string {
  return key.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function getRequiredSectionsForArtifact(
  artifactCode: string,
): readonly string[] {
  const override =
    SOURCE_ARTIFACT_REQUIRED_SECTIONS_OVERRIDES[
      artifactCode as SourceSectionVerifiedArtifactCode
    ];
  if (override) return override;

  const profile = getSourceArtifactProfile(shortArtifactCode(artifactCode));
  return profile?.requiredExhibits.map(humanizeExhibitKey) ?? [];
}

export function formatRequiredSectionsForPrompt(artifactCode: string): string {
  const sections = getRequiredSectionsForArtifact(artifactCode);
  if (sections.length === 0) return "";
  return sections
    .map((section, index) =>
      index === 0 ? `## ${section}` : `## §${index} · ${section}`,
    )
    .join("\n");
}

export function normalizeRequiredSectionHeadings(
  artifactCode: string,
  body: string,
): string {
  const requiredSections = getRequiredSectionsForArtifact(artifactCode);
  if (requiredSections.length === 0) return body;

  const requiredByNormalizedName = new Map(
    requiredSections.map((section) => [normalizeHeading(section), section]),
  );

  return body
    .split(/\r?\n/)
    .map((line) => {
      if (/^#{1,6}\s+/.test(line)) return line;
      const trimmed = line.trim();
      const requiredSection = requiredByNormalizedName.get(
        normalizeHeading(trimmed),
      );
      if (!requiredSection) return line;
      return `## ${requiredSection}`;
    })
    .join("\n");
}

export function verifyArtifactSections(
  artifactCode: string,
  body: string,
  checkedAt = new Date().toISOString(),
): SourceSectionVerification | null {
  const requiredSections = [...getRequiredSectionsForArtifact(artifactCode)];
  if (requiredSections.length === 0) return null;

  const parsedSections = parseMarkdownLevelTwoSections(body);
  const missingSections = requiredSections.filter((sectionName) => {
    const match = parsedSections.find((section) =>
      normalizedHeadingIncludes(section.heading, sectionName),
    );
    return !match || !hasNonTrivialSectionBody(match.body);
  });

  return {
    status: missingSections.length > 0 ? "incomplete" : "verified",
    checkedAt,
    requiredSections,
    missingSections,
  };
}

export function withSectionVerificationMetadata(
  metadata: SourceArtifactBodyGenerationMetadata,
  verification: SourceSectionVerification | null,
): SourceArtifactBodyGenerationMetadata {
  if (!verification) return metadata;
  return {
    ...metadata,
    sectionVerification: verification,
  };
}

interface ParsedSection {
  heading: string;
  body: string;
}

function parseMarkdownLevelTwoSections(markdown: string): ParsedSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let current: { heading: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    if (/^##(?!#)\s+/.test(line)) {
      if (current) {
        sections.push({
          heading: current.heading,
          body: current.bodyLines.join("\n"),
        });
      }
      current = { heading: line, bodyLines: [] };
      continue;
    }
    if (current) current.bodyLines.push(line);
  }

  if (current) {
    sections.push({
      heading: current.heading,
      body: current.bodyLines.join("\n"),
    });
  }
  return sections;
}

function normalizedHeadingIncludes(
  heading: string,
  sectionName: string,
): boolean {
  const normalizedHeading = normalizeHeading(heading);
  const normalizedSection = normalizeHeading(sectionName);
  return (
    normalizedHeading === normalizedSection ||
    normalizedHeading.includes(normalizedSection)
  );
}

function normalizeHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^§\s*\d+\s*[.\-:·)]*\s*/, "")
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasNonTrivialSectionBody(body: string): boolean {
  const cleaned = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, " ")
    .replace(/[|]/g, " ")
    .replace(/^\s*[-: ]+\s*$/gm, " ")
    .replace(/[#*_>\-[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return cleaned.length >= 25 && words.length >= 4;
}
