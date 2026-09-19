import { parseSourceScopeDescription } from "@/lib/source/intake-summary";

export interface SourceNewRequestTriageInput {
  trigger: string | null;
  scope: string | null;
  decisionOwner: string | null;
}

export interface SourceNewRequestTriage {
  requested: string;
  missing: string[];
  nextActor: string;
  readyForDefine: boolean;
  actionLabel: "Complete request" | "Review for Define";
}

const recorded = (value: string | null | undefined): value is string =>
  Boolean(value?.trim());

export function buildSourceNewRequestTriage(
  input: SourceNewRequestTriageInput,
): SourceNewRequestTriage {
  const scope = parseSourceScopeDescription(input.scope);
  const requirements = [
    ["Request description", input.trigger],
    ["Decision owner", input.decisionOwner],
    ["Scope boundary", scope.scopeBoundary],
    ["Value target", scope.valueTarget],
    ["Baseline owner", scope.baselineOwner],
  ] as const;
  const missing = requirements
    .filter(([, value]) => !recorded(value))
    .map(([label]) => label);
  const readyForDefine = missing.length === 0;

  return {
    requested: input.trigger?.trim() || "Request description not recorded",
    missing,
    nextActor: input.decisionOwner?.trim() || "Decision owner not recorded",
    readyForDefine,
    actionLabel: readyForDefine ? "Review for Define" : "Complete request",
  };
}
