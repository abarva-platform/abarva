"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ChapterView,
  GroundedClaim,
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";
import { resolveEvidence } from "@/components/home/preview/evidence-resolver";
import { splitChapterIntoBands } from "../v4/chapter-bands";
import { chapterDepth } from "../v4/chapter-page-content";
import { rankFindings, type Finding, type TableSpec } from "../v4/page-tables";
import { claimSource } from "../v4/source-label";
import { cxoText } from "../v4/cxo-language";
import { homePriorInterpretationLabel } from "@/lib/home/preview/record-source";
import {
  canvasBusiness,
  canvasEstate,
  canvasMetrics,
  narrativeIsCurrent,
  recordCount,
  type CanvasMetric,
  type CanvasView,
  type CanvasPanel,
} from "./canvas-model";
import styles from "./HomeCanvas.module.css";
import { LeadershipCanvas, OperatingCanvas } from "./ContextViews";
import { chapterContext, recordCoverage } from "./context-coverage";

export interface CanvasInspection {
  title: string;
  text: string;
  evidenceIds?: string[];
  sourceRefs?: string[];
  basis?: string;
}
type Href = (view: CanvasView, panel?: CanvasPanel, query?: string) => string;

export function ChapterCanvas({
  chapter,
  bundle,
  source,
  tenantName,
  panel,
  href,
  inspect,
}: {
  chapter: ChapterView;
  bundle: HomeReviewBundle;
  source: HomeRecordRenderSource;
  tenantName: string;
  panel: CanvasPanel;
  href: Href;
  inspect: (detail: CanvasInspection) => void;
}) {
  const depth = useMemo(
    () => chapterDepth(chapter.chapterId, canvasEstate(bundle)),
    [chapter.chapterId, bundle],
  );
  const business = useMemo(
    () => canvasBusiness(bundle, source),
    [bundle, source],
  );
  const bands = useMemo(
    () => splitChapterIntoBands(chapter, bundle.thesis.signalPacket),
    [chapter, bundle],
  );
  const current = narrativeIsCurrent(source);
  const metrics = canvasMetrics(chapter.chapterId, bundle, source).map((metric) => {
    const coverage = metric.objectType ? recordCoverage(bundle, source, metric.objectType) : null;
    return coverage ? {
      ...metric,
      value: coverage.rowCount !== null
        ? coverage.rowCount.toLocaleString("en-US")
        : coverage.summaryState === "available" ? "Summary available" : "Detail not supplied",
      basis: coverage.rowCount !== null
        ? "Rows in selected record"
        : coverage.summaryState === "available"
          ? "Compiled summary; detail rows not supplied"
          : "Detail rows not supplied",
      coverage,
    } : { ...metric, coverage: null };
  });
  const businessOverview =
    chapter.chapterId === "executive_brief" ||
    chapter.chapterId === "our_business";
  const findings = rankFindings(depth.findings);
  const claims =
    bands.follows.length > bands.record.length
      ? [...bands.follows, ...bands.record, ...bands.exposures]
      : [...bands.record, ...bands.follows, ...bands.exposures];
  if (panel === "evidence")
    return (
      <>
        <div className={styles.basis} style={{ marginBottom: 15 }}>
          {current
            ? "Published claims belong to the record version on screen."
            : "Published claim sources belong to an earlier interpretation, not a verified current narrative. Tables and row-derived findings use the current rows."}
        </div>
        <EvidenceCanvas
          chapter={chapter}
          bundle={bundle}
          tables={depth.tables}
          findings={findings}
          unsupported={depth.unsupported.map((item) => item.why)}
          contextItems={chapterContext(bundle, source, chapter.chapterId)}
          href={href}
          inspect={inspect}
        />
      </>
    );
  if (panel === "reading")
    return (
      <div
        className={styles.readingGrid}
        data-canvas-reading={chapter.chapterId}
      >
        <section>
          {!current && (
            <div className={styles.notice}>
              {homePriorInterpretationLabel(
                source,
                bundle.provenance.generated_at.slice(0, 10),
              )}
            </div>
          )}
          <span className={styles.eyebrow}>
            {current ? "Published interpretation" : "Prior interpretation"}
          </span>
          <div className={styles.basis} style={{ marginBottom: 15 }}>
            {source.kind === "ecl_serving_projection"
              ? "Served record"
              : "Reviewed stored record"}
            {" · "}Narrative generated {bundle.provenance.generated_at.slice(0, 10)}.
            {" "}Data as of {source.contextVersion?.dataAsOf ?? bundle.contextVersion?.dataAsOf ?? "not established"}.
            {" "}Version alignment does not establish data currency or independent attestation.
          </div>
          <ReadingCaveats chapter={chapter} bundle={bundle} />
          {chapter.chapterId === "how_we_operate" &&
            chapter.key_insights.every((claim) =>
              claim.evidence_ids.every(
                (id) =>
                  bundle.thesis.signalPacket.signals.find(
                    (signal) => signal.id === id,
                  )?.kind === "dependency",
              ),
            ) && (
              <div className={styles.notice}>
                This published readout covers reporting dependencies, not
                segment organization. It is retained as published; the operating
                context is separate.
              </div>
            )}
          <h2>{cxoText(chapter.headline)}</h2>
          <p>{cxoText(chapter.executive_synthesis)}</p>
          <h3>What the record shows</h3>
          {bands.record.length ? (
            bands.record.map((claim, i) => (
              <ClaimSignal
                key={`${claim.statement}-${i}`}
                claim={claim}
                bundle={bundle}
                inspect={inspect}
              />
            ))
          ) : (
            <p>No published record claims in this chapter.</p>
          )}
          <h3>What follows from it</h3>
          {bands.follows.length ? (
            bands.follows.map((claim, i) => (
              <ClaimSignal
                key={`${claim.statement}-${i}`}
                claim={claim}
                bundle={bundle}
                inspect={inspect}
              />
            ))
          ) : (
            <p>No further interpretation published.</p>
          )}
          {chapter.chapterId === "our_business" && (
            <PriorityList priorities={business.priorities} inspect={inspect} />
          )}
        </section>
        <aside>
          {chapter.chapterId === "our_business" && (
            <>
              <h3>Declared customer / member populations</h3>
              {business.customers.length ? (
                <ul>
                  {business.customers.map((customer) => (
                    <li key={customer}>{customer}</li>
                  ))}
                </ul>
              ) : (
                <p>Not recorded in this version.</p>
              )}
            </>
          )}
          <h3>Exposures to watch</h3>
          {bands.exposures.length ? (
            bands.exposures.map((claim, i) => (
              <ClaimSignal
                key={`${claim.statement}-${i}`}
                claim={claim}
                bundle={bundle}
                inspect={inspect}
              />
            ))
          ) : (
            <p>
              No published exposure claims in this chapter. This is not an
              assurance that exposure is absent.
            </p>
          )}
          <h3>Not established</h3>
          <ul>
            {bands.gaps.map((gap) => (
              <li key={gap}>{cxoText(gap)}</li>
            ))}
          </ul>
          {!bands.gaps.length && (
            <p>No limitations recorded for this chapter.</p>
          )}
          <h3>Questions for the room</h3>
          <ul>
            {bands.questions.map((question) => (
              <li key={question}>{cxoText(question)}</li>
            ))}
          </ul>
          {!bands.questions.length && <p>No questions recorded.</p>}
        </aside>
      </div>
    );

  if (chapter.chapterId === "leadership_perspective")
    return (
      <LeadershipCanvas bundle={bundle} source={source} inspect={inspect} />
    );
  if (chapter.chapterId === "how_we_operate")
    return (
      <OperatingCanvas bundle={bundle} source={source} inspect={inspect} />
    );

  return (
    <div className={styles.overview} data-canvas-overview={chapter.chapterId}>
      {!current && (
        <div className={styles.notice}>
          Current rows are available. The earlier executive interpretation is
          not verified against this version and is kept in Full reading.
        </div>
      )}
      {businessOverview && (
        <section className={styles.section} style={{ marginBottom: 19 }}>
          <h2>
            {business.revenueMix.length
              ? `The declared model combines ${business.revenueMix.map((item) => `${item.label} (${item.share}% of revenue)`).join(" and ")}.`
              : business.businessModel || "Business model not recorded in this version"}
          </h2>
          <p>
            {chapter.chapterId === "executive_brief"
              ? "Declared priorities set the agenda; delivery, value proof and exposure each need their own evidence."
              : "Revenue composition and customer populations describe the business footing; segment profitability is not established here."}
          </p>
          <span className={styles.basis}>
            Declared profile in this {source.kind === "ecl_serving_projection" ? "served" : "stored"} record.
            {bundle.declaredSyntheticDemo || business.context?.evidenceClass === "synthetic_reference"
              ? " Synthetic reference; not client-attested."
              : " Independent attestation not established."}
            {" "}Profile as of {business.context?.profile.asOf ?? source.contextVersion?.dataAsOf ?? bundle.contextVersion?.dataAsOf ?? "not established"}.
          </span>
        </section>
      )}
      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <strong
              data-unknown={
                metric.value === "Not recorded" ||
                metric.value === "Not supplied" ||
                metric.coverage?.rowCount === null
              }
            >
              {metric.value}
            </strong>
            {metric.objectType &&
            bundle.technologyEstate?.recordTypes.some(
              (family) => family.objectType === metric.objectType,
            ) ? (
              <Link
                href={href(`tech:${metric.objectType}`)}
                scroll={false}
                prefetch={false}
              >
                {metric.label}
              </Link>
            ) : (
              <span>{metric.label}</span>
            )}
            <small>{metric.basis}</small>
            {metric.coverage && (
              <button
                className={styles.textButton}
                style={{ marginTop: 5 }}
                aria-label={`Inspect ${metric.label} basis`}
                onClick={() => {
                  const coverage = metric.coverage!;
                  inspect({
                    title: `${metric.label}: record basis`,
                    text: [metric.value, JSON.stringify({ coverage, provenance: bundle.provenance }, null, 2), ...coverage.summaryDatasetKeys.map((key) =>
                      `${key}: ${JSON.stringify(bundle.thesis.signalPacket.visualDatasets[key])}`,
                    )].join("\n\n"),
                    basis: coverage.basis,
                    evidenceIds: [...coverage.summaryEvidenceIds, ...coverage.profileEvidenceIds],
                    sourceRefs: [...(coverage.rowSourceRefs?.flat() ?? []), ...coverage.profileSourceRefs],
                  });
                }}
              >
                Basis
              </button>
            )}
          </div>
        ))}
      </div>
      <div className={styles.split}>
        <section className={styles.section}>
          <ChapterVisual
            chapter={chapter}
            bundle={bundle}
            source={source}
            tables={depth.tables}
            inspect={inspect}
          />
          {(chapter.chapterId === "executive_brief" ||
            chapter.chapterId === "strategy_value_creation") && (
            <PriorityList priorities={business.priorities} inspect={inspect} />
          )}
        </section>
        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <h2>
              {businessOverview
                ? chapter.chapterId === "executive_brief"
                  ? "Executive context"
                  : "Business context"
                : current && bands.follows.length > bands.record.length
                ? "What follows from the record"
                : "Signals that matter"}
            </h2>
            <Link
              href={href(chapter.chapterId, "reading")}
              scroll={false}
              prefetch={false}
            >
              All claims
            </Link>
          </div>
          {businessOverview ? (
            <BusinessStoryContext
              chapterId={chapter.chapterId}
              business={business}
              bundle={bundle}
              metrics={metrics}
              chapter={chapter}
              claims={current ? claims : []}
              href={href}
              inspect={inspect}
            />
          ) : current && claims.length ? (
            claims
              .slice(0, 3)
              .map((claim, i) => (
                <ClaimSignal
                  key={`${claim.statement}-${i}`}
                  claim={claim}
                  bundle={bundle}
                  inspect={inspect}
                />
              ))
          ) : findings.length ? (
            findings
              .slice(0, 3)
              .map((finding) => (
                <FindingSignal
                  key={finding.claim}
                  finding={finding}
                  inspect={inspect}
                  href={href}
                  bundle={bundle}
                />
              ))
          ) : (
            <div className={styles.empty}>
              <strong>No verified executive signals in this view</strong>Earlier
              interpretation is retained separately; this page does not
              substitute it for current evidence.
            </div>
          )}
          {!businessOverview && current && claims.length > 3 && (
            <Link
              className={styles.textButton}
              href={href(chapter.chapterId, "reading")}
              scroll={false}
              prefetch={false}
            >
              {claims.length - 3} more published claims
            </Link>
          )}
          {chapter.chapterId === "our_business" && (
            <div className={styles.linkBand}>
              <div>
                <strong>
                  {business.customers.length
                    ? `${business.customers.length} declared customer / member populations`
                    : "Customer populations not recorded"}
                </strong>
              </div>
              <Link
                href={href(chapter.chapterId, "reading")}
                scroll={false}
                prefetch={false}
              >
                Business detail
              </Link>
            </div>
          )}
          {depth.unsupported.length > 0 && (
            <div style={{ marginTop: 17 }} className={styles.notice}>
              {depth.unsupported.length} evidence views are not supported by the
              rows on screen.{" "}
              <Link
                href={href(chapter.chapterId, "evidence")}
                scroll={false}
                prefetch={false}
              >
                View gaps
              </Link>
            </div>
          )}
        </section>
      </div>
      <div className={styles.linkBand}>
        <div>
          <strong>
            {chapter.chapterId === "executive_brief"
              ? `${tenantName}: one enterprise context`
              : "Evidence behind this chapter"}
          </strong>
          <p>
            {depth.tables.length} deterministic tables · {findings.length}{" "}
            row-derived findings · {current ? claims.length : 0} version-aligned
            published claims
          </p>
        </div>
        <Link
          href={href(
            chapter.chapterId === "executive_brief"
              ? "context"
              : chapter.chapterId,
            chapter.chapterId === "executive_brief" ? "overview" : "evidence",
          )}
          scroll={false}
          prefetch={false}
        >
          {chapter.chapterId === "executive_brief"
            ? "Context & modules"
            : "Open evidence"}
        </Link>
      </div>
    </div>
  );
}

function interpretationCaveats(
  text: string,
  evidenceIds: string[],
  bundle: HomeReviewBundle,
  leadershipChapter = false,
): string[] {
  const evidence = resolveEvidence(evidenceIds, bundle.thesis.signalPacket);
  const voices = leadershipChapter ||
    /\b(leadership|leaders?|interviews?|testimony|testified|CEO|CFO)\b/i.test(text) ||
    evidence.some((item) =>
      item.signalKind === "testimony" ||
      item.domains.some((domain) =>
        ["ai_value_interview_evidence", "executive_interview"].includes(domain),
      ),
    );
  const caveats: string[] = [];
  if (voices) {
    const synthetic = bundle.declaredSyntheticDemo ||
      bundle.thesis.signalPacket.homeEnterpriseContext?.evidenceClass === "synthetic_reference";
    const modelled = bundle.technologyEstate?.recordTypes.some((family) =>
      family.objectType === "executive_interview" &&
      family.rows.some((row) => /modelled|modeled/i.test(String(row.responseBasis ?? ""))),
    );
    caveats.push(
      `${synthetic
        ? "Synthetic leadership reference; not client-attested testimony."
        : modelled
          ? "Modelled responses present; published transcript basis not established."
          : "Leadership response basis not established."} Mentions are not agreement.`,
    );
  }
  if (/(Medicare Advantage|\bMA\b)/i.test(text) && /(Medicare FFS|fee.for.service|\bFFS\b)/i.test(text))
    caveats.push(
      "Combined MA + Medicare FFS share is not an MA-only share or Star Rating exposure.",
    );
  if (/vendor|third-party/i.test(text) && /spend|budget|internal.control/i.test(text))
    caveats.push(
      "Vendor spend does not establish an internal-control deficit.",
    );
  return caveats;
}

function ReadingCaveats({
  chapter,
  bundle,
}: {
  chapter: ChapterView;
  bundle: HomeReviewBundle;
}) {
  const claims = [...chapter.key_insights, ...chapter.tensions, ...chapter.what_to_watch];
  const caveats = interpretationCaveats(
    [chapter.headline, chapter.executive_synthesis, ...claims.map((claim) => claim.statement)].join(" "),
    claims.flatMap((claim) => claim.evidence_ids),
    bundle,
    chapter.chapterId === "leadership_perspective",
  );
  return caveats.length ? (
    <div className={styles.notice} data-reading-basis>
      <strong>Published interpretation limits</strong>
      {caveats.map((caveat) => <div key={caveat}>{caveat}</div>)}
    </div>
  ) : null;
}

function BusinessStoryContext({
  chapterId,
  business,
  bundle,
  metrics,
  chapter,
  claims,
  href,
  inspect,
}: {
  chapterId: ChapterView["chapterId"];
  business: ReturnType<typeof canvasBusiness>;
  bundle: HomeReviewBundle;
  metrics: CanvasMetric[];
  chapter: ChapterView;
  claims: GroundedClaim[];
  href: Href;
  inspect: (detail: CanvasInspection) => void;
}) {
  if (chapterId === "our_business")
    return (
      <>
        <article className={styles.signal}>
          <span className={styles.signalType}>Declared business model</span>
          <p style={{ overflowWrap: "anywhere" }}>
            {business.businessModel || "Business-model detail is not recorded in this version."}
          </p>
          {interpretationCaveats(business.businessModel, [], bundle).map((caveat) => (
            <span key={caveat} className={styles.basis}>{caveat}</span>
          ))}
          {business.businessModel && (
            <button
              className={styles.textButton}
              style={{ marginTop: 8 }}
              onClick={() => inspect({
                title: "Declared business model",
                text: business.businessModel,
                evidenceIds: business.profileRefs.filter((ref) => ref.startsWith("ctx_")),
                sourceRefs: business.profileRefs.filter((ref) => !ref.startsWith("ctx_")),
                basis: "Declared profile; no inferred segment dollars or MA-only share.",
              })}
            >
              Profile basis
            </button>
          )}
        </article>
        <article className={styles.signal}>
          <span className={styles.signalType}>Who is served</span>
          {business.customers.length ? (
            <ul className={`${styles.list} ${styles.contextList}`}>
              {business.customers.map((customer) => <li key={customer}>{customer}</li>)}
            </ul>
          ) : <p>Customer / member populations are not recorded in this version.</p>}
          <span className={styles.basis}>Declared populations; no population size or payer share inferred.</span>
        </article>
        <article className={styles.signal}>
          <span className={styles.signalType}>Declared operating segments</span>
          <p>{business.segments.length ? business.segments.join("; ") : "Operating segments are not recorded in this version."}</p>
          <Link href={href("how_we_operate", "overview")} scroll={false} prefetch={false}>
            Operating context
          </Link>
        </article>
      </>
    );
  const execution = metrics.find((metric) => metric.label === "Programs in execution exhibit");
  const completion = metrics.find((metric) => metric.label === "Below 10% complete");
  const outcomes = recordCount(bundle, "metric_outcome");
  const risks = recordCount(bundle, "risk_control");
  const contexts = [
    {
      label: "Delivery context", link: "Delivery evidence", view: "strategy_value_creation" as const,
      domains: ["program_initiative"],
      text: execution && completion && execution.value !== "Not recorded" && completion.value !== "Not recorded"
            ? `Below 10% complete: ${completion.value} programs in the ${execution.value}-program execution exhibit.`
            : "Aligned execution exhibit not supplied.",
      basis: "Completion is not schedule variance; planned milestones are not shown.",
    },
    {
      label: "Value proof", link: "Value evidence", view: "performance_value" as const,
      domains: ["metric_outcome", "ai_value_realization_signal"],
      text: outcomes === null ? "Outcome detail rows not supplied." : `${outcomes.toLocaleString("en-US")} outcome rows in this record.`,
      basis: "Compiled value summaries are separate from inspectable outcomes.",
    },
    {
      label: "Exposure context", link: "Exposure evidence", view: "what_needs_attention" as const,
      domains: ["risk_control", "risk_or_control"],
      text: risks === null ? "Risk detail rows not supplied." : `${risks.toLocaleString("en-US")} risk rows in this record.`,
      basis: "Missing detail is not absence of exposure.",
    },
  ];
  return contexts.map((context) => {
    const cited = claims.filter((claim) => resolveEvidence(claim.evidence_ids, bundle.thesis.signalPacket)
      .some((item) => item.domains.some((domain) => context.domains.includes(domain))));
    const delivery = context.label === "Delivery context" && execution?.value !== "Not recorded";
    const visuals = chapter.visual_opportunities.filter((visual) =>
      visual.dataset_ref === "stalled_programs" && delivery,
    );
    return (
      <article key={context.label} className={styles.signal}>
        <span className={styles.signalType}>{context.label}</span>
        <p>{context.text}</p>
        <span className={styles.basis}>{context.basis}</span>
        <div className={styles.signalFooter} style={{ flexWrap: "wrap" }}>
          <Link href={href(context.view, "evidence")} scroll={false} prefetch={false}>{context.link}</Link>
          <button className={styles.textButton} onClick={() => inspect({
            title: "Claim and evidence",
            text: [context.text,
              ...(delivery ? [JSON.stringify(bundle.thesis.signalPacket.visualDatasets.stalled_programs ?? [])] : []),
              ...cited.map((claim) => claim.statement),
            ].join("\n\n"),
            evidenceIds: [...cited.flatMap((claim) => claim.evidence_ids), ...visuals.flatMap((visual) => visual.evidence_ids)],
            basis: context.basis,
          })}>Read & verify</button>
        </div>
      </article>
    );
  });
}

function ClaimSignal({
  claim,
  bundle,
  inspect,
}: {
  claim: GroundedClaim;
  bundle: HomeReviewBundle;
  inspect: (detail: CanvasInspection) => void;
}) {
  const source = claimSource(claim, bundle.thesis.signalPacket);
  const interpretation = !["FACT", "OBSERVATION"].includes(claim.claim_type);
  const caveats = interpretationCaveats(claim.statement, claim.evidence_ids, bundle);
  return (
    <article className={styles.signal}>
      <span
        className={styles.signalType}
        data-kind={interpretation ? "interpretation" : "record"}
      >
        {interpretation ? "Interpretation" : "Record claim"}
      </span>
      {caveats.map((caveat) => (
        <span key={caveat} className={styles.basis} style={{ marginBottom: 7, overflowWrap: "anywhere" }}>
          {caveat}
        </span>
      ))}
      <p className={styles.signalSummary}>{cxoText(claim.statement)}</p>
      <div className={styles.signalFooter}>
        <small>{source.label}</small>
        <button
          className={styles.textButton}
          onClick={() =>
            inspect({
              title: interpretation
                ? "Interpretation and evidence"
                : "Claim and evidence",
              text: cxoText(claim.statement),
              evidenceIds: claim.evidence_ids,
              basis: [
                `${claim.claim_type} · ${claim.confidence} confidence · ${source.ids}`,
                ...caveats,
              ].join(" "),
            })
          }
        >
          Read & verify
        </button>
      </div>
    </article>
  );
}

function FindingSignal({
  finding,
  inspect,
  href,
  bundle,
}: {
  finding: Finding;
  inspect: (detail: CanvasInspection) => void;
  href: Href;
  bundle: HomeReviewBundle;
}) {
  const canOpen =
    finding.openRows &&
    bundle.technologyEstate?.recordTypes.some(
      (family) => family.objectType === finding.openRows?.objectType,
    );
  return (
    <article className={styles.signal}>
      <span
        className={styles.signalType}
        data-kind={finding.rated === "high" ? "exposure" : "record"}
      >
        {finding.rated ? `${finding.rated} rated · ` : ""}
        {finding.kind === "absence"
          ? "Record gap"
          : finding.kind === "exposure"
            ? "Exposure"
            : "Established"}
      </span>
      <p className={styles.signalSummary}>{cxoText(finding.claim)}</p>
      <div className={styles.signalFooter}>
        <small>{cxoText(finding.owner)}</small>
        <button
          className={styles.textButton}
          onClick={() =>
            inspect({
              title: "Finding basis",
              text: cxoText(finding.claim),
              basis: `${cxoText(finding.because)}${finding.trace ? ` Rule: ${finding.trace.rule}. Grain: ${finding.trace.grain}. File hint is not verified lineage.` : ""}`,
            })
          }
        >
          Why this fires
        </button>
      </div>
      {canOpen && (
        <Link
          className={styles.textButton}
          href={href(
            `tech:${finding.openRows!.objectType}` as CanvasView,
            "overview",
            finding.openRows!.filter,
          )}
          scroll={false}
          prefetch={false}
        >
          {finding.openRows!.filter ? "Open matching record" : "Open record family"}
        </Link>
      )}
    </article>
  );
}

function PriorityList({
  priorities,
  inspect,
}: {
  priorities: ReturnType<typeof canvasBusiness>["priorities"];
  inspect: (detail: CanvasInspection) => void;
}) {
  return (
    <div style={{ marginTop: 23 }}>
      <h3>Declared priorities</h3>
      {priorities.length ? (
        <>
          <ol className={styles.list}>
            {priorities.slice(0, 3).map((priority, i) => (
              <li key={`${priority.text}-${i}`}>
                <span className={styles.number}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  {priority.text}
                  {priority.detail && <small>{priority.detail}</small>}
                </span>
                <button
                  className={styles.textButton}
                  onClick={() =>
                    inspect({
                      title: "Declared priority",
                      text: priority.text,
                      evidenceIds: priority.refs.filter((ref) =>
                        ref.startsWith("ctx_"),
                      ),
                      sourceRefs: priority.refs.filter(
                        (ref) => !ref.startsWith("ctx_"),
                      ),
                      basis:
                        "Declared order; not a computed ranking or delivery status.",
                    })
                  }
                >
                  Source
                </button>
              </li>
            ))}
          </ol>
          {priorities.length > 3 && (
            <button
              className={styles.textButton}
              style={{ marginTop: 10 }}
              onClick={() =>
                inspect({
                  title: "All declared priorities",
                  text: priorities
                    .map(
                      (priority, i) =>
                        `${i + 1}. ${priority.text}${priority.detail ? `\n${priority.detail}` : ""}`,
                    )
                    .join("\n\n"),
                  evidenceIds: priorities
                    .flatMap((priority) => priority.refs)
                    .filter((ref) => ref.startsWith("ctx_")),
                  sourceRefs: priorities
                    .flatMap((priority) => priority.refs)
                    .filter((ref) => !ref.startsWith("ctx_")),
                  basis:
                    "Declared order; not a computed ranking or delivery status.",
                })
              }
            >
              All {priorities.length} declared priorities
            </button>
          )}
        </>
      ) : (
        <div className={styles.empty}>
          Priorities are not recorded in this version.
        </div>
      )}
    </div>
  );
}

interface ChartData {
  title: string;
  rows: { label: string; value: number }[];
  unit: string;
  note: string;
  evidenceIds?: string[];
}

function chapterChart(
  chapter: ChapterView,
  bundle: HomeReviewBundle,
  current: boolean,
  tables: TableSpec[],
): ChartData | null {
  const preferred =
    chapter.chapterId === "strategy_value_creation"
      ? tables.find(
          (table) =>
            table.section === "The portfolio" &&
            table.columns.includes("Programs"),
        )
      : chapter.chapterId === "what_needs_attention"
        ? tables.find((table) => table.columns.includes("Risks"))
        : undefined;
  const compiledProgram =
    chapter.chapterId === "strategy_value_creation" &&
    current &&
    !preferred &&
    bundle.thesis.signalPacket.visualDatasets.stalled_programs?.length;
  const deterministic =
    preferred ??
    (compiledProgram
      ? undefined
      : tables.find((table) => table.barColumn && table.rows.length > 0));
  if (deterministic) {
    const column =
      deterministic.barColumn ??
      (chapter.chapterId === "strategy_value_creation" ? "Programs" : "Risks");
    const index = deterministic.columns.indexOf(column);
    if (index >= 0)
      return {
        title: deterministic.caption,
        unit: column,
        note:
          deterministic.note ??
          "Computed from the rows in the record on screen.",
        rows: deterministic.rows
          .map((row) => ({
            label: cxoText(String(row[0])),
            value:
              typeof row[index] === "number"
                ? (row[index] as number)
                : Number(row[index]),
          }))
          .filter((row) => Number.isFinite(row.value) && row.value >= 0),
      };
  }
  if (!current) return null;
  const config: Partial<
    Record<ChapterView["chapterId"], [string, string, string, string, string]>
  > = {
    executive_brief: [
      "stalled_programs",
      "program",
      "pctComplete",
      "Strategic program execution",
      "% complete",
    ],
    strategy_value_creation: [
      "stalled_programs",
      "program",
      "pctComplete",
      "Strategic program execution",
      "% complete",
    ],
    technology_data: [
      "application_landscape_by_function",
      "function",
      "applicationCount",
      "Applications by business function",
      "applications",
    ],
    performance_value: [
      "metric_target_attainment",
      "category",
      "count",
      "Movement toward declared targets",
      "measures",
    ],
    leadership_perspective: [
      "leadership_theme_frequency",
      "theme",
      "leaderCount",
      "Where leadership perspectives differ",
      "leaders raising it",
    ],
    what_needs_attention: [
      "risk_system_concentration",
      "system",
      "riskCount",
      "Rated risks by affected system",
      "risk records",
    ],
  };
  const selected = config[chapter.chapterId];
  if (!selected) return null;
  const [dataset, label, value, title, unit] = selected;
  const sourceRows = bundle.thesis.signalPacket.visualDatasets[dataset];
  if (!Array.isArray(sourceRows)) return null;
  let rows = sourceRows
    .map((row) => ({
      label: cxoText(String(row[label] ?? "Not recorded")),
      value: Number(row[value]),
    }))
    .filter((row) => Number.isFinite(row.value) && row.value >= 0);
  if (chapter.chapterId === "leadership_perspective")
    rows = [...rows].sort((a, b) => a.value - b.value);
  return rows.length
    ? {
        title,
        rows,
        unit,
        note: "Compiled dataset in the aligned record. Not a whole-estate assurance.",
        evidenceIds: chapter.visual_opportunities
          .filter((visual) => visual.dataset_ref === dataset)
          .flatMap((visual) => visual.evidence_ids),
      }
    : null;
}

function ChapterVisual({
  chapter,
  bundle,
  source,
  tables,
  inspect,
}: {
  chapter: ChapterView;
  bundle: HomeReviewBundle;
  source: HomeRecordRenderSource;
  tables: TableSpec[];
  inspect: (detail: CanvasInspection) => void;
}) {
  const business = canvasBusiness(bundle, source);
  if (chapter.chapterId === "our_business")
    return (
      <>
        <h2>How the business creates value</h2>
        {business.revenueMix.length > 0 ? (
          <>
            <div
              className={styles.mix}
              style={
                {
                  "--mix-columns": business.revenueMix
                    .map((item) => `${item.share}fr`)
                    .join(" "),
                } as CSSProperties
              }
              aria-label="Declared revenue composition"
            >
              {business.revenueMix.map((item) => (
                <div className={styles.mixPart} key={item.label}>
                  <strong>{item.share}%</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.signalFooter}>
              <span className={styles.basis}>
                Declared revenue split. No segment dollars inferred.
              </span>
              <button
                className={styles.textButton}
                onClick={() =>
                  inspect({
                    title: "Business model",
                    text: business.businessModel,
                    evidenceIds: business.profileRefs.filter((ref) =>
                      ref.startsWith("ctx_"),
                    ),
                    sourceRefs: business.profileRefs.filter(
                      (ref) => !ref.startsWith("ctx_"),
                    ),
                  })
                }
              >
                Source
              </button>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <strong>Revenue composition is not established</strong>
            {business.businessModel ||
              "No current business-model description is available."}
          </div>
        )}
        {chapter.chapterId === "our_business" && business.businessModel && (
          <div style={{ marginTop: 17 }}>
            <button
              className={styles.textButton}
              onClick={() =>
                inspect({
                  title: "Declared business model",
                  text: business.businessModel,
                  evidenceIds: business.profileRefs.filter((ref) =>
                    ref.startsWith("ctx_"),
                  ),
                  sourceRefs: business.profileRefs.filter(
                    (ref) => !ref.startsWith("ctx_"),
                  ),
                })
              }
            >
              Full business model & composition
            </button>
          </div>
        )}
      </>
    );
  const chart = chapterChart(
    chapter,
    bundle,
    narrativeIsCurrent(source),
    tables,
  );
  if (!chart)
    return (
      <>
        <h2>The evidence landscape</h2>
        <div className={styles.empty}>
          <strong>No quantitative exhibit supported here</strong>The available
          record does not establish a comparable quantitative series for this
          chapter.
        </div>
      </>
    );
  const rows = chart.rows.slice(0, 6);
  return (
    <figure style={{ margin: 0 }}>
      <h2>{chart.title}</h2>
      <div
        className={styles.chart}
        role="img"
        aria-label={`${chart.title}: ${rows.map((row) => `${row.label}, ${row.value} ${chart.unit}`).join("; ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ left: 0, right: 22, top: 4, bottom: 6 }}
            barSize={15}
          >
            <CartesianGrid horizontal={false} stroke="#e5eaec" />
            <XAxis
              type="number"
              domain={chart.unit === "% complete" ? [0, 100] : undefined}
              tickFormatter={
                chart.unit === "% complete" ? (value) => `${value}%` : undefined
              }
              tick={{ fontSize: 10, fill: "#73828b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              tick={{ fontSize: 11, fill: "#53656f" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(label: string) =>
                label.length > 24 ? `${label.slice(0, 22)}...` : label
              }
            />
            <Tooltip
              formatter={(value) => [`${value} ${chart.unit}`, "Recorded"]}
              contentStyle={{
                borderRadius: 4,
                border: "1px solid #d9e2e6",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="value"
              fill="#087c76"
              isAnimationActive={false}
              radius={[0, 3, 3, 0]}
            >
              {chart.unit === "% complete" && (
                <LabelList
                  dataKey="value"
                  position="right"
                  fill="#1b242b"
                  fontSize={10}
                  formatter={(value: unknown) => `${value}%`}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className={styles.basis}>
        {rows.length} of {chart.rows.length} rows shown · {chart.unit}.{" "}
        {chart.note}
      </figcaption>
      <button
        className={styles.textButton}
        style={{ marginTop: 10 }}
        onClick={() =>
          inspect({
            title: chart.title,
            text: chart.rows
              .map((row) => `${row.label}: ${row.value} ${chart.unit}`)
              .join("\n"),
            basis: chart.note,
            evidenceIds: chart.evidenceIds,
          })
        }
      >
        Complete chart data & basis
      </button>
    </figure>
  );
}

function EvidenceCanvas({
  chapter,
  bundle,
  tables,
  findings,
  unsupported,
  contextItems,
  href,
  inspect,
}: {
  chapter: ChapterView;
  bundle: HomeReviewBundle;
  tables: TableSpec[];
  findings: Finding[];
  unsupported: string[];
  contextItems: ReturnType<typeof chapterContext>;
  href: Href;
  inspect: (detail: CanvasInspection) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [page, setPage] = useState(0);
  const table = tables[selected];
  const pageSize = 12;
  const pages = table
    ? Math.max(1, Math.ceil(table.rows.length / pageSize))
    : 1;
  const visible =
    table?.rows.slice(page * pageSize, (page + 1) * pageSize) ?? [];
  const claims = [
    ...chapter.key_insights,
    ...chapter.tensions,
    ...chapter.what_to_watch,
  ];
  return (
    <div className={styles.evidenceGrid}>
      <nav className={styles.evidenceNav} aria-label="Evidence exhibits">
        {tables.map((item, i) => (
          <button
            key={`${item.caption}-${i}`}
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              setPage(0);
            }}
          >
            {item.caption}
          </button>
        ))}
        <button
          aria-pressed={selected === tables.length}
          onClick={() => setSelected(tables.length)}
        >
          Findings ({findings.length})
        </button>
        <button
          aria-pressed={selected === tables.length + 1}
          onClick={() => setSelected(tables.length + 1)}
        >
          Published claim sources ({claims.length})
        </button>
        <button
          aria-pressed={selected === tables.length + 2}
          onClick={() => setSelected(tables.length + 2)}
        >
          Coverage gaps ({unsupported.length})
        </button>
        <button
          aria-pressed={selected === tables.length + 3}
          onClick={() => setSelected(tables.length + 3)}
        >
          Additional on-topic context ({contextItems.length})
        </button>
      </nav>
      <section className={styles.section}>
        {table ? (
          <>
            <div className={styles.tableHeader}>
              <div>
                <h2>{table.caption}</h2>
                <p>
                  {table.rows.length} rows · computed from the record on screen
                </p>
              </div>
              <span className={styles.badge}>Deterministic</span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {table.columns.map((column, i) => (
                      <th key={`${column}-${i}`} scope="col">
                        {cxoText(column)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row, i) => (
                    <tr key={page * pageSize + i}>
                      {row.map((cell, j) => (
                        <td key={j}>
                          {typeof cell === "number"
                            ? cell.toLocaleString("en-US")
                            : cxoText(String(cell))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {table.total && (
                  <tfoot>
                    <tr>
                      {table.total.map((cell, i) => (
                        <td key={i}>
                          {typeof cell === "number"
                            ? cell.toLocaleString("en-US")
                            : cxoText(String(cell))}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className={styles.pager}>
              <span>
                Page {page + 1} of {pages}
              </span>
              <button
                aria-label="Previous table page"
                title="Previous page"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                &lt;
              </button>
              <button
                aria-label="Next table page"
                title="Next page"
                disabled={page + 1 >= pages}
                onClick={() => setPage(page + 1)}
              >
                &gt;
              </button>
            </div>
            {table.note && (
              <p className={styles.basis} style={{ marginTop: 17 }}>
                {cxoText(table.note)}
              </p>
            )}
          </>
        ) : selected === tables.length ? (
          <>
            <h2>Row-derived findings</h2>
            {findings.length ? (
              findings.map((finding) => (
                <FindingSignal
                  key={finding.claim}
                  finding={finding}
                  bundle={bundle}
                  href={href}
                  inspect={inspect}
                />
              ))
            ) : (
              <div className={styles.empty}>
                No deterministic findings are produced for this chapter by the
                rows on screen.
              </div>
            )}
          </>
        ) : selected === tables.length + 1 ? (
          <>
            <h2>Published claim sources</h2>
            {claims.length ? (
              claims.map((claim, i) => (
                <ClaimSignal
                  key={`${claim.statement}-${i}`}
                  claim={claim}
                  bundle={bundle}
                  inspect={inspect}
                />
              ))
            ) : (
              <div className={styles.empty}>
                No published claims for this chapter.
              </div>
            )}
          </>
        ) : selected === tables.length + 3 ? (
          <>
            <h2>Additional context in this record</h2>
            <p className={styles.basis}>
              Compiled facts and signals in the chapter&apos;s subject domains.
              These are not a new narrative or new findings.
            </p>
            {contextItems.length ? (
              <ul className={`${styles.list} ${styles.contextList}`}>
                {contextItems.map((item) => (
                  <li key={item.id}>
                    <span>
                      {interpretationCaveats(item.statement, [item.id], bundle).map((caveat) => (
                        <small key={caveat}>{caveat}</small>
                      ))}
                      {cxoText(item.statement)}
                      <button
                        className={styles.textButton}
                        style={{ display: "block", marginTop: 8 }}
                        onClick={() =>
                          inspect({
                            title: "On-topic record context",
                            text: item.statement,
                            evidenceIds: [item.id],
                            basis: interpretationCaveats(item.statement, [item.id], bundle).join(" "),
                          })
                        }
                      >
                        Read & verify
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                No aligned additional context is supplied. Earlier
                interpretation is not substituted for current evidence.
              </div>
            )}
          </>
        ) : (
          <>
            <h2>Evidence coverage gaps</h2>
            {unsupported.length ? (
              <ul>
                {unsupported.map((gap) => (
                  <li key={gap} style={{ marginBottom: 14 }}>
                    {cxoText(gap)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                No unsupported deterministic views recorded. This is not a
                completeness attestation for the enterprise record.
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export function InspectionEvidence({
  detail,
  bundle,
}: {
  detail: CanvasInspection;
  bundle: HomeReviewBundle;
}) {
  const evidence = resolveEvidence(
    [...new Set(detail.evidenceIds ?? [])],
    bundle.thesis.signalPacket,
  );
  const caveats = interpretationCaveats(detail.text, detail.evidenceIds ?? [], bundle);
  return (
    <>
      {caveats.filter((caveat) => !detail.basis?.includes(caveat)).map((caveat) => (
        <p key={caveat}><small>{caveat}</small></p>
      ))}
      <p style={{ whiteSpace: "pre-line" }}>{detail.text}</p>
      {detail.basis && (
        <p>
          <small>{detail.basis}</small>
        </p>
      )}
      {evidence.map((item) => (
        <section key={item.id}>
          <h3>
            {item.unresolved
              ? "Source mapping needed"
              : item.origin === "signal"
                ? "Recorded signal"
                : "Declared context"}
          </h3>
          {interpretationCaveats(item.statement, [item.id], bundle).map((caveat) => (
            <p key={caveat}><small>{caveat}</small></p>
          ))}
          <p>{cxoText(item.statement)}</p>
          <small>
            {item.evidenceRefs?.length
              ? `${item.evidenceRefs.length} declared source references`
              : "Source-row links are not supplied for this reference."}
          </small>
          {item.evidenceRefs?.length ? (
            <>
              <ul aria-label="Supplied reference identities">
                {[...new Set(item.evidenceRefs)].map((ref) => (
                  <li key={ref} style={{ overflowWrap: "anywhere" }}>{ref}</li>
                ))}
              </ul>
              <small>Compiled reference identities; source-row or document links are not resolved here.</small>
            </>
          ) : null}
        </section>
      ))}
      {detail.sourceRefs?.length ? (
        <>
          <h3>Declared source records</h3>
          <ul>
            {[...new Set(detail.sourceRefs)].map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
