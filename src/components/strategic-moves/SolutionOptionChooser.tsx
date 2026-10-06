"use client";

import type { P3SolutionOption } from "@/lib/programs/phase-templates/p3-option-assembler";

/**
 * The control that records WHICH solution option architecture should implement.
 *
 * P3 cannot be approved until one of the assembled options is the chosen one:
 * the phase's build blocker reads "Select the solution option that architecture
 * should implement before Approve & Build", and the approval payload carries the
 * chosen option's label, summary, recommendation basis and risks forward into
 * P4. The legacy contract-steps canvas offers that choice as option cards; the
 * redesigned three-step capture screens had no selector at all, so on those
 * screens the blocker named a control that was not on the page.
 *
 * Selection is deliberately page-local, exactly as it is on the legacy canvas:
 * the host holds it in state, the recorded gate approval is what persists it,
 * and a reload recovers it from that approval (or, failing that, from the
 * recommendation text). This component therefore adds no storage format and no
 * save path — it reports a choice and shows which one is standing.
 */
export interface SolutionOptionChooserProps {
  /** The assembled options for this Move, in presentation order. */
  options: readonly P3SolutionOption[];
  /**
   * The option standing right now — a click here, an option restored from a
   * recorded approval, or one read out of the recommendation text. Empty when
   * nothing is chosen yet.
   */
  selectedOptionId: string;
  /** Reports the chosen option's id. */
  onSelect: (optionId: string) => void;
}

/**
 * One radio group name for every instance, on purpose: the host renders the
 * chooser on the recommendation question and again beside the build control,
 * and only one capture step is on screen at a time. If both ever did render
 * together, sharing the name is the behaviour we want — there is one choice.
 */
const GROUP_NAME = "p3-solution-option";

export function SolutionOptionChooser({
  options,
  selectedOptionId,
  onSelect,
}: SolutionOptionChooserProps) {
  return (
    <fieldset
      className="mxw-route-choice"
      data-testid="solution-option-chooser"
    >
      <legend className="mxw-route-choice-legend">
        The option architecture should implement
      </legend>
      {options.length === 0 ? (
        // Honest about a state the person cannot act out of: no option was
        // assembled for this Move, so there is nothing to choose and P3 cannot
        // be approved until design inputs or an uploaded option set arrive.
        <p className="mxw-route-choice-empty">
          No solution option has been assembled for this Move yet. Approve &amp;
          Build stays closed until one is available.
        </p>
      ) : (
        <>
          <p className="mxw-route-choice-note">
            P4 plans the option chosen here. Your pick is recorded with the gate
            approval.
          </p>
          <ul className="mxw-route-choice-list">
            {options.map((option) => {
              const checked = option.id === selectedOptionId;
              return (
                <li key={option.id}>
                  <label
                    className={`mxw-route-choice-option${
                      checked ? " is-chosen" : ""
                    }`}
                  >
                    <input
                      checked={checked}
                      name={GROUP_NAME}
                      onChange={() => onSelect(option.id)}
                      type="radio"
                      value={option.id}
                    />
                    <span className="mxw-route-choice-body">
                      <span className="mxw-route-choice-head">
                        <b>
                          {option.id} · {option.label}
                        </b>
                        {option.recommended ? (
                          <em className="mxw-route-choice-rec">
                            {option.recommendationLabel || "Recommended"}
                          </em>
                        ) : null}
                      </span>
                      {option.clientSupplied ? (
                        <>
                          {option.clientSupplied.benefit ? (
                            <small>
                              Benefit: {option.clientSupplied.benefit}
                            </small>
                          ) : null}
                          {option.clientSupplied.tradeoff ? (
                            <small>
                              Trade-off: {option.clientSupplied.tradeoff}
                            </small>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <small>{option.summary}</small>
                          <span className="mxw-route-choice-meta">
                            <i>{option.timeToValue}</i>
                            <i>{option.effort}</i>
                            <i>{option.confidence} confidence</i>
                          </span>
                        </>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </fieldset>
  );
}
