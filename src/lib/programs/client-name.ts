import type { ProgramSummary } from "./types.ui";

import { canonicalClientDisplayNameOrNull } from "@/lib/client-config";

// ── Client name mapping ────────────────────────────────────────────────
// Delegate to the canonical resolver (src/lib/client-config.ts), which knows
// every tenant. NEVER default to a specific tenant: an unresolved client falls
// back to its own raw name, then a neutral dash. An older version hardcoded one
// account as the catch-all default, so any tenant outside a stale closed list
// rendered as that account — a cross-tenant name leak on every Move card.
//
// U-512 (2026-09-22): the rule above had quietly stopped holding. This asked
// `canonicalClientDisplayName`, which ends by resolving an unrecognised key
// through `getClientOption` — and that answers the DEFAULT_CLIENT_KEY option
// rather than `undefined`. So it never returned null, both fallbacks below
// were unreachable, and the same leak was back by a different route. The
// `OrNull` form reports the unresolved case instead of inventing an account.
//
// It lives in its own module so a behaviour test can exercise it without
// loading `transformers.ts` and its data-plane import graph.
export function canonicalProgramClientName(args: {
  clientId?: string | null;
  name?: string | null;
}): ProgramSummary["clientName"] {
  // The dash was unreachable twice over. Once through the resolver above, and
  // once here: `resolveClientName` passes `row?.name ?? ""`, and `""` is not
  // nullish, so `?? "—"` never fired for a missing `clients` row -- the card
  // rendered an empty client name. `||` is deliberate.
  const rawName = args.name?.trim();
  return (
    canonicalClientDisplayNameOrNull({ key: args.clientId, name: args.name }) ??
    (rawName || "—")
  );
}
