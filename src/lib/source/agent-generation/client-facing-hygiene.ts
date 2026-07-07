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
  "artifact id",
];

export function sanitizeClientFacingSourceDraft(
  markdown: string,
  options: { companyName?: string | null } = {},
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

  output = output
    .split(/\r?\n/)
    .map((line) => sanitizeInternalTermLine(line))
    .join("\n");

  output = ensureCompanyLabel(output, options.companyName);
  output = dedupeCompanyLabel(output, options.companyName);

  return output;
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
