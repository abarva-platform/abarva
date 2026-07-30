import type { ReactNode } from "react";

import { StoryHeader } from "./StoryHeader";
import { IdentityPanel } from "./IdentityPanel";
import { PurposePanel } from "./PurposePanel";
import { GoalsPanel } from "./GoalsPanel";
import { AbarvaViewsPanel } from "./AbarvaViewsPanel";
import { PerspectivesPanel } from "./PerspectivesPanel";
import { BenchmarksPanel } from "./BenchmarksPanel";
import { PatternsPanel } from "./PatternsPanel";
import { DecisionLanesPanel } from "./DecisionLanesPanel";
import { ConditionStrip } from "./ConditionStrip";
import { SourcesPanel } from "../shared/SourcesPanel";

/**
 * Brief mode composes every Brief-mode row from the binding matrix except one:
 * the prototype's "Design notes" tab is deliberately not reproduced anywhere
 * in this build (its own matrix row says so explicitly) -- its content stays
 * internal design documentation, not a shipped product tab.
 */
export function BriefMode() {
  return (
    <div className="space-y-8">
      <StoryHeader />
      <Section title="The enterprise">
        <IdentityPanel />
      </Section>
      <Section title="Purpose and priorities">
        <PurposePanel />
      </Section>
      <Section title="Goals">
        <GoalsPanel />
      </Section>
      <Section title="AbarVa view">
        <AbarvaViewsPanel />
      </Section>
      <Section title="Leadership against evidence">
        <PerspectivesPanel />
      </Section>
      <Section title="Industry position">
        <BenchmarksPanel />
      </Section>
      <Section title="Industry patterns">
        <PatternsPanel />
      </Section>
      <Section title="Decisions waiting">
        <DecisionLanesPanel />
      </Section>
      <Section title="Condition">
        <ConditionStrip />
      </Section>
      <Section title="What it stands on">
        <SourcesPanel />
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
