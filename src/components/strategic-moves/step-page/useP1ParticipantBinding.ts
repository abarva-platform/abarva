"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  P1ParticipantBindingCommand,
  P1ParticipantBindingPreview,
} from "@/lib/programs/p1-participant-binding";
import { p1ParticipantBindingsReady } from "@/lib/programs/p1-participant-binding";

export function useP1ParticipantBinding(
  moveId: string,
  enabled: boolean,
  initial?: P1ParticipantBindingPreview | null,
) {
  const [preview, setPreview] = useState<P1ParticipantBindingPreview | null>(
    initial ?? null,
  );
  const [loading, setLoading] = useState(enabled && initial === undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  const url = `/api/v1/programs/${encodeURIComponent(moveId)}/phase-capture`;
  const reload = useCallback(async () => {
    const token = ++generation.current;
    setLoading(true);
    setPreview(null);
    setError(null);
    try {
      const response = await fetch(`${url}?phase=1`, {
        credentials: "include",
        cache: "no-store",
      });
      const body = await response.json();
      if (
        !response.ok ||
        !body.p1ParticipantBinding ||
        body.p1ParticipantBinding.moveId !== moveId
      )
        throw new Error("The current contact preview could not be read.");
      if (token === generation.current) setPreview(body.p1ParticipantBinding);
    } catch (failure) {
      if (token === generation.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "The current contact preview could not be read.",
        );
    } finally {
      if (token === generation.current) setLoading(false);
    }
  }, [url, moveId]);
  useEffect(() => {
    const requests = generation;
    if (enabled && initial === undefined) void reload();
    else if (enabled) {
      setPreview(initial ?? null);
      setLoading(false);
    }
    return () => {
      requests.current++;
    };
  }, [enabled, reload, initial]);
  const confirm = useCallback(
    async (command: P1ParticipantBindingCommand) => {
      if (
        busy.current ||
        !enabled ||
        !preview?.canConfirm ||
        command.expectedRevision !== preview.revision
      )
        throw new Error(
          "Reload and review the current contact preview before confirming.",
        );
      busy.current = true;
      setSaving(true);
      setError(null);
      try {
        const response = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "confirm_p1_participant_bindings",
            phase: 1,
            ...command,
          }),
        });
        const body = await response.json();
        if (
          !response.ok ||
          body.persisted !== true ||
          body.preservedBindings !== true ||
          !body.auditId ||
          body.p1ParticipantBinding?.moveId !== moveId ||
          !p1ParticipantBindingsReady(body.p1ParticipantBinding) ||
          body.p1ParticipantBinding.auditId !== body.auditId ||
          body.p1ParticipantBinding.current?.sponsorPersonId !==
            command.sponsorPersonId ||
          body.p1ParticipantBinding.current?.leadPersonId !==
            command.leadPersonId
        )
          throw new Error(
            body.detail ||
              "The stored contact confirmation and audit could not be verified. Read them before retrying.",
          );
        setPreview(body.p1ParticipantBinding);
      } catch (failure) {
        setPreview(null);
        const detail =
          failure instanceof Error
            ? failure.message
            : "The contact confirmation could not be verified. Read the current contacts and audit before retrying.";
        setError(detail);
        throw new Error(detail);
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [enabled, preview, url, moveId],
  );
  return {
    enabled,
    preview: preview?.moveId === moveId ? preview : null,
    loading,
    saving,
    error,
    reload,
    confirm,
  };
}
export type P1ParticipantBindingControl = ReturnType<
  typeof useP1ParticipantBinding
>;
