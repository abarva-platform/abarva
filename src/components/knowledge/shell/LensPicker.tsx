"use client";

import { useEffect, useState } from "react";

import { useKnowledgeApp } from "../knowledge-app-context";
import type { ResolvedAirlineLens } from "@/lib/knowledge/view-model";

/**
 * Business-problem / lens picker. A lens remains selectable even when its
 * domain-key resolution is missing (it is just a filter label) -- but every
 * downstream component under it must independently gate on its own data,
 * which is exactly what GatedSection already does per-section. This
 * component itself never blocks selection.
 *
 * `listAirlineLenses` returns a plain array (not a ViewModelEnvelope) --
 * it is static assembler-layer content (the 9 airline lenses), not a
 * governed projection read, so there is no readiness/withheld state to gate
 * on here.
 */
export function LensPicker() {
  const { assembler, runtime, tenantKey, lensId, setLensId } =
    useKnowledgeApp();
  const [lenses, setLenses] = useState<readonly ResolvedAirlineLens[] | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    assembler.listAirlineLenses({ runtime, tenantKey }).then((result) => {
      if (!cancelled) setLenses(result);
    });
    return () => {
      cancelled = true;
    };
  }, [assembler, runtime, tenantKey]);

  if (!lenses || lenses.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#888780]">
        <span>Business problem:</span>
        <span className="italic">
          {lenses === null
            ? "Loading..."
            : "Lens taxonomy not yet published for this tenant"}
        </span>
      </div>
    );
  }

  return (
    <label className="flex min-w-0 max-w-full items-center gap-2 text-sm">
      <span className="shrink-0 text-[#888780]">Business problem</span>
      <select
        value={lensId}
        onChange={(e) =>
          setLensId(e.target.value as (typeof lenses)[number]["lensId"])
        }
        className="min-w-0 max-w-full rounded-md border border-[rgba(10,10,11,0.18)] bg-white px-2 py-1 text-[#2c2c2a]"
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
