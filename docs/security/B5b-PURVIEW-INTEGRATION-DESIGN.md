# B5b · Microsoft Purview content-scan integration — design

> Design doc. Owner: founder. Last updated 2026-05-15. Pair-read with `docs/security/INFOSEC-ACCELERATOR.md` and `src/lib/security/sensitive-upload-guard.ts`.

---

## Why this exists

B5a (PR #1941) wired a **pattern-based** sensitive-upload guard onto 7/7 upload routes. Patterns catch the obvious: bare US SSNs, US credit-card patterns, MRN-shaped strings, generic email/phone. They miss:

- **Context-sensitive PII.** "Patient room 412" alone is harmless. "Patient room 412 · Krishnamurthy · CHF readmit Q3" is regulated.
- **Named entities.** A real human's name + a clinical condition is PHI even with no SSN.
- **Customer-defined classifications.** Some enterprises label internal documents `confidential — restricted` via Purview Information Protection. We should honor that label rather than re-classify.
- **Industry-specific regulated identifiers.** Bank account numbers, EU national IDs, taxpayer IDs across 100+ countries, vehicle identifiers, biometric tokens.

Microsoft Purview Information Protection (formerly Azure Information Protection) is the de facto standard control that customer infosec teams recognize. Naming it in our CAIQ moves the answer from "we use regex" to "we use Purview" — a different conversation.

This doc designs the integration. **Implementation is not in this PR.**

---

## Scope

In scope:
- Integrate Microsoft Purview's classification API into the existing `evaluateSensitiveUpload` entry point in `src/lib/security/sensitive-upload-guard.ts`.
- Map Purview-detected classifications onto our existing 5-level taxonomy.
- Apply across all four ingestion tiers (Tier-1 UI, Tier-2 Azure landing zone, Tier-3 direct integration, Tier-4 in-VPC).
- Preserve the existing pattern-based fast-path as a fallback when Purview is unavailable (degraded mode).
- Per-tenant Purview accounts in production; shared lab account during build-out.

Out of scope (later work):
- B5c quarantine + audit dashboard (separate item).
- Customer-defined classification policy upload (enterprise tier).
- DLP egress controls on the way out (Azure Information Protection labels on generated reports).

---

## Current state (where the pattern guard sits today)

File: `src/lib/security/sensitive-upload-guard.ts`.

Public API:

```ts
export type UploadDataClassification =
  | 'public'
  | 'internal'
  | 'confidential_business'
  | 'restricted_financial'
  | 'regulated_phi_pii_suspected';

export type UploadProtectionDecision = 'allow' | 'quarantine';

export interface UploadProtectionResult {
  declaredClassification: UploadDataClassification;
  decision: UploadProtectionDecision;
  storageAllowed: boolean;
  indexingAllowed: boolean;
  evidenceExtractionAllowed: boolean;
  suspectedPhi: boolean;
  suspectedPii: boolean;
  suspectedFinancialIdentifiers: boolean;
  matchedRules: UploadProtectionRuleMatch[];
  message: string;
}

export function evaluateSensitiveUpload(input: GuardInput): UploadProtectionResult;
```

The decision today comes from:
1. Reading the caller-declared classification (from form field `dataClassification`).
2. Sampling the first 1 MB of the upload.
3. Running regex rules against the sample.
4. Returning `quarantine` if the declared classification is `regulated_phi_pii_suspected` OR if a high-severity rule fired.

What's good: simple, sync, no network. What's missing: see "Why this exists" above.

---

## Proposed architecture

Three changes, layered:

### Change 1 — Add an async Purview-backed evaluation path

Keep the existing `evaluateSensitiveUpload` synchronous (it's called from 7 hot upload routes; making it async would cascade). Add a new exported function:

```ts
export interface PurviewEvaluationInput extends GuardInput {
  tenantClientKey: string;  // for selecting the per-tenant Purview account
}

export interface PurviewEvaluationResult extends UploadProtectionResult {
  /** Whether Purview was reachable. False → result fell back to pattern guard. */
  purviewReached: boolean;
  /** Purview's raw classification labels, if any. */
  purviewLabels: ReadonlyArray<{
    label: string;
    sensitivity: 'public' | 'general' | 'confidential' | 'highly_confidential';
    matchedRules: ReadonlyArray<string>;
  }>;
}

export async function evaluateSensitiveUploadWithPurview(
  input: PurviewEvaluationInput,
): Promise<PurviewEvaluationResult>;
```

The async function calls the sync pattern guard first (fast deny path: if patterns already detect SSN, we don't need a network round-trip), then calls Purview only if the sync guard returned `allow`. If Purview returns a classification that maps to `regulated_phi_pii_suspected`, we override to `quarantine`.

### Change 2 — Switch call sites to the async function on the Tier-2/3 paths

The 7 Tier-1 UI upload routes today call the sync function. Switching all 7 to async is invasive and risks adding ~100-300ms of latency to interactive uploads. Better approach:

- **Tier-1 (UI uploads):** keep sync pattern guard as the primary gate. Add a **background Purview re-evaluation** that runs *after* the upload completes, on the bytes already in storage. If Purview's re-eval upgrades the classification to `regulated_phi_pii_suspected`, the file is moved to quarantine retroactively + the customer admin is alerted. This trades real-time enforcement for UX (the user doesn't wait), but the worst case is "we held the file for 3 seconds before quarantining it" rather than "we missed it forever."

- **Tier-2 (Azure landing zone):** call the async function inline. Customer's batch drop tolerates 1-2 seconds of latency. The consumer Function (per A2b backbone in #1946) is the natural spot.

- **Tier-3 (direct integration):** same as Tier-2 — async inline.

- **Tier-4 (in-VPC):** customer's own Purview tenancy. Bicep deploys Purview into their subscription; AbarVa never sees the data, just the classification decision passed via managed-identity API.

### Change 3 — Map Purview classifications to our taxonomy

Purview's sensitivity labels (`public / general / confidential / highly_confidential`) are organization-defined and don't map 1:1 to our 5-level taxonomy. The mapping:

| Purview sensitivity | AbarVa classification |
|---|---|
| `public` | `public` |
| `general` | `internal` |
| `confidential` | `confidential_business` |
| `highly_confidential` (no PHI/PII rules matched) | `restricted_financial` |
| `highly_confidential` + Purview PHI/PII rule fired | `regulated_phi_pii_suspected` (→ quarantine) |
| (no Purview label, our pattern rule fired) | `regulated_phi_pii_suspected` (→ quarantine) |
| (no Purview label, no pattern match) | caller's `declaredClassification` (default: `confidential_business`) |

Purview's classification rule library (`HIPAA`, `PCI`, `GDPR`, `CCPA`, `Australia Health`, etc.) directly drives the PHI/PII determination. We do not maintain our own rule set in parallel — the regex rules in `sensitive-upload-guard.ts` become the **degraded-mode fallback** when Purview is unreachable.

---

## Wiring (Azure-side)

### Purview account topology

- **Lab + pilot:** single shared Purview account in the AbarVa Azure tenancy. All tenants' uploads scanned by the same account. Acceptable because no real customer data is in scope (B5 design boundary).
- **Production:** per-tenant Purview accounts in the AbarVa tenancy. One Purview = one customer = one billing line. Naming: `purview-abarva-<tenantKey>-prod-<region>`.
- **Enterprise (in-VPC, B4):** customer's existing Purview tenancy is used. AbarVa's federated service principal authenticates against the customer's Purview via Entra ID. No data leaves the customer's subscription.

### Identity

- Managed identity on the Container App (`ca-abarva-web-lab-eastus`, #1950) gets the Purview Data Reader + Classification Reader roles on the relevant Purview account.
- No client secrets in app config. No Purview API keys in Key Vault. Identity-based access only.

### Network

- Purview endpoint: private endpoint inside the AbarVa private data plane VNet (eastus per #1938).
- Private DNS zone `privatelink.purview.azure.com`.
- Outbound from Container App via VNet egress, never public internet.

### Bicep stub (to be authored by Codex)

```
infra/azure/purview-foundation.bicep            (account + identity + roles)
infra/azure/purview-private-endpoint.bicep     (private endpoint + DNS)
infra/azure/parameters/purview.lab.bicepparam  (lab parameters)
```

Architecture log entry to follow: `docs/architecture/azure/AZLAB16-purview-classification-integration.md`.

---

## Failure-mode design

**Purview reachable, classification clean.** Continue, storage + indexing allowed. Audit row records Purview labels.

**Purview reachable, classification = `regulated_phi_pii_suspected`.** Quarantine. Same response shape as today's pattern-based guard. Customer admin alerted.

**Purview reachable, transient classification error (timeout, 500).** Default-deny in production, default-allow in lab. Audit row records the error. After 3 consecutive transient failures within 5 minutes → page founder.

**Purview unreachable (network).** Fall back to the sync pattern guard. Result is recorded as "degraded mode" in the audit row. Alert if degraded mode lasts > 30 minutes.

**Purview misconfigured (auth, missing role).** Treat as unreachable. The app starts in pattern-only mode; an admin dashboard chip surfaces "Purview integration degraded."

---

## Audit + observability

Every upload through `evaluateSensitiveUploadWithPurview` writes an audit row:

```ts
interface UploadAuditRow {
  tenantClientKey: string;
  uploadedBy: string;
  filename: string;
  sizeBytes: number;
  sha256: string;
  patternDecision: 'allow' | 'quarantine';
  purviewReached: boolean;
  purviewLabels: ReadonlyArray<string>;
  finalDecision: 'allow' | 'quarantine';
  reasonCodes: ReadonlyArray<string>;
  evaluatedAt: string;  // ISO
}
```

Stored in the same audit table as the existing upload logs. Streamable to a customer's SIEM (per the C4 infosec accelerator commitment) via Azure Event Hubs.

---

## Rollout

1. **Lab:** add Purview to a single tenant's Azure plane. Validate pattern → Purview override path on a synthetic PHI document.
2. **Bench:** run the existing test corpus (the 5 classification levels' worth of synthetic test files) through both paths; expect Purview to upgrade ≥80% of the "confidential_business" → "restricted_financial" calls that the pattern guard misses.
3. **First pilot:** ship dual-write — pattern guard is the primary gate, Purview re-evaluates async, no enforcement override yet. Compare decisions for 2 weeks.
4. **Enforce:** flip the toggle so Purview decisions become authoritative.

This rollout is gated by `A3 feature-flag contract` (PR #1943). A new flag `purview_authoritative` (policy: `tenant`, default-off) controls the cutover per tenant.

---

## Cost

Purview pricing (Azure Information Protection P2):
- ~$5/user/month for organization-wide deployment.
- For AbarVa's use case (programmatic classification API), the Data Map + Catalog pricing applies: ~$300/month base + ~$1/GB scanned.
- Lab estimate: ~$50-100/month.
- Pilot estimate: ~$300-500/month per tenant once we have real customer data flow.
- Production: line item in the customer's invoice, not bundled.

Cost ceiling already lives in `docs/architecture/azure/ADR-004-cost-ceiling-strategy.md`. Add Purview as a new line item there.

---

## Decision points (open)

1. **Customer-managed Purview keys?** Probably yes for the Enterprise tier (B4 in-VPC). Defer until first Enterprise conversation.
2. **Purview as the ONLY classification source for some industries?** Some healthcare customers will mandate HIPAA-cert Purview rule packs and reject our regex fallback. Tier-specific.
3. **AzureML or Defender for Cloud DLP as alternatives?** Purview is the dominant choice; the alternatives don't move the conversation forward with infosec.
4. **EU residency.** If we sign an EU customer, Purview-EU account in `westeurope` is required. Out of scope until that customer exists.

---

## What this design does NOT cover

- **Egress DLP.** Apply labels to generated PDF/email/document outputs so they carry classification downstream. That's a separate item — call it B5d when it's ready.
- **Customer-uploaded rule packs.** Enterprise tier feature; needs the quarantine review dashboard (B5c) first.
- **The implementation itself.** This doc is the design; Codex (or a follow-up PR by me) authors the Bicep + the async function + the migration of call sites.

---

## Companion artifacts

- `src/lib/security/sensitive-upload-guard.ts` — current pattern-based guard
- `docs/security/INFOSEC-ACCELERATOR.md` — CISO-facing CAIQ (B5b row is `planned`)
- `docs/BACKLOG-2026-05-14.md` — B5b backlog row
- `docs/architecture/azure/ADR-004-cost-ceiling-strategy.md` — cost ceiling (add Purview line)
- `docs/architecture/azure/AZLAB-SEQUENCING-ROADMAP.md` — Codex's lab sequencing (Purview is the next infrastructure item after Key Vault env projection)

---

*This document is design only. Implementation is tracked under backlog item B5b. PR will land Bicep modules + the async `evaluateSensitiveUploadWithPurview` function + the dual-write rollout phase as a separate change.*
