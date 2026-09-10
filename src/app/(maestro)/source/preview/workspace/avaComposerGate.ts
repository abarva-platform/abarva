export type ContractDetailState = "idle" | "loading" | "ready" | "error";

export function sourceAvaComposerDisabledReason(input: {
  readonly sourceContract360Mode: boolean;
  readonly detailState: ContractDetailState;
}): string | null {
  if (!input.sourceContract360Mode || input.detailState === "ready") {
    return null;
  }
  return input.detailState === "error"
    ? "Contract context could not load. Reopen the contract before asking aVa."
    : "Loading governed contract context before aVa can answer.";
}
