/*
 * Tenant stream guard — defense-in-depth for the answer-only true-streaming
 * path (companion canvas feature). When the synthesizer yields model deltas
 * LIVE (instead of accumulating the full text and running the post-response
 * leak guards once at the end), the existing `detectCrossTenantIdentityLeak` /
 * `detectOffTenantMention` guards need a streaming-friendly wrapper so a
 * cross-tenant assertion can be caught and aborted mid-stream.
 *
 * This module is ADDITIVE. It reuses the exact same detectors used by the
 * post-response guard in synthesizer.ts, so the leak/off-tenant policy is
 * identical — only the timing changes (per-chunk rolling buffer vs. once at
 * the end).
 */

import {
  detectCrossTenantIdentityLeak,
  detectOffTenantMention,
} from "./tenant-identity-pin";
import type { AskSource } from "./types";

/**
 * Rolling buffer size (chars) inspected on each push. Sized to hold roughly
 * two sentences so a cross-tenant identity assertion that straddles a chunk
 * boundary is still detected once both halves have streamed.
 */
const ROLLING_WINDOW_CHARS = 400;

/**
 * Pre-generation screen: concatenate the supplied source details and run the
 * existing leak / off-tenant detectors against them. This catches retrieval
 * contamination BEFORE the model is asked to stream — cheaper and safer than
 * discovering the leak only after tokens have already reached the client.
 */
export function prescreenSourcesForLeak(
  sources: AskSource[],
  tenantClientKey: string | null | undefined,
): { contaminated: boolean; assertedTenant?: string } {
  if (!tenantClientKey || sources.length === 0) {
    return { contaminated: false };
  }

  const concatenated = sources
    .map((source) => `${source.name}\n${source.detail}`)
    .join("\n\n");

  const leak = detectCrossTenantIdentityLeak({
    clientKey: tenantClientKey,
    response: concatenated,
  });
  if (leak.leaked) {
    return { contaminated: true, assertedTenant: leak.assertedTenant };
  }

  const offTenant = detectOffTenantMention({
    clientKey: tenantClientKey,
    response: concatenated,
  });
  if (offTenant.detected) {
    return { contaminated: true, assertedTenant: offTenant.term };
  }

  return { contaminated: false };
}

/** Short refusal shown when a leak trips mid-stream. Mirrors the synthesizer's
 * post-response refusal wording so the user experience is consistent. */
function buildRollingRefusal(assertedTenant?: string): string {
  const attribution = assertedTenant
    ? `The response path began referencing "${assertedTenant}", which is not your authenticated organization.`
    : "The response path began mixing another organization's context.";
  return [
    `I stopped this answer mid-stream. ${attribution}`,
    "",
    "I will not surface mixed-tenant content. Please re-ask, or refresh the page — if this persists, your tenant administrator should review the session-memory state for this client.",
  ].join("\n");
}

export interface RollingLeakDetector {
  /**
   * Feed the next streamed chunk. Maintains an internal rolling buffer and
   * runs the leak / off-tenant detectors against it. Returns `abort:true`
   * (with a refusal string) the first time a leak is detected; callers should
   * yield the refusal and stop streaming.
   */
  push(chunk: string): { abort: boolean; refusalText?: string };
}

/**
 * Streaming leak detector. Accumulates a rolling window of recently streamed
 * text (last ~400 chars) and re-runs the tenant guards on each push. Once a
 * leak is detected the detector latches `aborted` so subsequent pushes are
 * cheap no-ops.
 */
export function createRollingLeakDetector(
  tenantClientKey: string | null | undefined,
): RollingLeakDetector {
  let buffer = "";
  let aborted = false;

  return {
    push(chunk: string): { abort: boolean; refusalText?: string } {
      if (aborted) return { abort: true };
      if (!tenantClientKey || !chunk) return { abort: false };

      buffer = `${buffer}${chunk}`;
      if (buffer.length > ROLLING_WINDOW_CHARS) {
        buffer = buffer.slice(buffer.length - ROLLING_WINDOW_CHARS);
      }

      const leak = detectCrossTenantIdentityLeak({
        clientKey: tenantClientKey,
        response: buffer,
      });
      if (leak.leaked) {
        aborted = true;
        return {
          abort: true,
          refusalText: buildRollingRefusal(leak.assertedTenant),
        };
      }

      const offTenant = detectOffTenantMention({
        clientKey: tenantClientKey,
        response: buffer,
      });
      if (offTenant.detected) {
        aborted = true;
        return {
          abort: true,
          refusalText: buildRollingRefusal(offTenant.term),
        };
      }

      return { abort: false };
    },
  };
}
