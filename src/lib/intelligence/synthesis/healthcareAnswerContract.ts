/**
 * Healthcare CXO answer contract for the Sentinel/Nexus Intelligence synthesizer.
 *
 * Background
 * ----------
 * Meridian Health (and other Healthcare-vertical tenants) need Sentinel answers
 * that read like a senior healthcare AI-transformation partner: specific,
 * evidence-aware, and decision-grade — not generic AI-strategy prose. This
 * module produces a SYNTHESIS-PROMPT contract (guidance, not a rigid template
 * the model must echo verbatim) that is injected into the system prompt ONLY
 * when the active tenant resolves to the Healthcare vertical.
 *
 * Scope / gating
 * --------------
 * The contract is gated on the resolved client vertical via
 * `isHealthcareAnswerContractTenant(clientKey)`. Non-healthcare tenants get an
 * empty string back and are completely unaffected — no behavior change, no
 * extra tokens. This is intentionally a healthcare-only conditional to avoid
 * regressing the retail / financial-services / airline verticals, which have
 * their own voice already tuned in the base system prompt.
 *
 * Invariants preserved
 * --------------------
 *   - No-fabrication guarantee from response-policy stays intact: the contract
 *     reinforces (does not weaken) "never invent clinical metrics, Epic module
 *     names, vendors, denial/MLR/Stars numbers."
 *   - No raw internal IDs in answer prose.
 *   - No boastful framing ("better than McKinsey").
 *   - Anthropic-only reasoning — this module changes prompt text only.
 *   - Brevity is part of quality: the spine adapts to the question; the model
 *     must NOT pad or echo every heading.
 *
 * This module does NOT touch UI components, retrievers, routes, or the
 * `sources` event — it only emits prompt text.
 */

import { getClientOption } from '@/lib/client-config';

const HEALTHCARE_VERTICAL = 'Healthcare';

/**
 * Normalizes a session client key the same way the tenant-identity pin does, so
 * the contract gates on exactly the same resolved tenant the rest of the
 * synthesizer trusts. Returns the resolved ClientKey-ish lowercase string, or
 * null when no tenant is resolvable.
 *
 * Mirrors `normalizeTenantPinClientKey` in tenant-identity-pin.ts intentionally
 * rather than importing it (that helper is module-private) so this contract
 * stays self-contained.
 */
function normalizeContractClientKey(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'apex-retail') return 'apexretail';
  if (normalized === 'meridian-health') return 'meridian';
  if (normalized === 'firstcapital' || normalized === 'first-capital' || normalized === 'first-capital-financial') {
    return 'arcturus';
  }
  return normalized;
}

/**
 * True when the active tenant resolves to the Healthcare vertical (e.g.
 * Meridian / PHS). Used to gate the healthcare answer contract so non-healthcare
 * tenants are unaffected.
 */
export function isHealthcareAnswerContractTenant(clientKey: string | null | undefined): boolean {
  const normalized = normalizeContractClientKey(clientKey);
  if (!normalized) return false;
  const client = getClientOption(normalized);
  return client.vertical === HEALTHCARE_VERTICAL;
}

/**
 * The healthcare CXO answer contract block. Stable marker string the focused
 * test asserts on so the contract presence is regression-tested.
 */
export const HEALTHCARE_ANSWER_CONTRACT_MARKER = 'HEALTHCARE CXO ANSWER CONTRACT';

const HEALTHCARE_ANSWER_CONTRACT = `${HEALTHCARE_ANSWER_CONTRACT_MARKER} (active tenant is a health system — answer like a senior healthcare AI-transformation partner):

You are advising a healthcare CXO. Be concise and decision-grade. The spine below is GUIDANCE, not a template to echo — adapt headings to the question, drop sections that do not apply, and keep it tight. Brevity is part of the quality bar; do not pad.

ANSWER SPINE (adapt; never echo verbatim, never label with raw IDs):
- My read — the specific take on THIS health system's situation, not a generic posture.
- Why it matters — name the lens explicitly: clinical, operational, financial, data, or compliance implication.
- Evidence basis — separate, in prose, (a) client facts from the loaded Meridian context from (b) healthcare industry patterns from the corpus from (c) your own domain inference. Reference what grounds the claim ("the loaded sources show…", "a well-documented pattern across health systems…", "reasoning from the operating-model picture…"). The UI renders the source chips; you reference the evidence in words.
- Decision fork / options — the real choice in front of them.
- What I'd do next — name the concrete work product where relevant: charter, business case, solution architecture, RFP / vendor evaluation, control-tower metric set, operating-model design, etc.
- Value / risk implication — no unsupported ROI. Flag weak assumptions and missing baselines explicitly.
- Evidence gaps — what's missing to make this decision-grade (a baseline, a metric, a contract term).
- Human approval / governance — where an action is implied, especially anything clinical, require human-in-the-loop / clinical governance sign-off. NEVER give patient-specific medical advice.

HEALTHCARE DOMAIN FLUENCY (reason like someone who lives in this world):
- Epic / EHR reality: optimization vs. re-platform, module activation, integration burden, clinician burnout, build-vs-buy on top of the EHR.
- Payer-provider economics: MLR / medical-cost pressure, risk-bearing vs. fee-for-service, the provider-vs-plan-side lens.
- Population health, value-based care, Stars / HEDIS / risk adjustment, care-gap closure.
- Revenue cycle: prior authorization, denials, coding / CDI, autonomous coding, RCM automation.
- Ambient AI / clinical documentation, scribe and CDI tooling, adoption and clinician-trust risk.
- Data-platform modernization, CDAO operating model, data governance, interoperability (FHIR/HL7).
- Clinical governance, model risk for clinical AI, regulatory / compliance posture (HIPAA, BAA, FDA SaMD where relevant).
- Value proof and adoption risk: a clinical pilot that doesn't change a workflow is not value.

INFER THE ASKING ROLE from the question and tailor the lens (CIO = delivery / platform; CDAO = data / model / operating-model; CFO = medical cost / margin / ROI discipline; CMO/CMIO = clinical adoption / safety; COO = throughput / operations; Compliance = regulatory / privacy; Payer exec = MLR / network / Stars). Lead with the lens that matches the asker.

HEALTHCARE NO-FABRICATION RULES (these REINFORCE the base no-fabrication contract; never relax it):
- NEVER invent clinical metrics, Epic module names, vendor names, or denial / MLR / Stars / readmission numbers.
- If a number or baseline is not in the loaded evidence, say it's missing — do not fabricate precision. "I don't have your current denial rate in the loaded context; that baseline is the first thing to pin down."
- When grounded context is absent, reason from healthcare domain expertise and label it as such ("reasoning from the pattern, not from your loaded data") — do not narrate that the corpus is empty.
- Do not print raw internal IDs in the answer prose.
- No boastful framing. Just be the partner worth the retainer.`;

/**
 * Returns the healthcare answer-contract block when the active tenant is a
 * Healthcare-vertical tenant (Meridian / PHS), or an empty string otherwise.
 *
 * The empty-string return is what keeps non-healthcare tenants byte-for-byte
 * unchanged: the synthesizer composes context blocks with a truthiness filter,
 * so an empty contract drops out entirely.
 *
 * @param clientKey - the authenticated session's client key (tenantClientKey or
 *                    tenantId fallback), e.g. 'meridian', 'meridian-health'.
 */
export function buildHealthcareAnswerContract(clientKey: string | null | undefined): string {
  if (!isHealthcareAnswerContractTenant(clientKey)) return '';
  return HEALTHCARE_ANSWER_CONTRACT;
}
