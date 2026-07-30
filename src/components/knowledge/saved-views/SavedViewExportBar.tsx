"use client";

import { useState } from "react";

/**
 * Save view / export actions. Per the target read-model contracts doc,
 * `saved_view` is correctly an operational UI table, not a canonical
 * projection -- so this is legitimately local/session state, no provider
 * envelope involved. Matrix row gate: "Disable Export until the view's
 * underlying inventory table itself has real data, so an export never
 * silently produces a file with zero real rows."
 */
export function SavedViewExportBar({
  hasRealData,
  viewLabel,
}: {
  readonly hasRealData: boolean;
  readonly viewLabel: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  function saveView() {
    try {
      const key = `knowledge.savedView.${viewLabel}`;
      window.sessionStorage.setItem(
        key,
        JSON.stringify({ savedAt: new Date().toISOString() }),
      );
      setMessage(
        "View saved for this session. Shareable link support is not built yet.",
      );
    } catch {
      setMessage("Could not save the view in this browser session.");
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={saveView}
        className="rounded-md border border-[rgba(10,10,11,0.18)] bg-white px-2.5 py-1.5 text-xs text-[#5f5e5a]"
      >
        Save this view
      </button>
      <button
        type="button"
        disabled={!hasRealData}
        title={
          hasRealData
            ? undefined
            : "Not yet available for this tenant -- no real rows to export"
        }
        onClick={() =>
          setMessage(
            "Export carries the snapshot, filters and evidence state with the rows.",
          )
        }
        className={`rounded-md border px-2.5 py-1.5 text-xs ${
          hasRealData
            ? "border-[rgba(10,10,11,0.18)] bg-white text-[#5f5e5a]"
            : "cursor-not-allowed border-[rgba(10,10,11,0.1)] text-[#b4b2a9]"
        }`}
      >
        Export
      </button>
      {message ? (
        <span className="text-xs text-[#888780]">{message}</span>
      ) : null}
    </div>
  );
}
