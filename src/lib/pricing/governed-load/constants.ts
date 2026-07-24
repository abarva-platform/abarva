/**
 * Canonical `pricing_rate_cards.card_code` values this pipeline writes.
 * Matches the fixtures already used in `../__tests__/rate-card-repository.test.ts`
 * (`"ENTERPRISE"` for a client-scope card, `"GLOBAL-STARTER"` for a
 * global-scope card) — PR2 never formally named these as constants since it
 * had no upload consumer yet; this is the PR3 governed-load pipeline's
 * default, override-able single-card-per-tenant convention.
 */
export const CLIENT_ENTERPRISE_RATE_CARD_CODE = "ENTERPRISE";
export const GLOBAL_STARTER_RATE_CARD_CODE = "GLOBAL-STARTER";
