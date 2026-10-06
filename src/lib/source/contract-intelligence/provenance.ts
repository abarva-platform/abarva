/**
 * Contract-intelligence provenance is deliberately small and strict. The
 * loader may compose narrative around these objects, but it cannot make an
 * unsupported statement look like a client fact by changing its label.
 */

export type ContractClaimRole =
  | "problem"
  | "current_term"
  | "deadline"
  | "calculation"
  | "proposed_ask"
  | "proposed_target"
  | "vendor_rationale"
  | "sizing"
  | "risk";

export type ContractClaimBasis =
  | "client_record"
  | "calculated"
  | "benchmark"
  | "playbook_rule"
  | "judgment"
  | "not_recorded";

export type ContractClaimEvidenceStatus =
  | "supported"
  | "partial"
  | "missing"
  | "conflicted"
  | "not_established";

export type ContractClaimReviewStatus =
  | "draft"
  | "reviewed"
  | "approved"
  | "blocked";

export interface ContractRecordReference {
  readonly sourceSystem: string;
  readonly sourceTable: string;
  readonly sourceRecordId: string;
  readonly documentId?: string | null;
  readonly page?: string | null;
  readonly span?: string | null;
}

export interface ContractClaimGenerationReference {
  readonly generationId: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly generatedAt: string;
}

export interface ContractClaimInput {
  readonly claimId: string;
  readonly opportunityId: string;
  readonly contractId: string;
  readonly role: ContractClaimRole;
  readonly statement: string;
  readonly basis: ContractClaimBasis;
  readonly scenarioKind?:
    | "signed_record"
    | "proposed_target"
    | "benchmark_comparable";
  readonly amountUsd?: number | null;
  readonly amountLowUsd?: number | null;
  readonly amountHighUsd?: number | null;
  readonly sourceRefs?: readonly ContractRecordReference[];
  readonly calculationRunId?: string | null;
  readonly benchmarkId?: string | null;
  readonly playbookRuleId?: string | null;
  readonly playbookRuleVersion?: string | null;
  readonly producedBy: "package_author" | "deterministic_loader" | "human_reviewer" | "claude";
  readonly generationRef?: ContractClaimGenerationReference | null;
  readonly reviewerRef?: string | null;
  readonly reviewedAt?: string | null;
  readonly evidenceStatus?: ContractClaimEvidenceStatus;
  readonly reviewStatus?: ContractClaimReviewStatus;
}

export interface ContractClaimValidationIssue {
  readonly code:
    | "missing_source_ref"
    | "missing_calculation_run"
    | "missing_benchmark"
    | "missing_playbook_rule"
    | "missing_generation_ref"
    | "invalid_amount"
    | "partial_range"
    | "invalid_review"
    | "unsupported_formula"
    | "unknown_formula_input";
  readonly message: string;
}

export interface ContractClaimValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ContractClaimValidationIssue[];
}

function issue(
  code: ContractClaimValidationIssue["code"],
  message: string,
): ContractClaimValidationIssue {
  return { code, message };
}

export function validateContractClaim(
  claim: ContractClaimInput,
): ContractClaimValidationResult {
  const issues: ContractClaimValidationIssue[] = [];
  const refs = claim.sourceRefs ?? [];

  if (claim.basis === "client_record" && refs.length === 0) {
    issues.push(
      issue(
        "missing_source_ref",
        "A client-record claim must cite at least one canonical record or document span.",
      ),
    );
  }
  if (claim.basis === "calculated" && !claim.calculationRunId) {
    issues.push(
      issue(
        "missing_calculation_run",
        "A calculated claim must point to a completed calculation run.",
      ),
    );
  }
  if (claim.basis === "benchmark" && !claim.benchmarkId) {
    issues.push(
      issue(
        "missing_benchmark",
        "A benchmark claim must point to a named comparable benchmark.",
      ),
    );
  }
  if (
    claim.basis === "playbook_rule" &&
    (!claim.playbookRuleId || !claim.playbookRuleVersion)
  ) {
    issues.push(
      issue(
        "missing_playbook_rule",
        "A playbook claim must identify the authored rule and its version.",
      ),
    );
  }
  if (claim.producedBy === "claude" && !claim.generationRef?.generationId) {
    issues.push(
      issue(
        "missing_generation_ref",
        "Claude-produced content must carry a generation record; model attribution cannot be added later.",
      ),
    );
  }

  for (const amount of [claim.amountUsd, claim.amountLowUsd, claim.amountHighUsd]) {
    if (amount != null && (!Number.isFinite(amount) || amount < 0)) {
      issues.push(issue("invalid_amount", "Amounts must be finite and non-negative."));
      break;
    }
  }
  if (
    (claim.amountLowUsd == null) !== (claim.amountHighUsd == null)
  ) {
    issues.push(
      issue(
        "partial_range",
        "A range must include both a lower and upper bound.",
      ),
    );
  }
  if (
    ["reviewed", "approved"].includes(claim.reviewStatus ?? "draft") &&
    (!claim.reviewerRef || !claim.reviewedAt)
  ) {
    issues.push(
      issue(
        "invalid_review",
        "Reviewed or approved content must name the reviewer and review timestamp.",
      ),
    );
  }

  return { valid: issues.length === 0, issues };
}

export function validateContractClaims(
  claims: readonly ContractClaimInput[],
): ContractClaimValidationResult {
  const issues: ContractClaimValidationIssue[] = [];
  const ids = new Set<string>();
  for (const claim of claims) {
    if (ids.has(claim.claimId)) {
      issues.push(issue("invalid_review", `Duplicate claim id: ${claim.claimId}.`));
    }
    ids.add(claim.claimId);
    issues.push(...validateContractClaim(claim).issues);
  }
  return { valid: issues.length === 0, issues };
}

type FormulaToken =
  | { readonly kind: "number"; readonly value: string }
  | { readonly kind: "identifier"; readonly value: string }
  | { readonly kind: "operator"; readonly value: "+" | "-" | "*" | "/" }
  | { readonly kind: "paren"; readonly value: "(" | ")" };

function tokenizeFormula(formula: string): FormulaToken[] | null {
  const tokens: FormulaToken[] = [];
  let index = 0;
  while (index < formula.length) {
    const rest = formula.slice(index);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      index += whitespace[0].length;
      continue;
    }
    const number = rest.match(/^(?:\d+(?:\.\d+)?|\.\d+)/);
    if (number) {
      tokens.push({ kind: "number", value: number[0] });
      index += number[0].length;
      continue;
    }
    const identifier = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      tokens.push({ kind: "identifier", value: identifier[0] });
      index += identifier[0].length;
      continue;
    }
    const symbol = rest[0];
    if (symbol === "+" || symbol === "-" || symbol === "*" || symbol === "/") {
      tokens.push({ kind: "operator", value: symbol });
      index += 1;
      continue;
    }
    if (symbol === "(" || symbol === ")") {
      tokens.push({ kind: "paren", value: symbol });
      index += 1;
      continue;
    }
    return null;
  }
  return tokens;
}

/**
 * Accept only a small arithmetic grammar. This intentionally rejects prose
 * formulas such as "monthly spend x12" while keeping calculation rules
 * deterministic and independently testable.
 */
export function validateArithmeticFormula(
  formula: string,
  inputKeys: readonly string[],
): ContractClaimValidationResult {
  const tokens = tokenizeFormula(formula.trim());
  if (!tokens || tokens.length === 0) {
    return {
      valid: false,
      issues: [issue("unsupported_formula", "Formula is not an arithmetic expression.")],
    };
  }
  const allowed = new Set(inputKeys);
  let depth = 0;
  let expectValue = true;
  let previousValue = false;
  let sawOperator = false;
  const issues: ContractClaimValidationIssue[] = [];
  for (const token of tokens) {
    if (token.kind === "identifier") {
      if (previousValue) {
        issues.push(issue("unsupported_formula", "Formula has adjacent values without an operator."));
      }
      if (!allowed.has(token.value)) {
        issues.push(
          issue(
            "unknown_formula_input",
            `Formula references an undeclared input: ${token.value}.`,
          ),
        );
      }
      expectValue = false;
      previousValue = true;
    } else if (token.kind === "number") {
      if (previousValue) {
        issues.push(issue("unsupported_formula", "Formula has adjacent values without an operator."));
      }
      expectValue = false;
      previousValue = true;
    } else if (token.kind === "paren") {
      if (token.value === "(") {
        if (previousValue) {
          issues.push(issue("unsupported_formula", "Formula has adjacent values without an operator."));
        }
        depth += 1;
        expectValue = true;
        previousValue = false;
      } else {
        depth -= 1;
        if (depth < 0) {
          issues.push(issue("unsupported_formula", "Formula has unbalanced parentheses."));
        }
        expectValue = false;
        previousValue = true;
      }
    } else {
      sawOperator = true;
      if (expectValue && token.value !== "-") {
        issues.push(issue("unsupported_formula", "Formula has an operator where a value is required."));
      }
      expectValue = true;
      previousValue = false;
    }
  }
  if (depth !== 0 || expectValue || !sawOperator) {
    issues.push(issue("unsupported_formula", "Formula must be complete arithmetic with at least one operator."));
  }
  return { valid: issues.length === 0, issues };
}
