import type { SourceArtifactBodyGenerationMetadata } from "./types";

export type SourceSectionVerificationStatus = "verified" | "incomplete";

export interface SourceSectionVerification {
  status: SourceSectionVerificationStatus;
  checkedAt: string;
  requiredSections: string[];
  missingSections: string[];
}

export const SOURCE_ARTIFACT_REQUIRED_SECTIONS = {
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

export type SourceSectionVerifiedArtifactCode =
  keyof typeof SOURCE_ARTIFACT_REQUIRED_SECTIONS;

export function getRequiredSectionsForArtifact(
  artifactCode: string,
): readonly string[] {
  return (
    SOURCE_ARTIFACT_REQUIRED_SECTIONS[
      artifactCode as SourceSectionVerifiedArtifactCode
    ] ?? []
  );
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
