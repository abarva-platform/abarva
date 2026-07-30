"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/**
 * Matrix row gate: "Show current-state panel only with 'Target state not yet
 * governed' in place of the target panel" -- state_scope/target_approval_state
 * are not ratified fields yet (GAP-07), so `target` is always expected to be
 * null from the provider; this component still renders the current panel on
 * its own rather than withholding the whole comparison.
 */
export function CurrentVsTargetPanel({
  entityId,
}: {
  readonly entityId: string;
}) {
  const { provider, providerCtx } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.getCurrentVsTargetComparison(providerCtx, entityId),
    [provider, providerCtx, entityId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Current against target"
      emptyTitle="Current-vs-target comparison withheld"
    >
      {(comparison) => (
        <div className="grid gap-3 md:grid-cols-2">
          <Panel side={comparison.current} accentColor="#5f5e5a" />
          {comparison.target ? (
            <Panel side={comparison.target} accentColor="#1d9e75" />
          ) : (
            <div className="rounded-md border border-dashed border-[rgba(10,10,11,0.18)] bg-[rgba(10,10,11,0.02)] p-4">
              <p className="text-sm font-medium text-[#888780]">
                Target state not yet governed
              </p>
              <p className="mt-1 text-sm text-[#888780]">
                state_scope and target_approval_state are not yet ratified
                fields for this entity.
              </p>
            </div>
          )}
        </div>
      )}
    </GatedSection>
  );
}

function Panel({
  side,
  accentColor,
}: {
  readonly side: {
    label: string;
    headline: string;
    targetApprovalState: string | null;
    lines: readonly { key: string; value: string }[];
  };
  readonly accentColor: string;
}) {
  return (
    <div className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-4">
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: accentColor }}
      >
        {side.label}
        {side.targetApprovalState ? ` -- ${side.targetApprovalState}` : ""}
      </p>
      <p className="mt-1 text-sm font-medium text-[#2c2c2a]">{side.headline}</p>
      <dl className="mt-2 space-y-1 text-sm">
        {side.lines.map((line) => (
          <div key={line.key} className="flex justify-between gap-3">
            <dt className="text-[#888780]">{line.key}</dt>
            <dd className="text-[#2c2c2a]">{line.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
