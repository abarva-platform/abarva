"use client";

import { useState } from "react";
import {
  emptyP4RoadmapPlan,
  isP4RoadmapPlanComplete,
  newP4RoadmapMilestone,
  p4RoadmapPlanIssues,
  parseP4RoadmapPlan,
  serializeP4RoadmapPlan,
  type P4RoadmapMilestone,
} from "@/lib/programs/p4-roadmap-plan";
import styles from "./MovesStepPage.module.css";

const cx = (...names: string[]) =>
  names.map((name) => styles[name] ?? name).join(" ");
const FIELDS = [
  ["name", "Milestone name"],
  ["workstream", "Workstream"],
  ["ownerRole", "Owner role"],
  ["plannedWindow", "Planned window"],
  ["timingBasis", "Timing source or assumption reference"],
  ["dependencyNotes", "Dependency notes, including why none apply"],
] as const;

export function P4MilestonePlanEditor({
  value,
  storedValue,
  onChange,
  onSave,
  saved,
  saveError,
}: {
  value: string;
  storedValue: string;
  onChange: (value: string) => void;
  onSave: (value: string) => void;
  saved?: boolean;
  saveError?: string;
}) {
  const parsed = parseP4RoadmapPlan(value);
  const [showIssues, setShowIssues] = useState(false);
  if (value.trim() && !parsed) {
    return (
      <p role="alert" className={cx("item-note")}>
        The saved milestone plan could not be read. Keep the record and ask for
        a repair before continuing.
      </p>
    );
  }
  const draft = parsed ?? emptyP4RoadmapPlan();
  const setDraft = (update: (plan: typeof draft) => typeof draft) =>
    onChange(serializeP4RoadmapPlan(update(draft)));
  const issues = p4RoadmapPlanIssues(draft);
  const change = (id: string, patch: Partial<P4RoadmapMilestone>) => {
    setDraft((plan) => ({
      ...plan,
      milestones: plan.milestones.map((row) =>
        row.id === id
          ? {
              ...row,
              ...patch,
              reviewed: "reviewed" in patch ? patch.reviewed! : false,
              dependenciesReviewed:
                "dependsOn" in patch
                  ? false
                  : (patch.dependenciesReviewed ?? row.dependenciesReviewed),
            }
          : row,
      ),
    }));
  };
  const changed = serializeP4RoadmapPlan(draft) !== storedValue;
  return (
    <div className={cx("field")}>
      <p className={cx("item-note")}>
        Record owner roles and planning sources. Review the dependency list
        explicitly, including a milestone with no predecessors.
      </p>
      {draft.milestones.map((row, index) => (
        <fieldset key={row.id} className={cx("field", "milestone-fields")}>
          <legend className={cx("q-label")}>Milestone {index + 1}</legend>
          <span className={cx("ava-badge")}>Your capture answer · review</span>
          {FIELDS.map(([key, label]) => (
            <div key={key}>
              <label className={cx("q-label")} htmlFor={`p4-${row.id}-${key}`}>
                {label} · {index + 1}
              </label>
              {key === "dependencyNotes" || key === "timingBasis" ? (
                <textarea
                  id={`p4-${row.id}-${key}`}
                  className={cx("q-input")}
                  rows={2}
                  value={row[key]}
                  onChange={(event) =>
                    change(row.id, { [key]: event.target.value })
                  }
                />
              ) : (
                <input
                  id={`p4-${row.id}-${key}`}
                  className={cx("q-input")}
                  value={row[key]}
                  onChange={(event) =>
                    change(row.id, { [key]: event.target.value })
                  }
                  placeholder={
                    key === "ownerRole"
                      ? "Role, without a personal name"
                      : undefined
                  }
                />
              )}
            </div>
          ))}
          <div className={cx("field")}>
            <span className={cx("q-label")}>Predecessors · {index + 1}</span>
            {draft.milestones
              .filter((other) => other.id !== row.id)
              .map((other) => (
                <label key={other.id}>
                  <input
                    type="checkbox"
                    checked={row.dependsOn.includes(other.id)}
                    onChange={(event) =>
                      change(row.id, {
                        dependsOn: event.target.checked
                          ? [...row.dependsOn, other.id]
                          : row.dependsOn.filter((id) => id !== other.id),
                      })
                    }
                  />{" "}
                  Depends on {other.name || "unnamed milestone"} · {index + 1}
                </label>
              ))}
            <label>
              <input
                type="checkbox"
                checked={row.dependenciesReviewed}
                onChange={(event) =>
                  change(row.id, { dependenciesReviewed: event.target.checked })
                }
              />{" "}
              Dependency list reviewed, including none · {index + 1}
            </label>
            <label>
              <input
                type="checkbox"
                checked={row.reviewed}
                onChange={(event) =>
                  change(row.id, { reviewed: event.target.checked })
                }
              />{" "}
              Milestone reviewed · {index + 1}
            </label>
          </div>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() =>
              setDraft((plan) => ({
                ...plan,
                milestones: plan.milestones
                  .filter((item) => item.id !== row.id)
                  .map((item) =>
                    item.dependsOn.includes(row.id)
                      ? {
                          ...item,
                          dependsOn: item.dependsOn.filter(
                            (id) => id !== row.id,
                          ),
                          dependenciesReviewed: false,
                          reviewed: false,
                        }
                      : item,
                  ),
              }))
            }
          >
            Remove milestone · {index + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className={cx("btn-ink")}
        disabled={draft.milestones.length >= 100}
        onClick={() =>
          setDraft((plan) => ({
            ...plan,
            milestones: [
              ...plan.milestones,
              newP4RoadmapMilestone(crypto.randomUUID()),
            ],
          }))
        }
      >
        Add milestone
      </button>
      {showIssues &&
        issues.map((issue) => (
          <p key={issue} role="alert" className={cx("item-note")}>
            {issue}
          </p>
        ))}
      {saveError && (
        <p role="alert" className={cx("item-note")}>
          {saveError}
        </p>
      )}
      {!changed && saved === false && (
        <p role="status" className={cx("item-note")}>
          Waiting for the milestone plan&apos;s saved readback. If saving
          failed, save the reviewed plan again.
        </p>
      )}
      <button
        type="button"
        className={cx("btn-ink")}
        disabled={!changed && saved === true}
        onClick={() => {
          setShowIssues(true);
          if (isP4RoadmapPlanComplete(draft))
            onSave(serializeP4RoadmapPlan(draft));
        }}
      >
        Save reviewed plan
      </button>
    </div>
  );
}
