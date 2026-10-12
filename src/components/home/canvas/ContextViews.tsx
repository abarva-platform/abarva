"use client";

import { useState } from "react";
import type {
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";
import { cxoText } from "../v4/cxo-language";
import { leadershipContext, operatingContext } from "./context-coverage";
import type { CanvasInspection } from "./ChapterCanvas";
import styles from "./HomeCanvas.module.css";

type Inspect = (detail: CanvasInspection) => void;

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
  const [theme, setTheme] = useState("");
  const [order, setOrder] = useState("shared");
  const themes = [...context.themes].sort((a, b) =>
    order === "shared"
      ? b.count - a.count || a.name.localeCompare(b.name)
      : a.count - b.count || a.name.localeCompare(b.name),
  );
  const excerpts = context.excerpts.filter(
    (item) => !theme || item.theme === theme,
  );
  const roles = new Set(context.excerpts.map((item) => item.role));
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
      title: cxoText(item.theme),
      text: item.text,
      basis: `${item.role}\n${item.basis}\n${context.basis}`,
      evidenceIds: item.evidenceIds,
      sourceRefs: item.sourceRefs,
    });
  return (
    <div
      className={styles.overview}
      data-leadership-context
      data-canvas-overview="leadership_perspective"
    >
      <div className={styles.notice}>
        {bundle.declaredSyntheticDemo
          ? "Synthetic reference. These excerpts are not client-attested testimony. "
          : "Each excerpt carries its recorded response basis. "}
        {context.basis}
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <strong>
            {context.available ? context.themes.length : "Not supplied"}
          </strong>
          <span>Recorded themes</span>
          <small>Not a new model-generated categorization</small>
        </div>
        <div className={styles.metric}>
          <strong>
            {context.available ? context.excerpts.length : "Not supplied"}
          </strong>
          <span>Supplied excerpts</span>
          <small>Not the full interview corpus</small>
        </div>
        <div className={styles.metric}>
          <strong>{context.available ? roles.size : "Not supplied"}</strong>
          <span>Roles in supplied excerpts</span>
          <small>Not the number interviewed</small>
        </div>
        <div className={styles.metric}>
          <strong>
            {themes.length
              ? Math.max(...themes.map((item) => item.count))
              : "Not supplied"}
          </strong>
          <span>Widest theme reach</span>
          <small>
            {themes[0]?.unit ?? "Breadth not established"}; not a response count
          </small>
        </div>
      </div>
      <div className={styles.split}>
        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <h2>What leadership is talking about</h2>
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
                <strong>{item.count}</strong>
                <small>{item.unit} raising this theme</small>
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
                      `${cxoText(item.name)}: ${item.count} ${item.unit}`,
                  )
                  .join("\n"),
                basis: context.basis,
              })
            }
          >
            All {themes.length} themes & basis
          </button>
          <p className={styles.basis} style={{ marginTop: 16 }}>
            Shared attention is not the same as agreement on a solution.
            Minority attention does not establish disagreement.
          </p>
        </section>
        <section className={styles.section}>
          <h2>{theme ? cxoText(theme) : "Voices behind the themes"}</h2>
          {visibleExcerpts.map((item, i) => (
            <article className={styles.quote} key={`${item.theme}-${i}`}>
              <span className={styles.eyebrow}>{cxoText(item.theme)}</span>
              <blockquote>{item.text}</blockquote>
              <strong>{item.role}</strong>
              <small>{item.basis}</small>
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
          {excerpts.length > 3 && (
            <button
              className={styles.textButton}
              onClick={() =>
                inspect({
                  title: theme ? cxoText(theme) : "All supplied excerpts",
                  text: excerpts
                    .map(
                      (item) =>
                        `${cxoText(item.theme)}\n${item.text}\n${item.role}\n${item.basis}`,
                    )
                    .join("\n\n"),
                  basis: context.basis,
                  evidenceIds: excerpts.flatMap((item) => item.evidenceIds),
                  sourceRefs: excerpts.flatMap((item) => item.sourceRefs),
                })
              }
            >
              All {excerpts.length} supplied excerpts
            </button>
          )}
          {roles.size === 1 && context.excerpts.length > 1 && (
            <p className={styles.basis}>
              The supplied quote selection represents one role. It is not a
              balanced leadership-voice sample.
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
  const [selected, setSelected] = useState(context.segments[0]?.key ?? "");
  const [functionPage, setFunctionPage] = useState(0);
  const segment = context.segments.find((item) => item.key === selected);
  const pageCount = Math.max(
    1,
    Math.ceil((segment?.functions.length ?? 0) / 3),
  );
  const activePage = Math.min(functionPage, pageCount - 1);
  const visibleFunctions =
    segment?.functions.slice(activePage * 3, activePage * 3 + 3) ?? [];
  const segmentFacts = segment
    ? [
        ["Recorded accountable role", segment.owner],
        ["Governance forum", segment.governance],
        ["Regulatory context", segment.regulation],
      ].filter(([, value]) => value)
    : [];
  const linkedFunctions = context.segments.flatMap((item) => item.functions);
  return (
    <div
      className={styles.overview}
      data-operating-context
      data-canvas-overview="how_we_operate"
    >
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <strong>{context.segments.length || "Not supplied"}</strong>
          <span>Declared operating segments</span>
          <small>Named in this record</small>
        </div>
        <div className={styles.metric}>
          <strong>
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
          <strong>
            {context.hasDeclaredMapping
              ? context.segmentsWithDetail
              : context.accountabilityAvailable
                ? context.accountability.length
                : "Not supplied"}
          </strong>
          <span>
            {context.hasDeclaredMapping
              ? "Segments with operating detail"
              : "Functions named by systems"}
          </span>
          <small>
            {context.hasDeclaredMapping
              ? "Roles, governance or functions recorded"
              : "System accountability, not the org chart"}
          </small>
        </div>
        <div className={styles.metric}>
          <strong>
            {context.hasDeclaredMapping
              ? linkedFunctions.filter((fn) => fn.capabilities).length
              : context.signalsAvailable
                ? context.signals.length
                : "Not supplied"}
          </strong>
          <span>
            {context.hasDeclaredMapping
              ? "Functions with capabilities"
              : "Workforce & process signals"}
          </span>
          <small>
            {context.hasDeclaredMapping
              ? "What the functions do, as recorded"
              : "Aligned compiled context"}
          </small>
        </div>
      </div>
      <div className={styles.split}>
        <section className={styles.section}>
          <h2>How the enterprise is organized</h2>
          <label className={styles.contextSelect}>
            Operating segment{" "}
            <select
              aria-label="Operating segment"
              value={selected}
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
              {segmentFacts.length < 3 && (
                <p className={styles.basis}>
                  {segmentFacts.length === 0
                    ? "Only the segment name is supplied in this record. Its accountable role, governance and regulatory detail are not supplied."
                    : "Some accountability or governance detail is not supplied in this record."}
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
                    text: `P&L owner: ${segment.owner ?? "Not supplied"}\nGovernance: ${segment.governance || "Not supplied"}\nRegulatory context: ${segment.regulation || "Not supplied"}\n${segment.functions.map((fn) => `${fn.name}: ${fn.owner ?? "Owner not supplied"}`).join("\n")}`,
                    sourceRefs: [
                      ...segment.sourceRefs,
                      ...segment.functions.flatMap((fn) => fn.sourceRefs),
                    ],
                    evidenceIds: segment.evidenceIds,
                    basis: context.hasDeclaredMapping
                      ? "Recorded segment keys and source-linked functions. No name-inferred membership."
                      : "Declared segment name only; no detailed organization rows supplied.",
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
        </section>
        <section className={styles.section}>
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
                            basis:
                              "Function record with a declared segment key. Budget and FTE are recorded inputs, not a performance measure. No name-inferred membership.",
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
          <details
            open={!segment?.functions.length}
            className={styles.operatingSecondary}
          >
            <summary>System accountability & operating signals</summary>
            <h2>Recorded system accountability</h2>
            <p className={styles.basis}>
              Roles named on application records. These are not inferred segment
              or P&L owners.
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
                    basis:
                      "Grouped on the application register's businessFunction field; roles retained exactly as recorded. Not segment attribution or an organization hierarchy.",
                    sourceRefs: context.accountability.flatMap(
                      (group) => group.sourceRefs,
                    ),
                  })
                }
              >
                All {context.accountability.length} recorded functions
              </button>
            )}
            <h3 style={{ marginTop: 24 }}>How work gets done</h3>
            <ul className={`${styles.list} ${styles.contextList}`}>
              {context.signals.slice(0, 3).map((signal) => (
                <li key={signal.id}>
                  <span>
                    {signal.statement}
                    <button
                      className={styles.textButton}
                      style={{ display: "block", marginTop: 7 }}
                      onClick={() =>
                        inspect({
                          title: "Workforce / process context",
                          text: signal.statement,
                          evidenceIds: [signal.id],
                        })
                      }
                    >
                      Source
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            {context.signals.length > 3 && (
              <button
                className={styles.textButton}
                style={{ marginTop: 12 }}
                onClick={() =>
                  inspect({
                    title: "Workforce and operating-process context",
                    text: context.signals
                      .map((signal) => signal.statement)
                      .join("\n\n"),
                    evidenceIds: context.signals.map((signal) => signal.id),
                    basis:
                      "Compiled signals from the aligned record. Not allocated to operating segments without declared links.",
                  })
                }
              >
                All {context.signals.length} workforce & process signals
              </button>
            )}
          </details>
        </section>
      </div>
    </div>
  );
}
