"use client";

// Tab 6 — the executive action memo, organised by who owns the next move.
// Transcribed from `viewActions()` (design line ~1048): five owner columns,
// each a scrolling stack of lane-coloured action cards.
//
// The design hard-codes five roles (CFO / CIO / CDAO / Model Risk Office /
// Procurement & business owners) and sweeps everything else into the last
// column. Here the first four are matched against the mart's `owner_hint` and
// the fifth is the honest remainder — so no governed action can be dropped
// because its owner is not one of five expected strings.

import { formatCount } from "@/lib/tower/command-center/format";
import type {
  TowerActionView,
  TowerCommandCenterView,
} from "@/lib/tower/command-center/types";

import { Dot, ViewHead, cx, laneClass } from "../primitives";
import styles from "../TowerCommandCenter.module.css";

/** The four named columns, each with the owner tokens that route into it. */
const NAMED_COLUMNS: ReadonlyArray<{ label: string; match: RegExp }> = [
  { label: "CFO", match: /\bcfo\b|finance/i },
  { label: "CIO", match: /\bcio\b|technology|\bit\b/i },
  { label: "CDAO", match: /\bcdao\b|\bcdo\b|data|analytics/i },
  {
    label: "Model Risk Office",
    match: /model risk|\bmro\b|risk office|compliance/i,
  },
];

const REMAINDER_LABEL = "Procurement & business owners";

/**
 * Bucket every action into exactly one column. First matching named column
 * wins; everything left over lands in the remainder column, which is why the
 * memo can never silently lose an action.
 */
export function bucketActions(
  actions: readonly TowerActionView[],
): Array<{ label: string; items: TowerActionView[] }> {
  const columns = NAMED_COLUMNS.map((col) => ({
    label: col.label,
    items: [] as TowerActionView[],
  }));
  const remainder: TowerActionView[] = [];

  for (const action of actions) {
    const owner = action.ownerRole ?? "";
    const index = NAMED_COLUMNS.findIndex((col) => col.match.test(owner));
    if (index >= 0) columns[index].items.push(action);
    else remainder.push(action);
  }

  return [...columns, { label: REMAINDER_LABEL, items: remainder }];
}

export function RecommendedActionsView({
  view,
  onOpenAction,
}: {
  view: TowerCommandCenterView;
  onOpenAction: (id: string) => void;
}) {
  const columns = bucketActions(view.actions);
  const totalActionCount = view.actions.length;
  const currentPriorityActionCount = view.gaps.length;
  const groupedCampaignCount = view.evidenceMaturity.interventions.length;

  return (
    <div className={styles.view}>
      <ViewHead
        title="Routeable action queue"
        sub="Owner, evidence package, due window, and module handoff required before Tower recommends scale, freeze, stop or fund"
        hint="Click any action to review & route"
      />

      <div className={styles.zipContractNote}>
        <Dot tone="amber" />
        <span>
          North Star read: {formatCount(totalActionCount)} total evidence
          actions are consolidated into {formatCount(groupedCampaignCount)}{" "}
          grouped action campaigns, with{" "}
          {formatCount(currentPriorityActionCount)} current priority actions in
          the CFO proof queue.
        </span>
      </div>

      <section
        className={styles.actionCountStrip}
        aria-label="Recommended action count definitions"
      >
        <span>
          <b>{formatCount(totalActionCount)}</b>
          total evidence actions
        </span>
        <span>
          <b>{formatCount(currentPriorityActionCount)}</b>
          current priority actions
        </span>
        <span>
          <b>{formatCount(groupedCampaignCount)}</b>
          grouped action campaigns
        </span>
      </section>

      <section className={styles.interventionMemo}>
        {view.evidenceMaturity.interventions.map((item) => (
          <article key={item.id}>
            <div className={styles.eyebrow2}>{item.ownerRole}</div>
            <h3>{item.title}</h3>
            <p>{item.why}</p>
            <b>{item.nextAction}</b>
          </article>
        ))}
      </section>

      {view.actions.length === 0 ? (
        <div className={styles.emptyPanel}>
          <h2>No recommended actions</h2>
          <p>
            The Tower value model records no CXO actions for this tenant.
            Actions appear once the projection job writes them; nothing is
            generated here.
          </p>
        </div>
      ) : (
        <div className={styles.owncols}>
          {columns.map((column) => (
            <section
              key={column.label}
              className={styles.owncol}
              aria-label={column.label}
            >
              <header className={styles.ocHead}>
                <div className={styles.ocRole}>{column.label}</div>
                <div className={styles.ocCnt}>
                  {formatCount(column.items.length)} action
                  {column.items.length === 1 ? "" : "s"}
                </div>
              </header>
              <div className={styles.ocBody}>
                {column.items.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={cx(styles.acard, laneClass(action.lane))}
                    onClick={() => onOpenAction(action.id)}
                  >
                    <span className={styles.ak}>{action.lane}</span>
                    <span className={styles.at}>{action.title}</span>
                    <span className={styles.adue}>
                      <Dot
                        tone={
                          action.lane === "fund"
                            ? "teal"
                            : action.lane === "fix"
                              ? "amber"
                              : "red"
                        }
                      />
                      {action.due ?? "No due window recorded"}
                    </span>
                    {action.moduleHandoff ? (
                      <span className={styles.alink}>
                        Routes to · <b>{action.moduleHandoff}</b>
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
