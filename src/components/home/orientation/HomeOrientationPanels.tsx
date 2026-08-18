"use client";

import { useMemo, useState } from "react";

import type {
  OrientationBlock,
  OrientationDimension,
  OrientationPack,
} from "@/lib/home/orientation-pack-read-adapter";

import styles from "./HomeOrientationPanels.module.css";

/**
 * Home's orientation surface.
 *
 * Home is the page a new executive is sent to when someone says "the context is already loaded,
 * go and learn who we are." It previously answered a different question — it opened on an
 * application estate and closed on technology spend as a share of revenue, which describes an IT
 * department rather than the company that owns one.
 *
 * These panels render the stored orientation pack, so the ordering is the executive's, not the
 * data's: who we are, what we're trying to do, how we're measured, what we run, what people here
 * say, where we stand. The estate is one section of six rather than the spine.
 *
 * Three rules hold throughout, and they are the reason this is worth building rather than writing
 * a page of prose:
 *
 * **Facts render without narrative.** Every block shows its figures whether or not the generated
 * sentence survived validation. Prose is the decoration; the facts are the content. A block with a
 * missing narrative looks deliberate, because it is.
 *
 * **Absence is displayed, never implied.** A dimension the client did not supply stays on screen
 * and is marked. Hiding it would present a partial estate as a complete one — which is how a
 * reader concludes they have no risk register rather than that they never sent one.
 *
 * **Provenance is on the page, not in a tooltip.** Which build, whether a human approved it, how
 * many narratives were rejected. A reader who cannot tell generated content from reviewed content
 * has to trust all of it equally, and should not.
 */

function FactList({ facts }: { facts: OrientationBlock["facts"] }) {
  return (
    <dl className={styles.factList}>
      {facts.map((fact) => {
        // Long declarative values — a business model, a mission — read as prose, not as a metric.
        // Rendering them in the same tile as "503" makes both harder to read.
        const isProse = fact.value.length > 60;
        return (
          <div
            key={fact.label}
            className={isProse ? styles.factProse : styles.factMetric}
          >
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
            {fact.detail ? <p className={styles.factDetail}>{fact.detail}</p> : null}
          </div>
        );
      })}
    </dl>
  );
}

function BlockPanel({ block }: { block: OrientationBlock }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <h2>{block.heading}</h2>
        <p className={styles.question}>{block.question}</p>
      </div>
      {block.narrative ? (
        <p className={styles.narrative}>{block.narrative}</p>
      ) : (
        // Not an error state and not styled as one. The facts below are complete; only the
        // sentence around them is absent.
        <p className={styles.narrativeAbsent}>
          Narrative not generated for this block — the figures below are unaffected.
        </p>
      )}
      <FactList facts={block.facts} />
    </div>
  );
}

const SECTION_LABELS: Record<string, string> = {
  profile: "The enterprise",
  operating: "Operating model",
  workforce: "Workforce",
  applications: "Applications",
  infrastructure: "Infrastructure",
  data: "Data",
  integrations: "Integrations",
  vendors: "Vendors",
  budget: "Spend",
  ai: "AI and automation",
  risk: "Risk",
  operations: "Operations",
  benchmarks: "Benchmarks",
  policies: "Evidence and policy",
  portfolio: "Portfolio",
};

/** Group by the registry's own section so the rail reflects the model, not a second taxonomy. */
function groupDimensions(dimensions: readonly OrientationDimension[]) {
  const bySection = new Map<string, OrientationDimension[]>();
  for (const dimension of dimensions) {
    const section = SECTION_KEY_BY_DIMENSION[dimension.key] ?? "portfolio";
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push(dimension);
  }
  return [...bySection.entries()];
}

/**
 * Dimension → section. Mirrors `scripts/data-build/landscape-dimensions.ts`.
 *
 * Duplicated deliberately: the build-time registry is a Node module that reads the filesystem, and
 * importing it into a client component would pull that into the browser bundle. The cost of the
 * duplication is that a new dimension defaults to "portfolio" until listed here — visible and
 * harmless, rather than silently absent.
 */
const SECTION_KEY_BY_DIMENSION: Record<string, string> = {
  enterprise_profile: "profile",
  business_functions: "operating",
  org_ownership: "operating",
  workforce_roles: "workforce",
  applications: "applications",
  infrastructure: "infrastructure",
  data_assets: "data",
  integrations: "integrations",
  platform_maturity: "infrastructure",
  vendors: "vendors",
  spend: "budget",
  managed_services: "operations",
  ai_use_cases: "ai",
  ai_tool_usage: "ai",
  ai_value_signals: "ai",
  ai_kpis: "ai",
  ai_interviews: "ai",
  risks_controls: "risk",
  processes: "operations",
  service_performance: "operations",
  industry_patterns: "benchmarks",
  expert_lenses: "benchmarks",
  evidence_sources: "policies",
  crosswalk: "policies",
  programs: "portfolio",
  metrics: "portfolio",
};

function share(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function DimensionDetail({ dimension }: { dimension: OrientationDimension }) {
  const evidenceShare =
    dimension.recordCount > 0 ? dimension.evidencedCount / dimension.recordCount : 0;
  return (
    <div className={styles.dimensionDetail}>
      <div className={styles.blockHead}>
        <h2>{dimension.label}</h2>
        <p className={styles.question}>
          {dimension.recordCount.toLocaleString()} records ·{" "}
          {dimension.distinctNameCount.toLocaleString()} distinct named ·{" "}
          {share(evidenceShare)} carry a source
        </p>
      </div>

      {dimension.insight ? (
        <p className={styles.narrative}>{dimension.insight}</p>
      ) : (
        <p className={styles.narrativeAbsent}>
          Narrative not generated — the breakdown below is unaffected.
        </p>
      )}

      {dimension.sampleEntities.length > 0 ? (
        <p className={styles.samples}>
          <span>Examples</span> {dimension.sampleEntities.join(" · ")}
        </p>
      ) : null}

      {dimension.notable.length > 0 ? (
        <section className={styles.subsection}>
          <h3>Largest by {dimension.notable[0].attribute}</h3>
          <ul className={styles.notableList}>
            {dimension.notable.map((row) => (
              <li key={row.name}>
                <span>{row.name}</span>
                <b>${Math.round(row.value).toLocaleString()}</b>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {dimension.categories.map((category) => (
        <section className={styles.subsection} key={category.attribute}>
          <h3>
            {category.attribute}{" "}
            <small>
              {category.distinctValues} distinct value
              {category.distinctValues === 1 ? "" : "s"}
            </small>
          </h3>
          <ul className={styles.barList}>
            {category.top.map((entry) => (
              <li key={entry.value}>
                <span title={entry.value}>{entry.value}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: share(entry.share) }} />
                </div>
                <b>
                  {entry.count} <small>{share(entry.share)}</small>
                </b>
              </li>
            ))}
          </ul>
          {category.tailCount > 0 ? (
            <p className={styles.tail}>
              and {category.tailCount} further value
              {category.tailCount === 1 ? "" : "s"} not shown
            </p>
          ) : null}
        </section>
      ))}

      {dimension.numerics.length > 0 ? (
        <section className={styles.subsection}>
          <h3>Quantities</h3>
          <table className={styles.numericTable}>
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Populated</th>
                <th>Total</th>
                <th>Median</th>
                <th>Largest</th>
                <th>Top 10 hold</th>
              </tr>
            </thead>
            <tbody>
              {dimension.numerics.map((numeric) => (
                <tr key={numeric.attribute}>
                  <td>{numeric.attribute}</td>
                  <td>{numeric.populated.toLocaleString()}</td>
                  <td>{Math.round(numeric.sum).toLocaleString()}</td>
                  <td>{Math.round(numeric.median).toLocaleString()}</td>
                  <td>{Math.round(numeric.max).toLocaleString()}</td>
                  <td>{share(numeric.topTenShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {dimension.sparseAttributes.length > 0 ? (
        <section className={styles.subsection}>
          {/* The most useful thing on this panel for anyone planning an intake follow-up. */}
          <h3>Mostly empty</h3>
          <ul className={styles.sparseList}>
            {dimension.sparseAttributes.map((sparse) => (
              <li key={sparse.attribute}>
                <span>{sparse.attribute}</span>
                <b>{share(sparse.populatedShare)} populated</b>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function OrientationBlockPanel({
  pack,
  blockIds,
}: {
  pack: OrientationPack;
  blockIds: readonly string[];
}) {
  const blocks = blockIds
    .map((id) => pack.blocks.find((block) => block.id === id))
    .filter((block): block is OrientationBlock => Boolean(block));
  if (blocks.length === 0) {
    return (
      <p className={styles.narrativeAbsent}>
        This section has not been generated for this client yet.
      </p>
    );
  }
  return (
    <div className={styles.blockStack}>
      {blocks.map((block) => (
        <BlockPanel block={block} key={block.id} />
      ))}
    </div>
  );
}

export function OrientationExplorePanel({ pack }: { pack: OrientationPack }) {
  const groups = useMemo(() => groupDimensions(pack.dimensions), [pack.dimensions]);
  const [activeKey, setActiveKey] = useState(pack.dimensions[0]?.key ?? "");
  const active = pack.dimensions.find((dimension) => dimension.key === activeKey);

  if (pack.dimensions.length === 0) {
    return (
      <p className={styles.narrativeAbsent}>
        No canonical dimensions have been profiled for this client yet.
      </p>
    );
  }

  return (
    <div className={styles.exploreLayout}>
      <nav className={styles.rail} aria-label="Canonical dimensions">
        {groups.map(([section, dimensions]) => (
          <div className={styles.railGroup} key={section}>
            <p className={styles.railGroupLabel}>{SECTION_LABELS[section] ?? section}</p>
            {dimensions.map((dimension) => (
              <button
                type="button"
                key={dimension.key}
                onClick={() => setActiveKey(dimension.key)}
                className={
                  dimension.key === activeKey ? styles.railItemActive : styles.railItem
                }
              >
                <span>{dimension.label}</span>
                <small>{dimension.recordCount.toLocaleString()}</small>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className={styles.exploreDetail}>
        {active ? <DimensionDetail dimension={active} /> : null}
      </div>
    </div>
  );
}

/**
 * Where the content came from and whether anyone has signed it off.
 *
 * Rendered rather than hidden. `candidate` means generated and validated but not yet reviewed by a
 * person, and a reader is entitled to know that before quoting a figure to their board.
 */
export function OrientationProvenanceBar({ pack }: { pack: OrientationPack }) {
  const { provenance } = pack;
  const reviewed = provenance.status === "approved";
  return (
    <div className={styles.provenance}>
      <span className={reviewed ? styles.badgeApproved : styles.badgeCandidate}>
        {reviewed ? `Approved by ${provenance.approvedBy ?? "reviewer"}` : "Not yet reviewed"}
      </span>
      <span>Build {pack.buildVersion}</span>
      <span>Validation {provenance.validationStatus}</span>
      {provenance.claudeModel ? <span>Narrative {provenance.claudeModel}</span> : null}
      <span>
        {provenance.narrativesGenerated} narrated · {provenance.narrativesRejected} withheld
      </span>
    </div>
  );
}
