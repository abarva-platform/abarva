import { getSourceArtifactProfile } from "@/lib/source/documentation-standards/source-artifact-profiles";
import {
  LANGUAGE_REPLACEMENTS,
  scanForBannedTerms,
} from "@/lib/source/documentation-standards/source-documentation-standards";

const CLIENT_FACING_ARTIFACT_LABELS: Record<string, string> = {
  d01_strategy_memo: "Sourcing Strategy Memo",
  d02_value_target: "Value Target Brief",
  d03_archetype_decision: "Archetype Decision Record",
  d04_app_inv: "Application Inventory",
  d05_scope_memo: "Scope Memo",
  d07_ticket_synth: "Ticket History Synthesis",
  d09_rfp_pack: "RFP Package",
};

export function sourceArtifactClientLabel(artifactCode: string): string {
  return CLIENT_FACING_ARTIFACT_LABELS[artifactCode] ?? artifactCode;
}

const RAW_INTERNAL_TERMS = [
  "tenant key",
  "tenant_key",
  "substrate",
  "chunk_id",
  "fact_key",
  "source_artifacts",
  "source_event_artifact_states",
  "artifact_code",
  "artifact id",
  "body_generation_metadata",
];

const CLIENT_FACING_FALLBACK_REPLACEMENTS: Record<string, string> = {
  Anthropic: "the drafting workflow",
  Opus: "the drafting workflow",
  "claude-opus": "the drafting workflow",
  vector: "supporting evidence",
  embedding: "supporting evidence",
};

export function sanitizeClientFacingSourceDraft(
  markdown: string,
  options: { companyName?: string | null; artifactCode?: string | null } = {},
): string {
  let output = markdown;
  for (const [raw, label] of Object.entries(CLIENT_FACING_ARTIFACT_LABELS)) {
    const markdownEscapedRaw = raw.replace(/_/g, "\\_");
    output = output.replace(
      new RegExp(`\\b${escapeRegExp(raw)}\\b`, "gi"),
      label,
    );
    output = output.replace(
      new RegExp(escapeRegExp(markdownEscapedRaw), "gi"),
      label,
    );
  }

  if (isClientFacingArtifact(options.artifactCode)) {
    output = applyClientFacingLanguageReplacements(
      output,
      options.artifactCode,
    );
  }

  output = output
    .split(/\r?\n/)
    .map((line) => sanitizeInternalTermLine(line))
    .join("\n");

  output = ensureCompanyLabel(output, options.companyName);
  output = dedupeCompanyLabel(output, options.companyName);

  return output;
}

function isClientFacingArtifact(artifactCode?: string | null): boolean {
  if (!artifactCode) return false;
  const profile = getSourceArtifactProfile(shortArtifactCode(artifactCode));
  return Boolean(profile?.clientFacing && !profile.allowedInternalLabels);
}

function applyClientFacingLanguageReplacements(
  markdown: string,
  artifactCode?: string | null,
): string {
  let next = markdown;
  for (const [term, replacement] of Object.entries({
    ...LANGUAGE_REPLACEMENTS,
    ...CLIENT_FACING_FALLBACK_REPLACEMENTS,
  })) {
    next = replacePhrase(next, term, replacement);
  }

  if (artifactCode) {
    const remainingBannedTerms = scanForBannedTerms(
      next,
      shortArtifactCode(artifactCode),
    );
    for (const term of remainingBannedTerms) {
      next = replacePhrase(next, term, "supporting analysis");
    }
  }

  return next;
}

function sanitizeInternalTermLine(line: string): string {
  let next = line;
  next = next.replace(/\bartifact\b(?=\s*:)/gi, "Document");
  for (const term of RAW_INTERNAL_TERMS) {
    next = next.replace(new RegExp(escapeRegExp(term), "gi"), "source label");
  }
  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacePhrase(value: string, raw: string, replacement: string): string {
  const needsPrefixBoundary = /^[A-Za-z0-9_]/.test(raw);
  const boundaryStart = needsPrefixBoundary ? "(^|[^A-Za-z0-9_])" : "";
  const boundaryEnd = /[A-Za-z0-9_]$/.test(raw) ? "(?=$|[^A-Za-z0-9_])" : "";
  const regex = new RegExp(
    `${boundaryStart}${escapeRegExp(raw)}${boundaryEnd}`,
    "gi",
  );
  if (!needsPrefixBoundary) return value.replace(regex, replacement);
  return value.replace(regex, (_match, prefix: string) => `${prefix}${replacement}`);
}

function shortArtifactCode(artifactCode: string): string {
  return artifactCode.split("_")[0] ?? artifactCode;
}

function ensureCompanyLabel(markdown: string, companyName?: string | null) {
  const company = companyName?.trim();
  if (!company) return markdown;
  if (
    new RegExp(`\\bCompany\\s*:\\s*${escapeRegExp(company)}\\b`, "i").test(
      markdown,
    )
  ) {
    return markdown;
  }
  const lines = markdown.split(/\r?\n/);
  const documentLineIndex = lines.findIndex((line) =>
    /\bDocument\b\s*:/.test(line),
  );
  if (documentLineIndex < 0) return markdown;
  lines.splice(documentLineIndex + 1, 0, `Company: ${company}`);
  return lines.join("\n");
}

function dedupeCompanyLabel(markdown: string, companyName?: string | null) {
  const company = companyName?.trim();
  if (!company) return markdown;
  const companyLabel = new RegExp(
    `(?:\\*\\*)?\\bCompany\\b\\s*:\\s*(?:\\*\\*)?\\s*${escapeRegExp(company)}\\b(?:\\*\\*)?`,
    "gi",
  );
  let seen = false;
  return markdown.replace(companyLabel, (match) => {
    if (seen) return "";
    seen = true;
    return match;
  });
}
