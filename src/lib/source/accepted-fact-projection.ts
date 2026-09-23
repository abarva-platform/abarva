export interface SourceAssertionInput {
  assertionId: string;
  factId: string;
  tenantKey: string;
  eventId: string;
  factKey: string;
  value: unknown;
  source: {
    system: string;
    artifactId: string;
    versionId: string;
    location: string;
  };
  confidence: string;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  extractionState: string;
  conflictStatus: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  observedAt: string;
  staleAfter: string;
  supersedesAssertionId: string | null;
}

export interface SourceProjectedFact extends Omit<
  SourceAssertionInput,
  "value"
> {
  value: string | number | boolean;
  asOf: string;
}

export interface SourceFactProjectionResult {
  facts: SourceProjectedFact[];
  excluded: Array<{ assertionId: string; reason: string }>;
}

function nonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function timestamp(value: unknown): number | null {
  if (!nonBlank(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function factValue(value: unknown): value is string | number | boolean {
  return (
    (typeof value === "string" && value.trim().length > 0) ||
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean"
  );
}

function exclusionReason(
  scope: { tenantKey: string; eventId: string; asOf: string },
  assertion: SourceAssertionInput,
): string | null {
  if (
    assertion.tenantKey !== scope.tenantKey ||
    assertion.eventId !== scope.eventId
  ) {
    return "scope_mismatch";
  }
  if (
    assertion.reviewStatus !== "accepted" ||
    assertion.extractionState !== "reviewed"
  ) {
    return "not_accepted";
  }
  if (assertion.conflictStatus !== "clear") return "conflicted";
  if (
    !nonBlank(assertion.reviewedBy) ||
    /^(user|unknown|system|n\/a)$/i.test(assertion.reviewedBy.trim()) ||
    timestamp(assertion.reviewedAt) === null
  ) {
    return "review_authority_missing";
  }
  if (
    !nonBlank(assertion.assertionId) ||
    !nonBlank(assertion.factId) ||
    !nonBlank(assertion.factKey) ||
    !factValue(assertion.value)
  ) {
    return "fact_identity_or_value_missing";
  }
  if (
    !assertion.source ||
    !nonBlank(assertion.source.system) ||
    !nonBlank(assertion.source.artifactId) ||
    !nonBlank(assertion.source.versionId) ||
    !nonBlank(assertion.source.location)
  ) {
    return "provenance_missing";
  }
  if (!["low", "medium", "high"].includes(assertion.confidence)) {
    return "confidence_unverified";
  }

  const cutoff = timestamp(scope.asOf);
  const effectiveFrom = timestamp(assertion.effectiveFrom);
  const effectiveTo =
    assertion.effectiveTo === null ? null : timestamp(assertion.effectiveTo);
  const observedAt = timestamp(assertion.observedAt);
  const staleAfter = timestamp(assertion.staleAfter);
  const reviewedAt = timestamp(assertion.reviewedAt);
  if (
    cutoff === null ||
    effectiveFrom === null ||
    (assertion.effectiveTo !== null && effectiveTo === null) ||
    observedAt === null ||
    staleAfter === null ||
    reviewedAt === null ||
    (effectiveTo !== null && effectiveTo < effectiveFrom)
  ) {
    return "time_basis_invalid";
  }
  if (
    effectiveFrom > cutoff ||
    (effectiveTo !== null && effectiveTo < cutoff) ||
    observedAt > cutoff ||
    reviewedAt > cutoff ||
    staleAfter <= cutoff
  ) {
    return "outside_reporting_window";
  }
  return null;
}

export function projectAcceptedSourceFacts(
  scope: { tenantKey: string; eventId: string; asOf: string },
  assertions: readonly SourceAssertionInput[],
): SourceFactProjectionResult {
  const reasons: Array<string | null> = assertions.map((assertion) =>
    exclusionReason(scope, assertion),
  );
  const byAssertionId = new Map<string, number[]>();
  const byFactId = new Map<string, number[]>();
  for (let index = 0; index < assertions.length; index += 1) {
    if (reasons[index] !== null) continue;
    const { assertionId, factId } = assertions[index]!;
    byAssertionId.set(assertionId, [
      ...(byAssertionId.get(assertionId) ?? []),
      index,
    ]);
    byFactId.set(factId, [...(byFactId.get(factId) ?? []), index]);
  }

  const parent = assertions.map((_assertion, index) => index);
  function root(index: number): number {
    if (parent[index] !== index) parent[index] = root(parent[index]!);
    return parent[index]!;
  }
  function connect(a: number, b: number): void {
    parent[root(a)] = root(b);
  }
  for (const indexes of byAssertionId.values()) {
    if (indexes.length > 1) {
      for (const index of indexes) reasons[index] = "unresolved_conflict";
    }
  }
  for (const indexes of byFactId.values()) {
    for (const index of indexes.slice(1)) connect(indexes[0]!, index);
  }
  for (let index = 0; index < assertions.length; index += 1) {
    if (reasons[index] !== null) continue;
    const predecessorId = assertions[index]!.supersedesAssertionId;
    if (!predecessorId) continue;
    const predecessor = byAssertionId.get(predecessorId);
    if (
      !predecessor ||
      predecessor.length !== 1 ||
      reasons[predecessor[0]!] !== null
    ) {
      reasons[index] = "unresolved_conflict";
      continue;
    }
    connect(index, predecessor[0]!);
  }

  const groups = new Map<number, number[]>();
  for (let index = 0; index < assertions.length; index += 1) {
    if (reasons[index] !== null) continue;
    const groupId = root(index);
    groups.set(groupId, [...(groups.get(groupId) ?? []), index]);
  }
  const projectedIndexes: number[] = [];
  for (const indexes of groups.values()) {
    const groupByAssertionId = new Map(
      indexes.map((index) => [assertions[index]!.assertionId, index]),
    );
    const factKeys = new Set(
      indexes.map((index) => assertions[index]!.factKey),
    );
    if (groupByAssertionId.size !== indexes.length || factKeys.size !== 1) {
      for (const index of indexes) reasons[index] = "unresolved_conflict";
      continue;
    }

    const supersededIds = new Set(
      indexes
        .map((index) => assertions[index]!.supersedesAssertionId)
        .filter(nonBlank),
    );
    const terminals = indexes.filter(
      (index) => !supersededIds.has(assertions[index]!.assertionId),
    );
    if (terminals.length !== 1) {
      for (const index of indexes) reasons[index] = "unresolved_conflict";
      continue;
    }

    const visited = new Set<number>();
    let cursor: number | undefined = terminals[0];
    while (cursor !== undefined && !visited.has(cursor)) {
      visited.add(cursor);
      const parentId: string | null = assertions[cursor]!.supersedesAssertionId;
      cursor = parentId ? groupByAssertionId.get(parentId) : undefined;
    }
    if (cursor !== undefined || visited.size !== indexes.length) {
      for (const index of indexes) reasons[index] = "unresolved_conflict";
      continue;
    }

    const terminal = terminals[0]!;
    projectedIndexes.push(terminal);
    for (const index of indexes) {
      if (index !== terminal) reasons[index] = "superseded";
    }
  }

  const facts = projectedIndexes
    .sort((a, b) => a - b)
    .map((index) => {
      const assertion = assertions[index]!;
      return {
        ...assertion,
        value: assertion.value as string | number | boolean,
        asOf: assertion.observedAt,
      };
    });
  const excluded = assertions.flatMap((assertion, index) =>
    reasons[index]
      ? [{ assertionId: assertion.assertionId, reason: reasons[index]! }]
      : [],
  );
  return { facts, excluded };
}
