"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import type { HandoffTargetModule } from "@/lib/knowledge/providers/read-models";

const VALID_TARGETS: readonly HandoffTargetModule[] = [
  "Moves",
  "Tower",
  "Source",
  "Intelligence",
];

/**
 * Matrix row gates:
 *  - "Disable the 'Confirm handoff' action with 'Not yet available for this
 *    tenant' rather than creating a broken reference" -- confirmEnabled comes
 *    straight from the provider, this component never overrides it locally.
 *  - "Do not show a receiving-module confirmation as complete until the
 *    receiving object is proven to re-read Knowledge" -- there is no success
 *    state in this component at all; Confirm is either disabled or, if it
 *    were ever enabled, would need its own live-proof step this build does
 *    not claim to have.
 */
export function ModuleHandoffModal() {
  const { provider, providerCtx, handoffTarget, closeHandoff } =
    useKnowledgeApp();

  if (
    !handoffTarget ||
    !VALID_TARGETS.includes(handoffTarget as HandoffTargetModule)
  )
    return null;

  return (
    <ModalBody
      target={handoffTarget as HandoffTargetModule}
      provider={provider}
      providerCtx={providerCtx}
      onClose={closeHandoff}
    />
  );
}

function ModalBody({
  target,
  provider,
  providerCtx,
  onClose,
}: {
  readonly target: HandoffTargetModule;
  readonly provider: ReturnType<typeof useKnowledgeApp>["provider"];
  readonly providerCtx: ReturnType<typeof useKnowledgeApp>["providerCtx"];
  readonly onClose: () => void;
}) {
  const envelope = useEnvelope(
    () => provider.getModuleHandoffPreview(providerCtx, target),
    [provider, providerCtx, target],
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
              Send to {target}
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
          emptyTitle={`${target} handoff not yet available`}
        >
          {(preview) => (
            <div>
              <dl className="space-y-1.5 text-sm">
                <Row label="Business problem" value={preview.businessProblem} />
                <Row label="Scope carried" value={preview.scopeCarried} />
                <Row
                  label="Insight reference"
                  value={preview.insightReference ?? "None"}
                />
                <Row
                  label="Entities carried"
                  value={preview.entitiesCarriedText}
                />
                <Row
                  label="Knowledge snapshot"
                  value={preview.knowledgeSnapshotRef}
                />
                <Row
                  label="Evidence carried"
                  value={preview.evidenceCarriedText}
                />
                <Row label="Readiness" value={preview.readinessText} />
                <Row
                  label="Known gaps travelling with it"
                  value={preview.knownGapsTravellingText}
                />
              </dl>
              <p className="mt-3 text-xs text-[#888780]">
                Nothing is copied into another truth store. {target} holds a
                reference to this snapshot and re-reads Knowledge as it changes.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={!preview.confirmEnabled}
                  title={
                    preview.confirmEnabled
                      ? undefined
                      : (preview.confirmDisabledReason ??
                        "Not yet available for this tenant")
                  }
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    preview.confirmEnabled
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
              {!preview.confirmEnabled ? (
                <p className="mt-2 text-xs text-[#a32d2d]">
                  {preview.confirmDisabledReason ??
                    "Not yet available for this tenant."}
                </p>
              ) : null}
            </div>
          )}
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
