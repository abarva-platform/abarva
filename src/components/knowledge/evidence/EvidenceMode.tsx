import type { ReactNode } from "react";

import { ReadinessTiles } from "./ReadinessTiles";
import { DecisionReadinessQuadrant } from "../readiness/DecisionReadinessQuadrant";
import { DecisionsList } from "./DecisionsList";
import { CoverageTable } from "./CoverageTable";
import { ContradictionsList } from "./ContradictionsList";
import { GapsList } from "./GapsList";
import { WithheldExplanationPanel } from "./WithheldExplanationPanel";
import { SourcesPanel } from "../shared/SourcesPanel";

export function EvidenceMode() {
  return (
    <div className="space-y-8">
      <Section title="Decision readiness">
        <ReadinessTiles />
        <div className="mt-4">
          <DecisionReadinessQuadrant />
        </div>
      </Section>
      <Section title="Decisions and what closes them">
        <DecisionsList />
      </Section>
      <Section title="Coverage by domain">
        <CoverageTable />
      </Section>
      <Section title="Where it came from">
        <SourcesPanel />
      </Section>
      <Section title="Contradictions">
        <ContradictionsList />
      </Section>
      <Section title="Open gaps">
        <GapsList />
      </Section>
      <Section title="What every state on this page means">
        <WithheldExplanationPanel />
      </Section>
      <Section title="Completion workbench">
        <p className="text-sm italic text-[#888780]">
          Left-nav link only -- no data shape defined for this yet.
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#0066CC]">
        {title}
      </h2>
      {children}
    </section>
  );
}
