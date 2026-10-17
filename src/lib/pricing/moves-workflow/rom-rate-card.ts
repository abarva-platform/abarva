/**
 * Moves ROM — which rate card prices an estimate.
 *
 * A tenant loads and approves its own rate card once, before any Move
 * (`/api/admin/pricing/rate-cards`). Every estimate then prices on it with no
 * edit inside the use case:
 *
 * - `client_current` resolves to the tenant's current APPROVED card version,
 *   or to the committed reference rates when the tenant has none;
 * - `client` + a version id re-reads that exact version (versions are
 *   immutable), so an approved estimate recomputes on the rates it was
 *   approved on even after a newer card is approved;
 * - `reference` (or no pin) uses the committed reference rates only.
 *
 * A card that cannot be read is an error the caller reports — never a silent
 * fall-back to reference rates, which would price a client's estimate on
 * rates the client did not set.
 */
import { CLIENT_ENTERPRISE_RATE_CARD_CODE } from "../governed-load/constants";
import {
  getCurrentRateCard,
  listRateCardLines,
  listRateCardVersions,
} from "../rate-card-repository";
import type { PricingRateCardRow } from "../types";
import {
  REFERENCE_RATE_CARD_PIN,
  type RomClientRateCard,
  type RomReferenceLoaders,
  type RomResolvedRateCardPin,
} from "./rom-service";

/** What a person sees about the card an estimate used. */
export interface RomRateCardSummary {
  cardVersionId: string;
  cardCode: string;
  version: number;
  approvedAt: string | null;
}

export type RomRateCardResolution =
  | {
      ok: true;
      pin: RomResolvedRateCardPin;
      card: RomClientRateCard | null;
      used: RomRateCardSummary | null;
    }
  | { ok: false; code: "invalid_rate_card_pin" | "rate_card_not_found"; detail: string };

const PRICEABLE: ReadonlySet<PricingRateCardRow["status"]> = new Set(["approved", "superseded"]);

function summary(row: PricingRateCardRow): RomRateCardSummary {
  return { cardVersionId: row.id, cardCode: row.card_code, version: row.version, approvedAt: row.approved_at };
}

async function loadCard(
  row: PricingRateCardRow,
  roles: RomClientRateCard["roles"],
): Promise<RomClientRateCard> {
  const lines = await listRateCardLines(row.id);
  return { cardVersionId: row.id, roles, lines };
}

/**
 * Resolve a requested pin for one tenant. `tenantKey` must be the canonical
 * key (`canonicalTenantKey`); every read is an equality predicate on it, so a
 * version id from another tenant is simply not found.
 */
export async function resolveRomRateCard(
  tenantKey: string,
  requested: unknown,
  roles: RomClientRateCard["roles"],
): Promise<RomRateCardResolution> {
  if (requested === undefined || requested === null) {
    return { ok: true, pin: REFERENCE_RATE_CARD_PIN, card: null, used: null };
  }
  if (typeof requested !== "object") {
    return { ok: false, code: "invalid_rate_card_pin", detail: "rateCard must be an object naming the rates to use." };
  }
  const pin = requested as { mode?: unknown; cardVersionId?: unknown };
  if (pin.mode === "reference") {
    return { ok: true, pin: REFERENCE_RATE_CARD_PIN, card: null, used: null };
  }
  if (pin.mode === "client_current") {
    const current = await getCurrentRateCard("client", tenantKey, CLIENT_ENTERPRISE_RATE_CARD_CODE);
    if (!current || current.status !== "approved") {
      return { ok: true, pin: REFERENCE_RATE_CARD_PIN, card: null, used: null };
    }
    return {
      ok: true,
      pin: { mode: "client", cardVersionId: current.id, cardCode: current.card_code, version: current.version },
      card: await loadCard(current, roles),
      used: summary(current),
    };
  }
  if (pin.mode === "client") {
    if (typeof pin.cardVersionId !== "string" || pin.cardVersionId.trim() === "") {
      return { ok: false, code: "invalid_rate_card_pin", detail: "A client rate-card pin needs the card version id it was priced on." };
    }
    const versions = await listRateCardVersions("client", tenantKey, CLIENT_ENTERPRISE_RATE_CARD_CODE);
    const row = versions.find((v) => v.id === pin.cardVersionId && PRICEABLE.has(v.status));
    if (!row) {
      return {
        ok: false,
        code: "rate_card_not_found",
        detail:
          "The rate-card version this estimate was priced on is not an approved card for this workspace. Reopen the estimate approval and re-price it on the current card.",
      };
    }
    return {
      ok: true,
      pin: { mode: "client", cardVersionId: row.id, cardCode: row.card_code, version: row.version },
      card: await loadCard(row, roles),
      used: summary(row),
    };
  }
  return {
    ok: false,
    code: "invalid_rate_card_pin",
    detail: `rateCard mode '${String(pin.mode)}' is not one of reference, client or client_current.`,
  };
}

/** The tenant's current approved card, for "newer rates are available" notices. */
export async function currentRomRateCardSummary(tenantKey: string): Promise<RomRateCardSummary | null> {
  const current = await getCurrentRateCard("client", tenantKey, CLIENT_ENTERPRISE_RATE_CARD_CODE);
  return current && current.status === "approved" ? summary(current) : null;
}

/** Loaders that additionally serve exactly one pre-loaded client card version. */
export function withClientRateCard(
  loaders: RomReferenceLoaders,
  card: RomClientRateCard | null,
): RomReferenceLoaders {
  if (!card) return loaders;
  return {
    ...loaders,
    loadClientRateCard: (cardVersionId: string) => (cardVersionId === card.cardVersionId ? card : null),
  };
}
