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

import { useState } from "react";

import { formatCount } from "@/lib/tower/command-center/format";
import type {
  TowerActionView,
  TowerCommandCenterView,
  TowerInterventionLane,
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
const ACTIONS_PER_OWNER_COLUMN = 4;

const CAMPAIGN_META: Record<
  TowerInterventionLane["key"],
  {
    owner: string;
    duePosture: string;
    blockedDecision: string;
    evidencePackage: string;
  }
> = {
  establish_baseline: {
    owner: "Finance / business owners",
    duePosture: "Immediate",
    blockedDecision: "Benefit-case acceptance",
    evidencePackage: "Baseline, target, actual, source row",
  },
  instrument_outcome: {
    owner: "Business process owners",
    duePosture: "This quarter",
    blockedDecision: "Scale or continue",
    evidencePackage: "Operating outcome actuals",
  },
  validate_attribution: {
    owner: "Finance / data owner",
    duePosture: "30 days",
    blockedDecision: "Economic conversion",
    evidencePackage: "Formula, source refs, cost-center mapping",
  },
  complete_guardrails: {
    owner: "Risk / control owner",
    duePosture: "Before scale",
    blockedDecision: "Scale or externalize",
    evidencePackage: "Quality, risk, and policy guardrails",
  },
  obtain_attestation: {
    owner: "Finance / business sponsor",
    duePosture: "Before claim",
    blockedDecision: "Board claim gate",
    evidencePackage: "Finance and business sign-off",
  },
  ready_for_decision: {
    owner: "Executive sponsor",
    duePosture: "When claimable",
    blockedDecision: "Fund, scale, freeze, or stop",
    evidencePackage: "Complete proof packet",
  },
};

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
  const [showInventory, setShowInventory] = useState(false);
  const columns = bucketActions(view.actions);
  const totalActionCount = view.actions.length;
  const currentPriorityActionCount = view.gaps.length;
  const groupedCampaignCount = view.evidenceMaturity.interventionLanes.length;

  return (
    <div className={styles.view}>
      <ViewHead title="Routeable action queue" />

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

      <section
        className={styles.campaignGrid}
        aria-label="Executive proof campaigns"
      >
        {view.evidenceMaturity.interventionLanes.map((item) => {
          const meta = CAMPAIGN_META[item.key];
          return (
            <article
              key={item.key}
              className={cx(
                styles.campaignCard,
                item.tone === "teal" && styles.toneTeal,
                item.tone === "amber" && styles.toneAmber,
                item.tone === "red" && styles.toneRed,
              )}
            >
              <header>
                <div className={styles.eyebrow2}>{meta.owner}</div>
                <strong>
                  {formatCount(item.count)} action{item.count === 1 ? "" : "s"}
                </strong>
              </header>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
              <dl>
                <div>
                  <dt>Due posture</dt>
                  <dd>{meta.duePosture}</dd>
                </div>
                <div>
                  <dt>Decision blocked</dt>
                  <dd>{meta.blockedDecision}</dd>
                </div>
                <div>
                  <dt>Evidence package</dt>
                  <dd>{meta.evidencePackage}</dd>
                </div>
              </dl>
              <b>{item.nextAction}</b>
            </article>
          );
        })}
      </section>

      <div className={styles.inventoryControl}>
        <button
          type="button"
          className={styles.inventoryToggle}
          aria-expanded={showInventory}
          onClick={() => setShowInventory((current) => !current)}
        >
          {showInventory ? "Hide" : "View"} priority action inventory
        </button>
        <span>
          Default view renders the {formatCount(groupedCampaignCount)}{" "}
          campaigns; the governed inventory remains searchable/exportable
          downstream.
        </span>
      </div>

      {showInventory ? (
        view.actions.length === 0 ? (
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
                  {column.items
                    .slice(0, ACTIONS_PER_OWNER_COLUMN)
                    .map((action) => (
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
                  {column.items.length > ACTIONS_PER_OWNER_COLUMN ? (
                    <div className={styles.actionOverflow}>
                      +
                      {formatCount(
                        column.items.length - ACTIONS_PER_OWNER_COLUMN,
                      )}{" "}
                      more retained in the full action inventory
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
