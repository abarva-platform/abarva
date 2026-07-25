"use client";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import type { HomeV4EnterpriseBook, HomeV4GraphBinding, HomeV4MaterialItem } from "./homeV4Visual";

function positionTone(position: string) {
  const normalized = position.toLowerCase();
  if (normalized.includes("ahead") || normalized.includes("lead")) return COLORS.teal;
  if (normalized.includes("behind") || normalized.includes("lag")) return COLORS.red;
  return COLORS.amber;
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
        <section className="heb-v4-book-section">
          <h2>Industry comparison</h2>
          <div className="heb-v4-book-cards">
            {book.industry_comparison.map((item) => (
              <article key={item.pattern} className="heb-v4-book-item">
                <span className="heb-v4-book-item-dot" style={{ background: positionTone(item.this_tenant_position) }} />
                <h3>{item.pattern}</h3>
                <p className="heb-v4-book-position">{item.this_tenant_position}</p>
                <p className="heb-v4-book-item-why">{item.specifics}</p>
              </article>
            ))}
          </div>
        </section>
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
    `}</style>
  );
}
