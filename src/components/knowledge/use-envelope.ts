"use client";

import { useEffect, useState } from "react";

import type { ConsumptionEnvelope } from "@/lib/knowledge/providers/types";

/**
 * Fetches a ConsumptionEnvelope via the given async fetcher and returns
 * `undefined` while in flight (GatedSection renders that as a loading state,
 * never as fabricated data). Re-fetches whenever `deps` changes.
 */
export function useEnvelope<T>(
  fetcher: () => Promise<ConsumptionEnvelope<T>>,
  deps: readonly unknown[],
): ConsumptionEnvelope<T> | undefined {
  const [envelope, setEnvelope] = useState<ConsumptionEnvelope<T> | undefined>(
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
