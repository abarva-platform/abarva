"use client";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import { HomeV4VisualRenderer } from "./HomeV4VisualRenderer";
import type {
  HomeV4ChangeThesis,
  HomeV4GraphProjection,
  HomeV4IndustryChange,
  HomeV4IndustryMovement,
  HomeV4NewWayOfOperating,
  HomeV4UseCaseBatch,
} from "./homeV4Visual";

function classificationDot(classification?: string) {
  const map: Record<string, string> = {
    loaded_fact: COLORS.teal,
    derived_measure: COLORS.blue,
    industry_pattern: COLORS.amber,
    strategic_inference: COLORS.quiet,
    missing_evidence: COLORS.red,
  };
  return (classification && map[classification]) || COLORS.quiet;
}

function FramingHeader({ industryChange }: { industryChange: HomeV4IndustryChange }) {
  return (
    <div className="heb-v4-ct-framing">
      <h1>{industryChange.headline}</h1>
      <p>{industryChange.framing?.narrative}</p>
      {industryChange.benchmark_exhibits?.[0] ? (
        <HomeV4VisualRenderer visual={industryChange.benchmark_exhibits[0]} />
      ) : null}
    </div>
  );
}

export function IndustryMovementsPage({ industryChange }: { industryChange: HomeV4IndustryChange }) {
  return (
    <div className="heb-v4-ct-page">
      <FramingHeader industryChange={industryChange} />
      <div className="heb-v4-ct-cards">
        {industryChange.industry_movements.map((item: HomeV4IndustryMovement) => (
          <article key={item.movement} className="heb-v4-ct-card">
            <span className="heb-v4-ct-dot" style={{ background: classificationDot(item.classification) }} />
            <h3>{item.movement}</h3>
            <p>{item.so_what}</p>
            <p className="heb-v4-ct-realization">{item.industry_realization}</p>
            {item.evidence_gate ? (
              <p className="heb-v4-ct-gate">Evidence gate: {item.evidence_gate}</p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function NewWaysOfOperatingPage({ industryChange }: { industryChange: HomeV4IndustryChange }) {
  return (
    <div className="heb-v4-ct-page">
      <FramingHeader industryChange={industryChange} />
      <div className="heb-v4-ct-cards">
        {industryChange.new_ways_of_operating.map((item: HomeV4NewWayOfOperating) => (
          <article key={item.shift} className="heb-v4-ct-card">
            <span className="heb-v4-ct-dot" style={{ background: classificationDot(item.classification) }} />
            <h3>{item.shift}</h3>
            <div className="heb-v4-ct-shift">
              <div>
                <span className="heb-section-label">From</span>
                <p>{item.from_state}</p>
              </div>
              <div className="heb-v4-ct-shift-arrow">→</div>
              <div>
                <span className="heb-section-label">To</span>
                <p>{item.to_state}</p>
              </div>
            </div>
            {item.industry_realization ? <p className="heb-v4-ct-realization">{item.industry_realization}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function EnterpriseChangeThesesPage({ industryChange }: { industryChange: HomeV4IndustryChange }) {
  return (
    <div className="heb-v4-ct-page">
      <FramingHeader industryChange={industryChange} />
      <div className="heb-v4-ct-cards">
        {industryChange.change_theses.map((item: HomeV4ChangeThesis) => (
          <article key={item.thesis} className="heb-v4-ct-card">
            <span className="heb-v4-ct-dot" style={{ background: classificationDot(item.classification) }} />
            <h3>{item.thesis}</h3>
            <p>{item.argument}</p>
            {item.industry_realization ? <p className="heb-v4-ct-realization">{item.industry_realization}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function CandidateUseCasesPage({ batches }: { batches: HomeV4UseCaseBatch[] }) {
  return (
    <div className="heb-v4-ct-page">
      <h1>Candidate Use Cases</h1>
      {batches.map((batch, batchIndex) => (
        <div key={batchIndex} className="heb-v4-ct-batch">
          {batch.section_thesis ? <p className="heb-v4-ct-batch-thesis">{batch.section_thesis}</p> : null}
          <HomeV4VisualRenderer visual={batch.priority_matrix_visual} />
          {(
            [
              ["Qualified", batch.qualified_candidates, COLORS.teal],
              ["Foundations", batch.foundations, COLORS.blue],
              ["Early ideas", batch.early_ideas, COLORS.quiet],
            ] as const
          ).map(([tierLabel, items, color]) =>
            items.length ? (
              <div key={tierLabel} className="heb-v4-ct-tier">
                <span className="heb-section-label" style={{ color }}>
                  {tierLabel} ({items.length})
                </span>
                <div className="heb-v4-ct-cards">
                  {items.map((candidate) => (
                    <article key={candidate.name} className="heb-v4-ct-card">
                      <h3>{candidate.name}</h3>
                      {candidate.current_work ? (
                        <p>
                          <strong>Today:</strong> {candidate.current_work}
                        </p>
                      ) : null}
                      {candidate.future_work ? (
                        <p>
                          <strong>Future:</strong> {candidate.future_work}
                        </p>
                      ) : null}
                      {candidate.owner ? <p className="heb-v4-ct-realization">Owner: {candidate.owner}</p> : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : null,
          )}
          {batch.sequencing_rationale ? (
            <p className="heb-v4-ct-sequencing">
              {batch.sequencing_rationale.narrative ?? batch.sequencing_rationale.statement}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function TransformationDependenciesPage({ projection }: { projection: HomeV4GraphProjection }) {
  return (
    <div className="heb-v4-ct-page">
      <h1>{projection.headline}</h1>
      {projection.executive_question ? <p className="heb-v4-ct-question">{projection.executive_question}</p> : null}
      <HomeV4VisualRenderer visual={projection.graph_display_contract} />
      <div className="heb-v4-ct-cards">
        {projection.business_meaning ? (
          <article className="heb-v4-ct-card">
            <span className="heb-section-label">What changes</span>
            <p>{projection.business_meaning}</p>
          </article>
        ) : null}
        {projection.dependencies ? (
          <article className="heb-v4-ct-card">
            <span className="heb-section-label">Dependencies</span>
            <p>{projection.dependencies}</p>
          </article>
        ) : null}
        {projection.constraints ? (
          <article className="heb-v4-ct-card">
            <span className="heb-section-label">Constraints</span>
            <p>{projection.constraints}</p>
          </article>
        ) : null}
        {projection.next_action ? (
          <article className="heb-v4-ct-card">
            <span className="heb-section-label">Next action</span>
            <p>{projection.next_action}</p>
          </article>
        ) : null}
      </div>
    </div>
  );
}

export function HomeV4ChangeTransformationStyles() {
  return (
    <style jsx global>{`
      .heb-v4-ct-page {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .heb-v4-ct-page h1 {
        margin: 0;
        font-size: 20px;
        color: ${COLORS.ink};
      }
      .heb-v4-ct-framing p {
        margin: 8px 0 16px;
        font-size: 13px;
        color: ${COLORS.muted};
        max-width: 74ch;
      }
      .heb-v4-ct-question {
        margin: -8px 0 0;
        font-size: 13px;
        color: ${COLORS.muted};
      }
      .heb-v4-ct-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 12px;
      }
      .heb-v4-ct-card {
        position: relative;
        padding: 14px 16px 14px 22px;
        border: 1px solid ${COLORS.line};
        border-radius: 10px;
        background: ${COLORS.surface};
      }
      .heb-v4-ct-card h3 {
        margin: 0 0 8px;
        font-size: 14px;
        color: ${COLORS.ink};
        line-height: 1.3;
      }
      .heb-v4-ct-card p {
        margin: 0 0 6px;
        font-size: 12.5px;
        color: ${COLORS.muted};
        line-height: 1.45;
      }
      .heb-v4-ct-dot {
        position: absolute;
        left: 8px;
        top: 18px;
        width: 7px;
        height: 7px;
        border-radius: 999px;
      }
      .heb-v4-ct-realization {
        font-style: italic;
        color: ${COLORS.quiet} !important;
      }
      .heb-v4-ct-gate {
        margin-top: 8px !important;
        padding-top: 8px;
        border-top: 1px dashed ${COLORS.line};
        font-size: 11px !important;
        color: ${COLORS.amber} !important;
      }
      .heb-v4-ct-shift {
        display: grid;
        grid-template-columns: 1fr 20px 1fr;
        gap: 8px;
        align-items: start;
        margin-bottom: 6px;
      }
      .heb-v4-ct-shift-arrow {
        color: ${COLORS.quiet};
        text-align: center;
        padding-top: 14px;
      }
      .heb-v4-ct-batch {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 20px;
        margin-bottom: 12px;
        border-bottom: 1px solid ${COLORS.line};
      }
      .heb-v4-ct-batch:last-child {
        border-bottom: none;
      }
      .heb-v4-ct-batch-thesis {
        margin: 0;
        font-size: 13px;
        color: ${COLORS.muted};
        max-width: 74ch;
      }
      .heb-v4-ct-tier {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .heb-v4-ct-sequencing {
        margin: 0;
        padding: 12px 14px;
        border-left: 3px solid ${COLORS.ink};
        background: ${COLORS.rail};
        font-size: 13px;
        color: ${COLORS.ink};
      }
    `}</style>
  );
}
