import type { AvaAnswerPacket, AvaArtifact } from "@/lib/ava-answer/contract";

function normalized(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(values: string[], patterns: RegExp[]): boolean {
  return values.some((value) => patterns.some((pattern) => pattern.test(value)));
}

function isSupportMaterialTable(artifact: AvaArtifact): boolean {
  if (artifact.artifact !== "table") return false;

  const columnLabels = artifact.columns.map((column) =>
    normalized(column.label),
  );
  const columnKeys = artifact.columns.map((column) => normalized(column.key));
  const title = normalized(artifact.title);
  const id = normalized(artifact.id);
  const rowKeys = artifact.rows.flatMap((row) =>
    Object.keys(row).map((key) => normalized(key)),
  );
  const allKeys = [...columnKeys, ...rowKeys];

  const isKnownSupportTable =
    id.includes("answer available context") ||
    hasAny([id, title], [
      /\bevidence\b/,
      /\bsupport(?:ing)? material\b/,
      /\bsource support\b/,
      /\bavailable context\b/,
      /\bsources?\b/,
    ]);
  const hasSourceSupportColumns =
    hasAny(columnLabels, [/\bsource\b/, /\bartifact\b/, /\bfile\b/]) &&
    hasAny(columnLabels, [/\btype\b/, /\bclass\b/]) &&
    hasAny(columnLabels, [/\bconfidence\b/]) &&
    hasAny(columnLabels, [
      /\bsupports? the answer\b/,
      /\bhow it supports\b/,
      /\bbuyer implication\b/,
      /\bfinding\b/,
      /\bsummary\b/,
      /\bexcerpt\b/,
    ]);
  const hasSourceSupportKeys =
    hasAny(allKeys, [/\bsource\b/, /\bartifact\b/, /\bfile\b/]) &&
    hasAny(allKeys, [/\btype\b/, /\bclass\b/]) &&
    hasAny(allKeys, [/\bconfidence\b/]) &&
    hasAny(allKeys, [
      /\buse\b/,
      /\bsupport\b/,
      /\bhow it supports\b/,
      /\bhow it supports the answer\b/,
      /\bfinding\b/,
      /\bsummary\b/,
      /\bexcerpt\b/,
    ]);
  const looksLikeEvidenceRegister =
    hasAny([id, title, ...columnLabels, ...allKeys], [/\bevidence\b/]) &&
    (hasSourceSupportColumns || hasSourceSupportKeys);

  return (
    (isKnownSupportTable && (hasSourceSupportColumns || hasSourceSupportKeys)) ||
    looksLikeEvidenceRegister
  );
}

export function isVisibleAvaArtifact(artifact: AvaArtifact): boolean {
  return !isSupportMaterialTable(artifact);
}

export function hasVisibleAvaArtifacts(
  answer?: AvaAnswerPacket | null,
): answer is AvaAnswerPacket {
  return answer?.artifacts?.some(isVisibleAvaArtifact) ?? false;
}
