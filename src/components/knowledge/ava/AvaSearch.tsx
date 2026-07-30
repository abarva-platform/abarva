"use client";

import { useState } from "react";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/**
 * Global search (Systems / Measures / Perspectives / Open gaps). Matrix row
 * gate: each result group independently gates on its own source object's
 * readiness, and an unindexed group shows "No indexed results" -- distinct
 * copy from "No matches" for a real, searched-but-empty group.
 */
export function AvaSearch() {
  const { provider, providerCtx } = useKnowledgeApp();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const envelope = useEnvelope(
    () =>
      submitted
        ? provider.searchKnowledge(providerCtx, submitted)
        : Promise.resolve(undefined as never),
    [provider, providerCtx, submitted],
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
        placeholder="Systems, measures, perspectives, gaps"
        className="w-full rounded-md border border-[rgba(10,10,11,0.18)] px-2.5 py-1.5 text-sm"
      />
      {submitted ? (
        <div className="mt-2">
          <GatedSection
            envelope={envelope}
            label="Search results"
            emptyTitle="No indexed results"
            emptyBody="Deterministic search over the governed knowledge index has not been built for this tenant yet."
          >
            {(groups) => (
              <ul className="space-y-2">
                {groups.map((g) => (
                  <li key={g.groupLabel}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
                      {g.groupLabel}
                    </p>
                    {!g.indexed ? (
                      <p className="text-sm italic text-[#888780]">
                        No indexed results
                      </p>
                    ) : g.results.length === 0 ? (
                      <p className="text-sm italic text-[#888780]">
                        No matches
                      </p>
                    ) : (
                      <ul className="mt-1 space-y-0.5">
                        {g.results.map((r) => (
                          <li key={r.name} className="text-sm text-[#2c2c2a]">
                            {r.name}{" "}
                            <span className="text-[#888780]">
                              - matched on {r.matchedOn}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </GatedSection>
        </div>
      ) : null}
    </div>
  );
}
