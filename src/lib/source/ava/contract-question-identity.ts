const CONTRACT_ID = /\b(?:CTR-[A-Z0-9]*\d[A-Z0-9]*|MER-(?:[A-Z0-9]+-)+[A-Z0-9]*\d[A-Z0-9]*)\b/gi;

function distinctIds(question: string): string[] {
  return [...new Set((question.match(CONTRACT_ID) ?? []).map((id) => id.toUpperCase()))];
}

export function resolveContractQuestionId(
  question: string,
  selectedContractId: string | null,
): string | null {
  const ids = distinctIds(question);
  if (ids.length > 1) return null;
  return ids[0] ?? selectedContractId;
}
