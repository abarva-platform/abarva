"use client";

import { useState } from "react";
import type {
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";
import { homeRecordSourceLabel } from "@/lib/home/preview/record-source";
import { cxoText } from "../v4/cxo-language";
import {
  chapterContext,
  leadershipContext,
  operatingContext,
  type LeadershipExcerpt,
} from "./context-coverage";
import type { CanvasInspection } from "./ChapterCanvas";
import styles from "./HomeCanvas.module.css";

type Inspect = (detail: CanvasInspection) => void;

const recordBasis = (source: HomeRecordRenderSource) =>
  `${homeRecordSourceLabel(source)} on screen.`;

function distinctExcerpts(excerpts: LeadershipExcerpt[]) {
  const distinct = new Map<
    string,
    LeadershipExcerpt & { themes: string[]; suppliedCount: number }
  >();
  for (const excerpt of excerpts) {
    // Keep different roles and response bases separate even when wording matches.
    const key = JSON.stringify([
      excerpt.text.trim().replace(/\s+/g, " "),
      excerpt.role,
      excerpt.basis,
    ]);
    const previous = distinct.get(key);
    if (previous) {
      previous.themes = [...new Set([...previous.themes, excerpt.theme])];
      previous.evidenceIds = [
        ...new Set([...previous.evidenceIds, ...excerpt.evidenceIds]),
      ];
      previous.sourceRefs = [
        ...new Set([...previous.sourceRefs, ...excerpt.sourceRefs]),
      ];
      previous.suppliedCount++;
    } else {
      distinct.set(key, {
        ...excerpt,
        evidenceIds: [...new Set(excerpt.evidenceIds)],
        sourceRefs: [...new Set(excerpt.sourceRefs)],
        themes: [excerpt.theme],
        suppliedCount: 1,
      });
    }
  }
  return [...distinct.values()];
}

export function LeadershipCanvas({
  bundle,
  source,
  inspect,
}: {
  bundle: HomeReviewBundle;
  source: HomeRecordRenderSource;
  inspect: Inspect;
}) {
  const context = leadershipContext(bundle, source);
  const distinct = distinctExcerpts(context.excerpts);
  const basis = `${recordBasis(source)} ${context.basis}${
    bundle.declaredSyntheticDemo
      ? " Synthetic reference. These excerpts are not client-attested testimony."
      : ""
  }`;
  const excerptBasis = (item: LeadershipExcerpt) =>
    `${item.basis}${
      bundle.declaredSyntheticDemo && !/synthetic/i.test(item.basis)
        ? " - synthetic reference, not client testimony"
        : ""
    }${
      item.basis === "Attributed response"
        ? "; transcript verification not supplied"
        : ""
    }`;
  const [theme, setTheme] = useState("");
  const [order, setOrder] = useState("shared");
  const themes = [...context.themes].sort((a, b) =>
    order === "shared"
      ? b.count - a.count || a.name.localeCompare(b.name)
      : a.count - b.count || a.name.localeCompare(b.name),
  );
  const excerpts = distinct.filter(
    (item) => !theme || item.themes.includes(theme),
  );
  const roles = new Set(
    context.excerpts
      .map((item) => item.role)
      .filter((role) => role !== "Role not recorded"),
  );
  const selectedRoles = new Set<string>();
  const roleVariety = excerpts.filter((item) => {
    if (selectedRoles.has(item.role)) return false;
    selectedRoles.add(item.role);
    return true;
  });
  const visibleExcerpts = theme
    ? excerpts.slice(0, 3)
    : [
        ...roleVariety,
        ...excerpts.filter((item) => !roleVariety.includes(item)),
      ].slice(0, 3);
  const inspectExcerpt = (item: (typeof excerpts)[number]) =>
    inspect({
      title: item.themes.map(cxoText).join("; "),
      text: item.text,
      basis: `${item.role}\n${excerptBasis(item)}\n${item.suppliedCount} supplied excerpt reference(s); repeated wording combined.\n${basis}`,
      evidenceIds: item.evidenceIds,
      sourceRefs: item.sourceRefs,
    });
  const suppliedExcerptCount = theme
    ? context.excerpts.filter((item) => item.theme === theme).length
    : context.excerpts.length;
  const themeReach = (item: (typeof themes)[number]) =>
    item.count === 0 && item.unit === "executive areas" ? null : item.count;
  const widestTheme = themes
    .filter((item) => themeReach(item) !== null)
    .reduce(
      (widest, item) => (!widest || item.count > widest.count ? item : widest),
      undefined as (typeof themes)[number] | undefined,
    );
  return (
    <div
      className={styles.overview}
      data-leadership-context
      data-canvas-overview="leadership_perspective"
    >
      <div className={styles.notice}>
        {basis}
        {!bundle.declaredSyntheticDemo &&
          " Each excerpt carries its recorded response basis."}
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <strong data-unknown={!context.themes.length}>
            {context.themes.length || "Not supplied"}
          </strong>
          <span>Recorded themes</span>
          <small>Not a new model-generated categorization</small>
        </div>
        <div className={styles.metric}>
          <strong data-unknown={!context.excerpts.length}>
            {context.excerpts.length || "Not supplied"}
          </strong>
          <span>Supplied excerpts</span>
          <small>
            {distinct.length
              ? `${distinct.length} distinct excerpts; not the full interview corpus`
              : "Excerpt detail not supplied; not the full interview corpus"}
          </small>
        </div>
        <div className={styles.metric}>
          <strong data-unknown={!roles.size}>
            {roles.size || "Not supplied"}
          </strong>
          <span>Roles in supplied excerpts</span>
          <small>Not the number interviewed</small>
        </div>
        <div className={styles.metric}>
          <strong data-unknown={!widestTheme}>
            {widestTheme?.count ?? "Not supplied"}
          </strong>
          <span>Widest theme reach</span>
          <small>
            {widestTheme?.unit ?? "Breadth not established"}; not a response
            count
          </small>
        </div>
      </div>
      <div className={styles.split}>
        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <h2>Recorded leadership themes</h2>
            <label className={styles.basis}>
              Theme order{" "}
              <select
                value={order}
                onChange={(event) => setOrder(event.target.value)}
              >
                <option value="shared">Most widely raised</option>
                <option value="minority">Least widely raised</option>
              </select>
            </label>
          </div>
          <div className={styles.themeGrid}>
            {themes.slice(0, 6).map((item) => (
              <button
                key={item.name}
                className={styles.themeItem}
                aria-pressed={theme === item.name}
                onClick={() => setTheme(item.name)}
              >
                <span>{cxoText(item.name)}</span>
                <strong>{themeReach(item) ?? "Not supplied"}</strong>
                <small>
                  {themeReach(item) !== null
                    ? `${item.unit} in the recorded theme summary`
                    : "Theme breadth not established"}
                </small>
              </button>
            ))}
          </div>
          {!themes.length && (
            <div className={styles.empty}>
              Current theme detail is not supplied in this bundle.
            </div>
          )}
          <label className={styles.contextSelect}>
            Theme{" "}
            <select
              aria-label="Leadership theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
            >
              <option value="">All themes</option>
              {[
                ...new Set([
                  ...themes.map((item) => item.name),
                  ...context.excerpts.map((item) => item.theme),
                ]),
              ].map((name) => (
                <option key={name} value={name}>
                  {cxoText(name)}
                </option>
              ))}
            </select>
          </label>
          <button
            className={styles.textButton}
            onClick={() =>
              inspect({
                title: "Recorded leadership themes",
                text: themes
                  .map(
                    (item) =>
                      `${cxoText(item.name)}: ${themeReach(item) !== null ? `${item.count} ${item.unit}` : "Breadth not supplied"}`,
                  )
                  .join("\n"),
                basis,
              })
            }
          >
            {themes.length
              ? `All ${themes.length} themes & basis`
              : "Theme coverage basis"}
          </button>
          <p className={styles.basis} style={{ marginTop: 16 }}>
            Shared attention is not the same as agreement on a solution.
            Minority attention does not establish disagreement.
          </p>
        </section>
        <section className={styles.section}>
          <h2>{theme ? cxoText(theme) : "Excerpts behind the themes"}</h2>
          {visibleExcerpts.map((item, i) => (
            <article className={styles.quote} key={`${item.theme}-${i}`}>
              <span className={styles.eyebrow}>
                {item.themes.map(cxoText).join("; ")}
              </span>
              <blockquote>{item.text}</blockquote>
              <strong>
                {bundle.declaredSyntheticDemo
                  ? "Illustrative role: "
                  : "Recorded role: "}
                {item.role}
              </strong>
              <small>{excerptBasis(item)}</small>
              {item.suppliedCount > 1 && (
                <small>
                  Repeated in {item.suppliedCount} supplied excerpts; references
                  retained
                </small>
              )}
              <button
                className={styles.textButton}
                onClick={() => inspectExcerpt(item)}
              >
                Read & verify excerpt
              </button>
            </article>
          ))}
          {!excerpts.length && (
            <div className={styles.empty}>
              No excerpt for this theme is supplied. Theme breadth does not
              provide the missing wording.
            </div>
          )}
          {(excerpts.length > 3 || suppliedExcerptCount > excerpts.length) && (
            <button
              className={styles.textButton}
              onClick={() =>
                inspect({
                  title: theme ? cxoText(theme) : "All supplied excerpts",
                  text: excerpts
                    .map(
                      (item) =>
                        `${item.themes.map(cxoText).join("; ")}\n${item.text}\n${item.role}\n${excerptBasis(item)}\n${item.suppliedCount} supplied excerpt reference(s)`,
                    )
                    .join("\n\n"),
                  basis: `${basis} ${excerpts.length} distinct excerpts; repeated wording combined with all references retained.`,
                  evidenceIds: [
                    ...new Set(excerpts.flatMap((item) => item.evidenceIds)),
                  ],
                  sourceRefs: [
                    ...new Set(excerpts.flatMap((item) => item.sourceRefs)),
                  ],
                })
              }
            >
              All {suppliedExcerptCount} supplied excerpts
            </button>
          )}
          {roles.size === 1 && context.excerpts.length > 1 && (
            <p className={styles.basis}>
              Only one named role is represented in the supplied quote
              selection. This is not a balanced leadership-voice sample.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export function OperatingCanvas({
  bundle,
  source,
  inspect,
}: {
  bundle: HomeReviewBundle;
  source: HomeRecordRenderSource;
  inspect: Inspect;
}) {
  const context = operatingContext(bundle, source);
  const basis = `${recordBasis(source)}${bundle.declaredSyntheticDemo ? " Synthetic reference." : ""}`;
  const operatingFacts = chapterContext(
    bundle,
    source,
    "how_we_operate",
  ).filter(
    (item) =>
      !("kind" in item) && !item.statement.startsWith("Operating segments:"),
  );
  const [selected, setSelected] = useState(context.segments[0]?.key ?? "");
  const [functionPage, setFunctionPage] = useState(0);
  const segment =
    context.segments.find((item) => item.key === selected) ??
    context.segments[0];
  const pageCount = Math.max(
    1,
    Math.ceil((segment?.functions.length ?? 0) / 3),
  );
  const activePage = Math.min(functionPage, pageCount - 1);
  const visibleFunctions =
    segment?.functions.slice(activePage * 3, activePage * 3 + 3) ?? [];
  const segmentFacts = segment
    ? [
        ["Recorded P&L owner", segment.owner || "Not supplied"],
        ["Governance forum", segment.governance || "Not supplied"],
        ["Regulatory context", segment.regulation || "Not supplied"],
      ]
    : [];
  const signalBasis = `${basis} Compiled workforce/process context, not inspectable process rows or a complete operating model. No segment assignment without declared links.`;
  return (
    <div
      className={styles.overview}
      data-operating-context
      data-canvas-overview="how_we_operate"
    >
      <div className={styles.notice}>
        {basis} Declared segments and supplied workforce/process context are
        shown below. Organization, P&L accountability and governance are only
        established where recorded; application ownership does not fill those
        gaps.
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <strong data-unknown={!context.segments.length}>
            {context.segments.length || "Not supplied"}
          </strong>
          <span>Declared operating segments</span>
          <small>Named in this record</small>
        </div>
        <div className={styles.metric}>
          <strong data-unknown={!context.hasDeclaredMapping}>
            {context.hasDeclaredMapping
              ? context.segments.reduce(
                  (sum, item) => sum + item.functions.length,
                  0,
                )
              : "Not supplied"}
          </strong>
          <span>Segment-linked functions</span>
          <small>No assignment inferred from a name</small>
        </div>
        <div className={styles.metric}>
          <strong data-unknown={!context.segmentsWithDetail}>
            {context.segmentsWithDetail || "Not supplied"}
          </strong>
          <span>Segments with operating detail</span>
          <small>Any recorded role, governance, context or function link</small>
        </div>
        <div className={styles.metric}>
          <strong data-unknown={!context.signals.length}>
            {context.signals.length || "Not supplied"}
          </strong>
          <span>Workforce & process signals</span>
          <small>Compiled context, not process detail rows</small>
        </div>
      </div>
      <div className={styles.split}>
        <section className={styles.section}>
          <h2>Declared operating structure</h2>
          {context.segments.length > 0 && (
            <label className={styles.contextSelect}>
              Operating segment{" "}
              <select
                aria-label="Operating segment"
                value={segment?.key ?? ""}
                onChange={(event) => {
                  setSelected(event.target.value);
                  setFunctionPage(0);
                }}
              >
                {context.segments.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {segment ? (
            <>
              <h3>{segment.name}</h3>
              {segment.description && (
                <p className={styles.segmentDescription}>
                  {segment.description}
                </p>
              )}
              {segmentFacts.length > 0 && (
                <dl className={styles.segmentFacts}>
                  {segmentFacts.map(([label, value]) => (
                    <div className={styles.segmentFact} key={label!}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {(!segment.owner ||
                !segment.governance ||
                !segment.regulation) && (
                <p className={styles.basis}>
                  Missing fields are unknown. A segment name does not establish
                  its accountability, governance or regulatory context.
                </p>
              )}
              {!segment.functions.length && (
                <div className={styles.notice}>
                  This bundle names the segment but supplies no
                  function-to-segment links for it. Functions below are not
                  assigned to this segment by assumption.
                </div>
              )}
              <button
                className={styles.textButton}
                style={{ marginTop: 14 }}
                onClick={() =>
                  inspect({
                    title: segment.name,
                    text: `P&L owner: ${segment.owner || "Not supplied"}\nGovernance: ${segment.governance || "Not supplied"}\nRegulatory context: ${segment.regulation || "Not supplied"}\nOperating context: ${segment.description || "Not supplied"}\nFunction-to-segment links: ${segment.functions.length ? segment.functions.map((fn) => `${fn.name}: ${fn.owner || "Owner not supplied"}`).join("\n") : "Not supplied"}`,
                    sourceRefs: [
                      ...segment.sourceRefs,
                      ...segment.functions.flatMap((fn) => fn.sourceRefs),
                    ],
                    evidenceIds: segment.evidenceIds,
                    basis: `${basis} ${
                      segment.functions.length
                        ? "Recorded segment keys and source-linked functions. No name-inferred membership."
                        : "No function-to-segment links supplied for this segment. Application owners are not segment or P&L owners."
                    }`,
                  })
                }
              >
                Segment evidence
              </button>
            </>
          ) : (
            <div className={styles.empty}>
              Operating-segment detail is not supplied in the current bundle.
            </div>
          )}
          {context.unlinkedFunctions > 0 && (
            <p className={styles.basis}>
              {context.unlinkedFunctions} supplied function rows have no link to
              a declared segment. Their membership is not inferred.
            </p>
          )}
        </section>
        <section className={styles.section}>
          <h2>Workforce & process context</h2>
          <p className={styles.basis}>
            {signalBasis} Compiled references do not establish source-row
            verification, human attestation or data currency.
          </p>
          <ul className={`${styles.list} ${styles.contextList}`}>
            {[...operatingFacts, ...context.signals].slice(0, 3).map((item) => (
              <li key={item.id}>
                <span>
                  {item.statement}
                  <button
                    className={styles.textButton}
                    style={{ display: "block", marginTop: 7 }}
                    onClick={() =>
                      inspect({
                        title: "Workforce / process context",
                        text: item.statement,
                        evidenceIds: [item.id],
                        basis: signalBasis,
                      })
                    }
                  >
                    Context basis
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {!operatingFacts.length && !context.signals.length && (
            <div className={styles.empty}>
              Aligned workforce/process context is not supplied in this bundle.
              Application records do not establish how work is performed.
            </div>
          )}
          {operatingFacts.length + context.signals.length > 3 && (
            <button
              className={styles.textButton}
              style={{ marginTop: 12 }}
              onClick={() =>
                inspect({
                  title: "Workforce and operating-process context",
                  text: [...operatingFacts, ...context.signals]
                    .map((item) => item.statement)
                    .join("\n\n"),
                  evidenceIds: [...operatingFacts, ...context.signals].map(
                    (item) => item.id,
                  ),
                  basis: signalBasis,
                })
              }
            >
              All {operatingFacts.length + context.signals.length} workforce &
              process {operatingFacts.length ? "context items" : "signals"}
            </button>
          )}
          {segment && segment.functions.length > 0 && (
            <>
              <h2>What this segment does</h2>
              <p className={styles.basis}>
                Business functions linked by a declared segment key. Accountable
                roles are retained as recorded.
              </p>
              <ul
                className={`${styles.list} ${styles.contextList}`}
                data-segment-functions
              >
                {visibleFunctions.map((fn) => (
                  <li key={fn.name}>
                    <span>
                      <strong>{fn.name}</strong>
                      <small>
                        {fn.owner || "Accountable role not supplied"}
                      </small>
                      {fn.capabilities ? (
                        <p className={styles.functionCapabilities}>
                          {fn.capabilities}
                        </p>
                      ) : (
                        <small>Business capabilities not supplied</small>
                      )}
                      <button
                        className={styles.textButton}
                        onClick={() =>
                          inspect({
                            title: fn.name,
                            text: `Accountable role: ${fn.owner || "Not supplied"}\nCapabilities: ${fn.capabilities || "Not supplied"}\nParent function: ${fn.parent || "Not supplied"}\nFTE: ${fn.fte ?? "Not supplied"}\nDeclared annual budget: ${fn.budget ?? "Not supplied"}`,
                            sourceRefs: fn.sourceRefs,
                            basis: `${basis} Function record with a declared segment key. Budget and FTE are recorded inputs, not a performance measure. No name-inferred membership.`,
                          })
                        }
                      >
                        Function evidence
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              {pageCount > 1 && (
                <div className={styles.pager}>
                  <span>
                    Functions {activePage * 3 + 1}-
                    {Math.min((activePage + 1) * 3, segment.functions.length)}{" "}
                    of {segment.functions.length}
                  </span>
                  <button
                    aria-label="Previous function page"
                    disabled={activePage === 0}
                    onClick={() => setFunctionPage(activePage - 1)}
                  >
                    &lt;
                  </button>
                  <button
                    aria-label="Next function page"
                    disabled={activePage === pageCount - 1}
                    onClick={() => setFunctionPage(activePage + 1)}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <section className={styles.section}>
        <details className={styles.operatingSecondary}>
          <summary>System accountability (application register)</summary>
          <h2>Recorded system accountability</h2>
          <p className={styles.basis}>
            {basis} Roles named on application records, grouped by the recorded
            business-function field. These are system accountability, not an
            organization hierarchy, segment membership, P&L ownership or
            governance authority.
          </p>
          <ul className={`${styles.list} ${styles.contextList}`}>
            {context.accountability.slice(0, 4).map((group) => (
              <li key={group.name}>
                <span>
                  <strong>{group.name}</strong>
                  <small>{group.count} application records</small>
                  <small>
                    Business:{" "}
                    {[...group.businessOwners].join("; ") || "Not supplied"}
                  </small>
                  <small>
                    Technology:{" "}
                    {[...group.technologyOwners].join("; ") || "Not supplied"}
                  </small>
                  <button
                    className={styles.textButton}
                    onClick={() =>
                      inspect({
                        title: `${group.name}: system accountability`,
                        text: `${group.count} application records\nBusiness owners: ${[...group.businessOwners].join("; ") || "Not supplied"}\nTechnology owners: ${[...group.technologyOwners].join("; ") || "Not supplied"}`,
                        sourceRefs: [...new Set(group.sourceRefs)],
                        basis: `${basis} Roles recorded on application rows. Not segment attribution, P&L ownership or an organization hierarchy. Source references do not establish human attestation.`,
                      })
                    }
                  >
                    Application accountability basis
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {context.accountability.length > 4 && (
            <button
              className={styles.textButton}
              style={{ marginTop: 12 }}
              onClick={() =>
                inspect({
                  title: "System accountability by recorded function",
                  text: context.accountability
                    .map(
                      (group) =>
                        `${group.name}: ${group.count} applications\nBusiness owners: ${[...group.businessOwners].join("; ") || "Not supplied"}\nTechnology owners: ${[...group.technologyOwners].join("; ") || "Not supplied"}`,
                    )
                    .join("\n\n"),
                  basis: `${basis} Grouped on the application register's businessFunction field; roles retained exactly as recorded. Not segment attribution, P&L ownership or an organization hierarchy.`,
                  sourceRefs: context.accountability.flatMap(
                    (group) => group.sourceRefs,
                  ),
                })
              }
            >
              All {context.accountability.length} recorded functions
            </button>
          )}
          {!context.accountability.length && (
            <div className={styles.empty}>
              System accountability detail is not supplied in this bundle.
            </div>
          )}
        </details>
      </section>
    </div>
  );
}
