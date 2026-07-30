"use client";

import { useEffect, useState } from "react";

import type { ViewModelEnvelope } from "@/lib/knowledge/view-model";

/**
 * Fetches a ViewModelEnvelope via the given async fetcher and returns
 * `undefined` while in flight (GatedSection renders that as a loading state,
 * never as fabricated data). Re-fetches whenever `deps` changes.
 */
export function useEnvelope<T>(
  fetcher: () => Promise<ViewModelEnvelope<T>>,
  deps: readonly unknown[],
): ViewModelEnvelope<T> | undefined {
  const [envelope, setEnvelope] = useState<ViewModelEnvelope<T> | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    setEnvelope(undefined);
    fetcher()
      .then((result) => {
        if (!cancelled) setEnvelope(result);
      })
      .catch(() => {
        // A failed call must never fall back to fabricated data -- surface
        // nothing rather than guessing. Callers relying on the loading state
        // simply never resolve past "loading"; that is an honest outcome for
        // a genuinely broken call, distinct from a normal withheld envelope.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return envelope;
}
