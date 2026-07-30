"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";

/**
 * Business-problem / lens picker. Matrix row 2's render gate: a lens remains
 * selectable even when its canonical-taxonomy resolution is missing (it is
 * just a filter label) -- but every downstream component under it must
 * independently gate on its own data, which is exactly what GatedSection
 * already does per-section. This component itself never blocks selection.
 */
export function LensPicker() {
  const { provider, providerCtx, lensId, setLensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listLenses(providerCtx),
    [provider, providerCtx],
  );

  const lenses = envelope?.data ?? null;

  if (!lenses || lenses.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#888780]">
        <span>Business problem:</span>
        <span className="italic">
          Lens taxonomy not yet published for this tenant
        </span>
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-[#888780]">Business problem</span>
      <select
        value={lensId}
        onChange={(e) => setLensId(e.target.value)}
        className="rounded-md border border-[rgba(10,10,11,0.18)] bg-white px-2 py-1 text-[#2c2c2a]"
      >
        {lenses.map((lens) => (
          <option key={lens.lensId} value={lens.lensId}>
            {lens.label}
            {!lens.resolved ? " (taxonomy unresolved)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
