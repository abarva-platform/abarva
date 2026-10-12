"use client";

import { useEffect, useState } from "react";

export interface P4ValueReadback {
  body: Record<string, unknown> | null;
  status: string;
  ready: boolean;
  canRetry: boolean;
  retry: () => void;
}

const READING = "Reading the value case…";

export function useP4ValueReadback({
  moveId,
  modelText,
  enabled,
  captureSaved,
  captureError,
}: {
  moveId: string;
  modelText: string;
  enabled: boolean;
  captureSaved: boolean;
  captureError?: string;
}): P4ValueReadback {
  const [read, setRead] = useState<{
    key: string;
    body: Record<string, unknown> | null;
    status: string;
  } | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const key = JSON.stringify([moveId, modelText, retryKey]);

  useEffect(() => {
    let live = true;
    if (!enabled || !captureSaved) {
      setRead(null);
      return;
    }
    fetch(`/api/v1/programs/${encodeURIComponent(moveId)}/value-case`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const value = (await response.json()) as Record<string, unknown>;
        if (!response.ok || value.ok !== true) {
          throw new Error(
            typeof value.detail === "string"
              ? value.detail
              : "Value case unavailable. No engine result is being shown.",
          );
        }
        if (
          value.programId !== moveId ||
          !value.case ||
          typeof value.case !== "object" ||
          !["evaluated", "blocked"].includes(String(value.status)) ||
          (value.case as Record<string, unknown>).status !== value.status ||
          typeof value.figuresRedacted !== "boolean"
        ) {
          throw new Error(
            "The value-case readback could not be verified. Try again.",
          );
        }
        return value;
      })
      .then((body) => {
        if (live) setRead({ key, body, status: "" });
      })
      .catch((error: unknown) => {
        if (live) {
          setRead({
            key,
            body: null,
            status:
              error instanceof Error
                ? error.message
                : "Value case unavailable. No engine result is being shown.",
          });
        }
      });
    return () => {
      live = false;
    };
  }, [moveId, key, enabled, captureSaved]);

  const current = enabled && captureSaved && read?.key === key ? read : null;
  const body = current?.body ?? null;
  const status = !enabled
    ? ""
    : !captureSaved
      ? captureError ||
        (modelText.trim()
          ? "The value plan is still saving. Wait for its saved readback."
          : "Record and save a structured value plan before reading its value case.")
      : (current?.status ?? READING);
  const result = body?.case as Record<string, unknown> | undefined;
  const cost = body?.costBasis as Record<string, unknown> | undefined;
  const ready =
    body?.status === "evaluated" &&
    body.readyForApproval === true &&
    body.figuresRedacted === false &&
    cost?.status === "resolved" &&
    Array.isArray(result?.mustValidate) &&
    result.mustValidate.length === 0;
  return {
    body,
    status,
    ready,
    canRetry: enabled && captureSaved && !body && status !== READING,
    retry: () => setRetryKey((count) => count + 1),
  };
}
