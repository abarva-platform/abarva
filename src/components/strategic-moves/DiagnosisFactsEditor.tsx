"use client";

import { useEffect, useRef, useState } from "react";
import {
  parseDiagnosisFacts,
  serializeDiagnosisFacts,
  type DiagnosisFact,
} from "@/lib/programs/diagnosis-facts";

/**
 * The writable half of a `structured: "facts"` capture section — one editable
 * metric · value · source row per baseline the operator attests.
 *
 * The parse/serialize contract is `@/lib/programs/diagnosis-facts`, so what is
 * stored is byte-identical to what the read views already render and to what
 * the generation context already folds in (`factsToBaselineMetrics`). This
 * component adds no storage format and no save path of its own: it reports a
 * serialized section value through `onChange` exactly as the other structured
 * editors (business change, solution route, estimate model) do.
 *
 * Why rows are held locally rather than derived from `value` on every keystroke:
 * `parseDiagnosisFacts` drops a row whose metric and value are both empty, which
 * is precisely the state a half-typed new row is in. Deriving would therefore
 * delete the row the person is typing into. Local rows are re-seeded from
 * `value` whenever it arrives from somewhere other than this editor (first
 * render, a reload, an aVa draft insert, a notes fill), which is what `emitted`
 * distinguishes.
 */
export interface DiagnosisFactsEditorProps {
  /** The capture section's stored value (serialized facts, or legacy text). */
  value: string;
  /** Reports the serialized section value. Empty string when no row has content. */
  onChange: (next: string) => void;
  /** Accessible name prefix, so several editors on a page stay distinguishable. */
  label?: string;
}

const BLANK: DiagnosisFact = { metric: "", value: "", source: "" };

/** At least one row is always offered, so an empty section can be typed into. */
function seedRows(value: string): DiagnosisFact[] {
  const parsed = parseDiagnosisFacts(value);
  return parsed.length > 0 ? parsed : [{ ...BLANK }];
}

export function DiagnosisFactsEditor({
  value,
  onChange,
  label = "Baseline metrics",
}: DiagnosisFactsEditorProps) {
  const [rows, setRows] = useState<DiagnosisFact[]>(() => seedRows(value));
  // The last value this editor reported. An incoming `value` equal to it is our
  // own echo and must not re-seed (that would discard a half-typed row).
  const emitted = useRef<string>(serializeDiagnosisFacts(seedRows(value)));

  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    setRows(seedRows(value));
  }, [value]);

  const commit = (next: DiagnosisFact[]) => {
    setRows(next);
    const serialized = serializeDiagnosisFacts(next);
    emitted.current = serialized;
    onChange(serialized);
  };

  const setField = (
    index: number,
    field: keyof DiagnosisFact,
    fieldValue: string,
  ) => {
    commit(
      rows.map((row, i) =>
        i === index ? { ...row, [field]: fieldValue } : row,
      ),
    );
  };

  return (
    <div className="mxw-facts-editor" data-testid="diagnosis-facts-editor">
      <table className="mxw-facts-editor-table">
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Value</th>
            <th scope="col">Source</th>
            <th scope="col">
              <span className="mxw-facts-editor-sr">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>
                <input
                  aria-label={`${label} — metric, row ${index + 1}`}
                  onChange={(event) =>
                    setField(index, "metric", event.target.value)
                  }
                  placeholder="Contract intake cycle time"
                  type="text"
                  value={row.metric}
                />
              </td>
              <td>
                <input
                  aria-label={`${label} — value, row ${index + 1}`}
                  onChange={(event) =>
                    setField(index, "value", event.target.value)
                  }
                  placeholder="18.4 days median"
                  type="text"
                  value={row.value}
                />
              </td>
              <td>
                <input
                  aria-label={`${label} — source, row ${index + 1}`}
                  onChange={(event) =>
                    setField(index, "source", event.target.value)
                  }
                  placeholder="Where this number came from"
                  type="text"
                  value={row.source}
                />
              </td>
              <td>
                <button
                  aria-label={`Remove ${label} row ${index + 1}`}
                  className="mxw-facts-editor-remove"
                  disabled={rows.length === 1}
                  onClick={() =>
                    commit(
                      rows.length === 1
                        ? [{ ...BLANK }]
                        : rows.filter((_, i) => i !== index),
                    )
                  }
                  type="button"
                >
                  {"×"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mxw-facts-editor-actions">
        <button
          className="mxw-facts-editor-add"
          onClick={() => commit([...rows, { ...BLANK }])}
          type="button"
        >
          + Add metric
        </button>
        <p className="mxw-facts-editor-note">
          Name the source for every number. A baseline with no source is an
          assumption, and the phase gate reads it as one.
        </p>
      </div>
    </div>
  );
}
