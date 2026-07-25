"use client";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import type { HomeV4EnterpriseBook, HomeV4GraphBinding, HomeV4IndustryComparisonItem, HomeV4MaterialItem } from "./homeV4Visual";

function positionTone(position: string) {
  const normalized = position.toLowerCase();
  if (normalized.includes("ahead") || normalized.includes("lead")) return COLORS.teal;
  if (normalized.includes("behind") || normalized.includes("lag")) return COLORS.red;
  return COLORS.amber;
}

// Code-owned, not Claude-authored, so it is guaranteed to appear verbatim on
// every candidate rather than relying on a generated section that could be
// paraphrased or dropped. Reflects the real, current state of the data
// model: no prior-period, trend, or external benchmark figures are loaded
// yet -- see docs/releases/records/2026-07-25-home-v4-industry-comparison-fix.md.
const INDUSTRY_COMPARISON_DISCLOSURE =
  "Quantitative benchmarking is limited by incomplete baseline, actual, historical, and external benchmark data. Positions below combine available evidence with qualitative reference patterns and should be treated as directional until the required baselines are established.";

const OVERALL_POSITION_LABEL: Record<string, string> = {
  ahead: "Ahead",
  at_parity: "At parity",
  mixed: "Mixed",
  behind: "Behind",
  not_applicable: "Not applicable",
};

function overallPositionTone(position?: string) {
  switch (position) {
    case "ahead":
      return COLORS.teal;
    case "behind":
      return COLORS.red;
    case "mixed":
    case "at_parity":
      return COLORS.amber;
    default:
      return COLORS.quiet;
  }
}

function dimensionLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dimensionPositionTone(position: string) {
  switch (position) {
    case "ahead":
      return COLORS.teal;
    case "at_parity":
      return COLORS.amber;
    case "behind":
      return COLORS.red;
    default:
      return COLORS.quiet;
  }
}

function MaterialItemCard({ item, tone }: { item: HomeV4MaterialItem; tone: string }) {
  return (
    <article className="heb-v4-book-item">
      <span className="heb-v4-book-item-dot" style={{ background: tone }} />
      <p className="heb-v4-book-item-statement">{item.statement}</p>
      <p className="heb-v4-book-item-why">{item.why_it_matters_to_leadership}</p>
    </article>
  );
}

export function HomeV4BookOverview({ book }: { book: HomeV4EnterpriseBook }) {
  const { executive_narrative: narrative } = book;
  return (
    <div className="heb-v4-book-page">
      <header className="heb-v4-book-hero">
        <span className="heb-section-label">Executive narrative</span>
        <h1>{narrative.title}</h1>
        <p className="heb-v4-book-thesis">{narrative.thesis}</p>
        <p className="heb-v4-book-arc">{narrative.narrative_arc}</p>
      </header>

      {narrative.strategic_agenda?.length ? (
        <section className="heb-v4-book-section">
          <h2>Strategic agenda</h2>
          <ol className="heb-v4-book-agenda">
            {narrative.strategic_agenda.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {narrative.strategic_tensions?.length ? (
        <section className="heb-v4-book-section">
          <h2>Strategic tensions</h2>
          <ul className="heb-v4-book-tensions">
            {narrative.strategic_tensions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="heb-v4-book-columns">
        {book.material_advantages?.length ? (
          <section className="heb-v4-book-section">
            <h2>Material advantages</h2>
            <div className="heb-v4-book-cards">
              {book.material_advantages.map((item) => (
                <MaterialItemCard key={item.id} item={item} tone={COLORS.teal} />
              ))}
            </div>
          </section>
        ) : null}

        {book.material_gaps?.length ? (
          <section className="heb-v4-book-section">
            <h2>Material gaps</h2>
            <div className="heb-v4-book-cards">
              {book.material_gaps.map((item) => (
                <MaterialItemCard key={item.id} item={item} tone={COLORS.red} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {book.industry_comparison?.length ? (
        <HomeV4IndustryComparisonSection items={book.industry_comparison} />
      ) : null}

      {book.decisions?.length || book.recommendations?.length ? (
        <div className="heb-v4-book-columns">
          {book.decisions?.length ? (
            <section className="heb-v4-book-section">
              <h2>Decisions</h2>
              <ul className="heb-v4-book-list">
                {book.decisions.map((item) => (
                  <li key={item.id}>{item.statement}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {book.recommendations?.length ? (
            <section className="heb-v4-book-section">
              <h2>Recommendations</h2>
              <ul className="heb-v4-book-list">
                {book.recommendations.map((item) => (
                  <li key={item.id}>{item.statement}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {book.open_questions?.length ? (
        <section className="heb-v4-book-section">
          <h2>Open questions</h2>
          <ul className="heb-v4-book-list heb-v4-book-open-questions">
            {book.open_questions.map((item) => (
              <li key={item.id}>{item.statement}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

// Table-first per the reviewed design: pattern / position / existing
// strength / material gap / executive implication scan at a glance;
// per-dimension and metric detail expands below for whichever patterns
// carry it. Legacy (pre-2026-07-25) items -- no `dimensions` array -- fall
// back to the old flat card so already-approved, currently-live candidates
// (skyharbor-air, meridian-health) keep rendering correctly until they are
// regenerated under the new contract.
function HomeV4IndustryComparisonSection({ items }: { items: HomeV4IndustryComparisonItem[] }) {
  const calibrated = items.filter((item) => Array.isArray(item.dimensions) && item.dimensions.length > 0);
  const legacy = items.filter((item) => !(Array.isArray(item.dimensions) && item.dimensions.length > 0));

  return (
    <section className="heb-v4-book-section">
      <h2>Industry comparison</h2>
      <p className="heb-v4-book-industry-disclosure">{INDUSTRY_COMPARISON_DISCLOSURE}</p>

      {calibrated.length ? (
        <>
          <div className="heb-v4-book-industry-table-wrap">
            <table className="heb-v4-book-industry-table">
              <thead>
                <tr>
                  <th>Industry pattern</th>
                  <th>Position</th>
                  <th>Existing strength</th>
                  <th>Material gap</th>
                  <th>Executive implication</th>
                </tr>
              </thead>
              <tbody>
                {calibrated.map((item) => (
                  <tr key={item.pattern_id ?? item.pattern}>
                    <td>{item.pattern}</td>
                    <td>
                      <span
                        className="heb-v4-book-industry-position-pill"
                        style={{ background: overallPositionTone(item.overall_position) }}
                      >
                        {OVERALL_POSITION_LABEL[item.overall_position ?? ""] ?? item.overall_position}
                      </span>
                    </td>
                    <td>{item.advantage_to_preserve || "—"}</td>
                    <td>{item.gap_to_close || "—"}</td>
                    <td>{item.executive_implication || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="heb-v4-book-industry-detail-list">
            {calibrated.map((item) => (
              <article key={item.pattern_id ?? item.pattern} className="heb-v4-book-industry-detail">
                <h3>{item.pattern}</h3>
                <ul className="heb-v4-book-industry-dimensions">
                  {(item.dimensions ?? []).map((dim) => (
                    <li key={dim.dimension}>
                      <span
                        className="heb-v4-book-item-dot"
                        style={{ background: dimensionPositionTone(dim.position), position: "static", display: "inline-block", marginRight: 6 }}
                      />
                      <strong>{dimensionLabel(dim.dimension)}</strong> — {dim.position.replace(/_/g, " ")}: {dim.explanation}
                    </li>
                  ))}
                </ul>
                {item.metrics?.length ? (
                  <div className="heb-v4-book-industry-metrics-wrap">
                    <table className="heb-v4-book-industry-metrics-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Baseline</th>
                          <th>Actual</th>
                          <th>Target</th>
                          <th>Evidence status</th>
                          <th>Required next step</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.metrics.map((metric) => (
                          <tr key={metric.metric_id ?? metric.metric_name}>
                            <td>{metric.metric_name}</td>
                            <td>{metric.baseline_value || "Not evidenced"}</td>
                            <td>{metric.actual_value || "Not evidenced"}</td>
                            <td>{metric.target_value || "Not evidenced"}</td>
                            <td>{metric.evidence_status === "available" ? "Available" : metric.evidence_status === "partial" ? "Partial" : "Missing"}</td>
                            <td>{metric.required_next_step || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}

      {legacy.length ? (
        <div className="heb-v4-book-cards">
          {legacy.map((item) => (
            <article key={item.pattern} className="heb-v4-book-item">
              <span className="heb-v4-book-item-dot" style={{ background: positionTone(item.this_tenant_position ?? "") }} />
              <h3>{item.pattern}</h3>
              <p className="heb-v4-book-position">{item.this_tenant_position}</p>
              <p className="heb-v4-book-item-why">{item.specifics}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// graph_binding is a deterministic node/edge count derived from the same
// dependency-map relationship data the old relationship-graph visual used --
// but it carries no node_groups/edge_meaning, so it cannot feed
// HomeV4VisualRenderer's graph renderer. Shown as a disclosed summary, not
// silently dropped and not faked into a graph the data doesn't support.
export function HomeV4GraphBindingSummary({ binding }: { binding: HomeV4GraphBinding }) {
  return (
    <div className="heb-v4-book-graph-summary">
      <span className="heb-section-label">Relationship context</span>
      <p>
        {binding.node_count} related entities, {binding.edge_count} relationships
        {binding.relationship_types?.length ? ` (${binding.relationship_types.join(", ")})` : ""} --
        not yet rendered as a graph in this view.
      </p>
    </div>
  );
}

export function HomeV4BookOverviewStyles() {
  return (
    <style jsx global>{`
      .heb-v4-book-page {
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 920px;
      }
      .heb-v4-book-hero h1 {
        margin: 6px 0 12px;
        font-size: 24px;
        line-height: 1.25;
        color: ${COLORS.ink};
      }
      .heb-v4-book-thesis {
        margin: 0 0 12px;
        font-size: 14px;
        line-height: 1.6;
        color: ${COLORS.ink};
      }
      .heb-v4-book-arc {
        margin: 0;
        font-size: 13px;
        line-height: 1.6;
        color: ${COLORS.muted};
      }
      .heb-v4-book-section h2 {
        margin: 0 0 10px;
        font-size: 15px;
        color: ${COLORS.ink};
      }
      .heb-v4-book-agenda,
      .heb-v4-book-list {
        margin: 0;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
        line-height: 1.5;
        color: ${COLORS.ink};
      }
      .heb-v4-book-tensions {
        margin: 0;
        padding-left: 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
        line-height: 1.5;
        color: ${COLORS.muted};
        font-style: italic;
      }
      .heb-v4-book-open-questions {
        color: ${COLORS.amber};
      }
      .heb-v4-book-columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 20px;
      }
      .heb-v4-book-cards {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .heb-v4-book-item {
        position: relative;
        padding: 12px 14px 12px 22px;
        border: 1px solid ${COLORS.line};
        border-radius: 10px;
        background: ${COLORS.surface};
      }
      .heb-v4-book-item h3 {
        margin: 0 0 6px;
        font-size: 13px;
        color: ${COLORS.ink};
      }
      .heb-v4-book-item-dot {
        position: absolute;
        left: 8px;
        top: 16px;
        width: 7px;
        height: 7px;
        border-radius: 999px;
      }
      .heb-v4-book-item-statement {
        margin: 0 0 6px;
        font-size: 13px;
        line-height: 1.45;
        color: ${COLORS.ink};
      }
      .heb-v4-book-item-why {
        margin: 0;
        font-size: 12px;
        line-height: 1.45;
        color: ${COLORS.muted};
      }
      .heb-v4-book-position {
        margin: 0 0 6px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: ${COLORS.muted};
      }
      .heb-v4-book-graph-summary {
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px dashed ${COLORS.line};
        border-radius: 8px;
        background: ${COLORS.rail};
      }
      .heb-v4-book-graph-summary p {
        margin: 4px 0 0;
        font-size: 12px;
        color: ${COLORS.muted};
      }
      .heb-v4-book-industry-disclosure {
        margin: 0 0 14px;
        padding: 8px 10px;
        border-left: 3px solid ${COLORS.amber};
        background: ${COLORS.rail};
        font-size: 11.5px;
        line-height: 1.5;
        color: ${COLORS.muted};
      }
      .heb-v4-book-industry-table-wrap {
        overflow-x: auto;
        margin-bottom: 18px;
      }
      .heb-v4-book-industry-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12.5px;
      }
      .heb-v4-book-industry-table th,
      .heb-v4-book-industry-table td {
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid ${COLORS.line};
      }
      .heb-v4-book-industry-table th {
        font-size: 10.5px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: ${COLORS.quiet};
        font-weight: 600;
      }
      .heb-v4-book-industry-table td {
        color: ${COLORS.ink};
        line-height: 1.45;
      }
      .heb-v4-book-industry-position-pill {
        display: inline-block;
        padding: 2px 9px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 600;
        color: #fffdf8;
        white-space: nowrap;
      }
      .heb-v4-book-industry-detail-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .heb-v4-book-industry-detail {
        padding: 12px 14px;
        border: 1px solid ${COLORS.line};
        border-radius: 10px;
        background: ${COLORS.surface};
      }
      .heb-v4-book-industry-detail h3 {
        margin: 0 0 8px;
        font-size: 13px;
        color: ${COLORS.ink};
      }
      .heb-v4-book-industry-dimensions {
        margin: 0;
        padding-left: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        line-height: 1.5;
        color: ${COLORS.muted};
      }
      .heb-v4-book-industry-dimensions strong {
        color: ${COLORS.ink};
        font-weight: 600;
      }
      .heb-v4-book-industry-metrics-wrap {
        overflow-x: auto;
        margin-top: 10px;
      }
      .heb-v4-book-industry-metrics-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11.5px;
      }
      .heb-v4-book-industry-metrics-table th,
      .heb-v4-book-industry-metrics-table td {
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid ${COLORS.line};
        font-variant-numeric: tabular-nums;
      }
      .heb-v4-book-industry-metrics-table th {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: ${COLORS.quiet};
        font-weight: 600;
      }
      .heb-v4-book-industry-metrics-table td {
        color: ${COLORS.muted};
      }
    `}</style>
  );
}
