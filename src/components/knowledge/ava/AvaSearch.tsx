"use client";

import { useState } from "react";

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
  KnowledgeSearchResultV1,
} from "@/lib/knowledge/consumption-contracts";

/** GatedSection speaks ViewModelEnvelope; a raw provider call (per the
 * reconciliation matrix, searchKnowledge needs no assembler composition)
 * still needs its ConsumptionEnvelope run through the one real
 * deriveReadiness() function -- never a bespoke readiness rule invented
 * locally. */
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
      : "Deterministic search over the governed knowledge index has not been built for this tenant yet.",
    data: renderable ? env.data : null,
    evidenceRefs: env.evidenceRefs,
    knownGapRefs: env.knownGapRefs,
    asOf: env.asOf,
    knowledgeBaselineRef: env.knowledgeBaselineRef,
    warnings: env.warnings,
  };
}

/**
 * Global search. Per the reconciliation matrix's `searchKnowledge` row
 * (DIRECTLY_SUPPORTED): calls `runtime.provider.searchKnowledge` directly --
 * no assembler composition needed, since the real KnowledgeSearchResultV1
 * envelope is already UI-ready.
 */
export function AvaSearch() {
  const { runtime, tenantKey } = useKnowledgeApp();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const viewModel = useEnvelope<KnowledgeSearchResultV1>(
    () =>
      submitted
        ? runtime.provider
            .searchKnowledge({ tenantKey, query: submitted })
            .then(toViewModel)
        : Promise.resolve(undefined as never),
    [runtime, tenantKey, submitted],
  );

  return (
    <div>
      <label
        htmlFor="knowledge-search"
        className="mb-1 block text-xs font-medium text-[#888780]"
      >
        Search
      </label>
      <input
        id="knowledge-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) setSubmitted(query.trim());
        }}
        placeholder="Systems, vendors, gaps"
        className="w-full rounded-md border border-[rgba(10,10,11,0.18)] px-2.5 py-1.5 text-sm"
      />
      {submitted ? (
        <div className="mt-2">
          <GatedSection
            envelope={viewModel}
            label="Search results"
            emptyTitle="No indexed results"
          >
            {(result) => (
              <ul className="space-y-2">
                {result.hits.length === 0 ? (
                  <li className="text-sm italic text-[#888780]">
                    No matches for &ldquo;{result.query}&rdquo;.
                  </li>
                ) : (
                  result.hits.map((hit) => (
                    <li
                      key={hit.searchDocId}
                      className="text-sm text-[#2c2c2a]"
                    >
                      <p className="font-medium">{hit.title}</p>
                      <p className="text-[#888780]">{hit.snippet}</p>
                    </li>
                  ))
                )}
              </ul>
            )}
          </GatedSection>
        </div>
      ) : null}
    </div>
  );
}
