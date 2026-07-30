"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { readinessPresentation } from "../state/gate-utils";
import type { CurrentVsTargetSide } from "@/lib/knowledge/view-model";

/**
 * Current against target -- `getCurrentVsTarget` composes Brief-level
 * TargetV1.current/target (both GovernedMetricValue, never merged into one
 * object -- see VIEW_MODEL_ASSEMBLER_INTERFACES.md's hard invariant). When no
 * governed target exists for this entity, `target.readiness` resolves to
 * NOT_ASSESSED with `value: null`; this still renders the current panel on
 * its own rather than withholding the whole comparison.
 */
export function CurrentVsTargetPanel({
  entityId,
}: {
  readonly entityId: string;
}) {
  const { assembler, runtime, tenantKey, lensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () =>
      assembler.getCurrentVsTarget({
        runtime,
        tenantKey,
        lens: lensId,
        entityRef: entityId,
      }),
    [assembler, runtime, tenantKey, lensId, entityId],
  );

  return (
    <GatedSection envelope={envelope} label="Current against target">
      {(comparison) => (
        <div className="grid gap-3 md:grid-cols-2">
          <Panel
            label={`${comparison.label} -- Current`}
            side={comparison.current}
            accentColor="#5f5e5a"
          />
          {comparison.target.value ? (
            <Panel
              label={`${comparison.label} -- Target`}
              side={comparison.target}
              accentColor="#1d9e75"
            />
          ) : (
            <div className="rounded-md border border-dashed border-[rgba(10,10,11,0.18)] bg-[rgba(10,10,11,0.02)] p-4">
              <p className="text-sm font-medium text-[#888780]">
                Target state not yet governed
              </p>
              <p className="mt-1 text-sm text-[#888780]">
                {readinessPresentation(comparison.target.readiness).title}.
              </p>
            </div>
          )}
        </div>
      )}
    </GatedSection>
  );
}

function Panel({
  label,
  side,
  accentColor,
}: {
  readonly label: string;
  readonly side: CurrentVsTargetSide;
  readonly accentColor: string;
}) {
  const presentation = readinessPresentation(side.readiness);
  return (
    <div className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-4">
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: accentColor }}
      >
        {label}
      </p>
      {side.value ? (
        <p className="mt-1 text-lg font-medium text-[#2c2c2a]">
          {side.value.value ?? "Not measured"}
          {side.value.unit ?? ""}
        </p>
      ) : (
        <p className="mt-1 text-sm italic text-[#888780]">
          {presentation.title}
        </p>
      )}
      {side.value?.period ? (
        <p className="mt-1 text-xs text-[#888780]">{side.value.period}</p>
      ) : null}
    </div>
  );
}
