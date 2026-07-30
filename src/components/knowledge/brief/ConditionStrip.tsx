"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { readinessPresentation } from "../state/gate-utils";

const ATTENTION_TONES = new Set(["blocked", "restricted", "gap"]);

/** Condition strip -- a per-domain readiness rollup (real contract has no
 * dedicated "condition tile" object; this composes DecisionReadinessRollup
 * from the assembler's getDecisionReadiness, one tile per domain). */
export function ConditionStrip() {
  const { assembler, runtime, tenantKey, lensId, setMode } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getDecisionReadiness({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection envelope={envelope} label="Condition">
      {(readiness) => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {readiness.domains.map((domain) => {
            const presentation = readinessPresentation(domain.readiness);
            const attention = ATTENTION_TONES.has(presentation.tone);
            return (
              <button
                key={domain.domainKey ?? domain.label}
                type="button"
                onClick={() => setMode("evidence")}
                className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3 text-left"
              >
                <p
                  className={`text-xl font-semibold ${attention ? "text-[#a32d2d]" : "text-[#2c2c2a]"}`}
                >
                  {domain.openGapCount ?? presentation.title}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#5f5e5a]">
                  {domain.label}
                </p>
                <p className="text-xs text-[#888780]">{presentation.title}</p>
              </button>
            );
          })}
        </div>
      )}
    </GatedSection>
  );
}
