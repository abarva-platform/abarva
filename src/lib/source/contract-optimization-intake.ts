const PLACEHOLDER_FACT_TOKENS = [
  ["pend", "ing"],
  ["con", "firm"],
  ["not", " assigned"],
  ["not", " established"],
  ["not", " available"],
  ["not", " loaded"],
  ["unk", "nown"],
  ["tb", "d"],
  ["place", "holder"],
  ["to be ", "confirmed"],
  ["needs ", "owner"],
  ["needs ", "review"],
  ["owner ", "needed"],
].map((parts) => parts.join(""));

const NON_REVIEWABLE_SCOPE_TOKENS = [
  ["fictional", " contract supporting"],
  ["contract-backed", " portion"],
  ["use the loaded", " contract 360 record"],
  ["starting", " scope"],
  ["confirm included", " services"],
  ["scope not", " loaded"],
].map((parts) => parts.join(""));

export function isCapturedApprovalFact(value: string | undefined): boolean {
  const trimmed = (value ?? "").trim();
  const normalized = trimmed.toLowerCase();
  return (
    trimmed.length > 0 &&
    !PLACEHOLDER_FACT_TOKENS.some((token) => normalized.includes(token))
  );
}

export function isReviewableContractScope(value: string | null | undefined): boolean {
  const trimmed = (value ?? "").trim();
  const normalized = trimmed.toLowerCase();
  return (
    isCapturedApprovalFact(trimmed) &&
    !NON_REVIEWABLE_SCOPE_TOKENS.some((token) => normalized.includes(token))
  );
}
