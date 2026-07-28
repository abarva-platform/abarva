"use client";

/** Shared helpers for mode components: envelope loading, warnings, proof footer. */

import { useEffect, useState } from "react";
import type { ConsumptionEnvelope } from "@/lib/knowledge/consumption-contracts";
import { atLeastDepth, useShell } from "./state";
import { Banner } from "./primitives";

export function useEnvelope<T>(
  loader: () => Promise<ConsumptionEnvelope<T>>,
  deps: unknown[],
): { envelope: ConsumptionEnvelope<T> | null; loading: boolean; error: string | null } {
  const [envelope, setEnvelope] = useState<ConsumptionEnvelope<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    loader()
      .then((env) => { if (alive) { setEnvelope(env); setLoading(false); } })
      .catch((e) => { if (alive) { setError(String(e?.message ?? e)); setLoading(false); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { envelope, loading, error };
}

const WARNING_TONE: Record<string, "warn" | "alert" | "info"> = {
  newer_baseline_available: "info",
  partial_domain: "warn",
  cube_unavailable: "warn",
  models_disabled: "info",
  last_known_good: "warn",
  conflict_detected: "alert",
  evidence_withheld: "alert",
  not_measured: "warn",
  not_loaded: "alert",
};

export function WarningBanners({ envelope }: { envelope: ConsumptionEnvelope<unknown> | null }) {
  if (!envelope || envelope.warnings.length === 0) return null;
  return (
    <>
      {envelope.warnings.map((w, i) => (
        <Banner key={`${w.code}-${i}`} tone={WARNING_TONE[w.code] ?? "warn"}>
          {w.message}
        </Banner>
      ))}
    </>
  );
}

/** Snapshot/baseline identity — shown only at Proof depth, never cluttering exec view. */
export function ProofFooter({ envelope }: { envelope: ConsumptionEnvelope<unknown> | null }) {
  const { depth } = useShell();
  if (!envelope || !atLeastDepth(depth, "proof")) return null;
  return (
    <div className="kv-proof" aria-label="Proof metadata">
      <div>projection: {envelope.projectionName} · {envelope.projectionContractVersion}</div>
      <div>baseline: {envelope.knowledgeBaselineRef}</div>
      <div>publications: {Object.entries(envelope.domainPublicationVersions).map(([k, v]) => `${k}=${v}`).join(" · ")}</div>
      <div>as-of: {envelope.asOf} · authority: {envelope.authorityState} · availability: {envelope.availabilityState} · freshness: {envelope.freshnessState}</div>
      <div>content-hash: {envelope.contentHash}</div>
    </div>
  );
}

export function LoadingBlock() {
  return <div className="kv-empty" role="status">Loading governed knowledge…</div>;
}

export function ErrorBlock({ error }: { error: string }) {
  return (
    <div className="kv-banner" data-tone="alert" role="alert">
      <span aria-hidden>!</span>
      <span>{error}</span>
    </div>
  );
}
