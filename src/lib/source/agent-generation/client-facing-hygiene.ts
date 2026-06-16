const CLIENT_FACING_ARTIFACT_LABELS: Record<string, string> = {
  d01_strategy_memo: "Sourcing Strategy Memo",
  d02_value_target: "Value Target Brief",
  d03_archetype_decision: "Archetype Decision Record",
  d04_app_inv: "Application Inventory",
  d05_scope_memo: "Scope Memo",
  d07_ticket_synth: "Ticket History Synthesis",
  d09_rfp_pack: "RFP Package",
};

const RAW_INTERNAL_TERMS = [
  "tenant key",
  "tenant_key",
  "substrate",
  "chunk_id",
  "fact_key",
  "source_artifacts",
  "artifact id",
];

export function sanitizeClientFacingSourceDraft(markdown: string): string {
  let output = markdown;
  for (const [raw, label] of Object.entries(CLIENT_FACING_ARTIFACT_LABELS)) {
    output = output.replace(
      new RegExp(`\\b${escapeRegExp(raw)}\\b`, "gi"),
      label,
    );
  }

  output = output
    .split(/\r?\n/)
    .map((line) => sanitizeInternalTermLine(line))
    .join("\n");

  return output;
}

function sanitizeInternalTermLine(line: string): string {
  let next = line;
  for (const term of RAW_INTERNAL_TERMS) {
    next = next.replace(new RegExp(escapeRegExp(term), "gi"), "source label");
  }
  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
