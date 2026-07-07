"use client";

// In-place P0 brief-approval action for the Move header. Approving the
// origination brief is what advances the Move P0 -> P1; previously the only
// surface that decided it was the (unreachable) Admin approvals queue. This
// button calls the tenant-scoped approve-brief endpoint and refreshes so the
// whole detail view re-renders to its post-approval (P1) state.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function ResolveDecisionButton({
  moveId,
  className,
  arrowClassName,
}: {
  moveId: string;
  className?: string;
  arrowClassName?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async () => {
    setState("working");
    setError(null);
    try {
      const res = await fetch(`/api/v1/programs/${moveId}/approve-brief`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(
          data.detail || data.error || `Approve failed (HTTP ${res.status})`,
        );
      }
      // Re-render the server component tree into its post-approval (P1) state.
      router.refresh();
      // Stay in "working" until the refresh swaps this banner out.
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Approve failed");
    }
  }, [moveId, router]);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {error && (
        <span style={{ fontSize: 11, color: "#B4513C" }} title={error}>
          {error}
        </span>
      )}
      <button
        type="button"
        className={className}
        onClick={approve}
        disabled={state === "working"}
        style={state === "working" ? { opacity: 0.7, cursor: "default" } : undefined}
      >
        {state === "working" ? "Approving…" : "Approve brief"}
        {state !== "working" && arrowClassName && (
          <span className={arrowClassName} aria-hidden>
            {" "}
            &rarr;
          </span>
        )}
      </button>
    </span>
  );
}
