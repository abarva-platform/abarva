"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import {
  deriveReadiness,
  readinessIsRenderable,
  type ViewModelEnvelope,
} from "@/lib/knowledge/view-model";
import type {
  ConsumptionEnvelope,
  ModuleHandoffPreviewV1,
  ReceivingModule,
} from "@/lib/knowledge/consumption-contracts";

const VALID_TARGETS: readonly ReceivingModule[] = [
  "moves",
  "tower",
  "source",
  "intelligence",
];

const RECEIVING_MODULE_LABEL: Record<ReceivingModule, string> = {
  moves: "Moves",
  tower: "Tower",
  source: "Source",
  intelligence: "Intelligence",
};

const READINESS_LABEL: Record<
  ModuleHandoffPreviewV1["readinessState"],
  string
> = {
  ready: "Ready",
  blocked_missing_evidence: "Blocked -- missing evidence",
  blocked_partial_baseline: "Blocked -- partial baseline",
  blocked_conflicting: "Blocked -- sources disagree",
  not_applicable: "Not applicable",
};

function toViewModel<T>(env: ConsumptionEnvelope<T>): ViewModelEnvelope<T> {
  const readiness = deriveReadiness({
    availabilityState: env.availabilityState,
    authorityState: env.authorityState,
    freshnessState: env.freshnessState,
    warnings: env.warnings,
    proven: false,
  });
  const renderable = readinessIsRenderable(readiness);
  return {
    readiness,
    unavailableReason: renderable
      ? null
      : `${env.tenantKey} handoff preview is not yet available.`,
    data: renderable ? env.data : null,
    evidenceRefs: env.evidenceRefs,
    knownGapRefs: env.knownGapRefs,
    asOf: env.asOf,
    knowledgeBaselineRef: env.knowledgeBaselineRef,
    warnings: env.warnings,
  };
}

/**
 * Per the reconciliation matrix's `getModuleHandoffPreview` row
 * (DIRECTLY_SUPPORTED): calls `runtime.provider.previewModuleHandoff`
 * directly. The real ModuleHandoffPreviewV1 is thinner than the original
 * prototype's fields (businessProblem/entitiesCarriedText/evidenceCarriedText
 * have no real equivalent) -- `confirmEnabled` derives from the real
 * `readinessState === "ready"` rather than a separate provider-set boolean.
 */
export function ModuleHandoffModal() {
  const { runtime, tenantKey, handoffTarget, closeHandoff } = useKnowledgeApp();

  if (
    !handoffTarget ||
    !VALID_TARGETS.includes(handoffTarget as ReceivingModule)
  )
    return null;

  return (
    <ModalBody
      target={handoffTarget as ReceivingModule}
      runtime={runtime}
      tenantKey={tenantKey}
      onClose={closeHandoff}
    />
  );
}

function ModalBody({
  target,
  runtime,
  tenantKey,
  onClose,
}: {
  readonly target: ReceivingModule;
  readonly runtime: ReturnType<typeof useKnowledgeApp>["runtime"];
  readonly tenantKey: string;
  readonly onClose: () => void;
}) {
  const envelope = useEnvelope<ModuleHandoffPreviewV1>(
    () =>
      runtime.provider
        .previewModuleHandoff({
          tenantKey,
          knowledgeBaselineRef: runtime.baselineRef,
          receivingModule: target,
          selectedEntityRefs: [],
        })
        .then(toViewModel),
    [runtime, tenantKey, target],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,11,0.3)] p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#888780]">
              Governed handoff
            </p>
            <h2 className="text-lg font-semibold text-[#0c1a3a]">
              Send to {RECEIVING_MODULE_LABEL[target]}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[rgba(10,10,11,0.18)] px-2 py-1 text-sm text-[#5f5e5a]"
          >
            Close
          </button>
        </div>

        <GatedSection
          envelope={envelope}
          label="Handoff preview"
          emptyTitle={`${RECEIVING_MODULE_LABEL[target]} handoff not yet available`}
        >
          {(preview) => {
            const confirmEnabled = preview.readinessState === "ready";
            return (
              <div>
                <dl className="space-y-1.5 text-sm">
                  <Row label="Scope" value={preview.scope} />
                  <Row
                    label="Insight reference"
                    value={preview.insightRef ?? "None"}
                  />
                  <Row
                    label="Entities carried"
                    value={String(preview.selectedEntityRefs.length)}
                  />
                  <Row
                    label="Knowledge snapshot"
                    value={preview.knowledgeBaselineRef}
                  />
                  <Row
                    label="Evidence carried"
                    value={String(preview.evidenceRefs.length)}
                  />
                  <Row
                    label="Readiness"
                    value={READINESS_LABEL[preview.readinessState]}
                  />
                  <Row
                    label="Known gaps travelling with it"
                    value={String(preview.knownGapRefs.length)}
                  />
                </dl>
                <p className="mt-3 text-xs text-[#888780]">
                  Nothing is copied into another truth store.{" "}
                  {RECEIVING_MODULE_LABEL[target]} holds a reference to this
                  snapshot and re-reads Knowledge as it changes.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={!confirmEnabled}
                    title={
                      confirmEnabled
                        ? undefined
                        : (preview.readinessDetail ??
                          "Not yet available for this tenant")
                    }
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      confirmEnabled
                        ? "bg-[#0066CC] text-white"
                        : "cursor-not-allowed bg-[rgba(0,102,204,0.25)] text-white/70"
                    }`}
                  >
                    Confirm handoff
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-[rgba(10,10,11,0.18)] px-3 py-2 text-sm text-[#5f5e5a]"
                  >
                    Cancel
                  </button>
                </div>
                {!confirmEnabled && preview.readinessDetail ? (
                  <p className="mt-2 text-xs text-[#a32d2d]">
                    {preview.readinessDetail}
                  </p>
                ) : null}
              </div>
            );
          }}
        </GatedSection>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-[#888780]">{label}</dt>
      <dd className="text-right text-[#2c2c2a]">{value}</dd>
    </div>
  );
}
