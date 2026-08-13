# Vendor Response Parsing — Lane 5 Assessment, 2026-08-13

Assessment of the packet's Lane 5 ("Rich vendor response parsing") against what is already built and
what the deployed product actually renders. Written before building anything, because most of Lane 5
turned out to exist.

## Headline

Lane 5 is **substantially built**. The extraction model, the detection categories, the BAFO/challenge
outputs, and a durable fact schema all exist and render live. Two gaps remain, and one of them is a
new cross-surface contradiction found during this assessment.

Re-implementing Lane 5 from the packet description would have duplicated roughly 5,000 lines of
working code.

## What already exists

| Lane 5 requirement | Where it lives | State |
| --- | --- | --- |
| Section completeness | `VendorResponseProfile.responseCompleteness`, `sectionMap` | Built, renders live |
| Claims | `majorClaims`, extraction card type `claim` | Built |
| Evidence references | `evidenceProvided`, `VendorExtractionCard.evidenceReference` | Built |
| AI/automation commitments | `productivityCommitment`, card type `productivity` | Built |
| Staffing/location model | `staffingModelSummary`, card type `staffing` | Built |
| SLA commitments/credits/exclusions | `slaCommitments`, card type `sla` | Built |
| Pricing assumptions | `pricingSummary`, `assumptionsExclusions` | Built |
| Commercial exceptions | `commercialExceptions`, card type `exception` | Built |
| Transition plan | `transitionCommitments`, card type `transition` | Built |
| Risks and buyer asks | `clarificationQuestions`, `negotiationLevers`, challenge log | Built |
| Unsupported claim detection | `unsupportedClaims`, `VendorChallengeIssueCategory.unsupported_claim` | Built |
| Pricing incomparability | `VendorChallengeIssueCategory.pricing_gap` | Built |
| BAFO asks | `VendorBafoQuestion`, `VendorBafoInstructionPack` | Built |
| Durable dossiers | `source_vendor_proposal_facts` (+ reviews table, RLS, cross-table consistency migrations) | Schema exists with `source_quote`, `page_or_location`, `confidence`, `extraction_method`, `supersedes_fact_id` |

Live evidence, deployed revision, signed in: the Responses stage renders 54,418 characters of dossier
content with 156 vendor references, and all six detection categories are present in the rendered page
(unsupported, exceptions, SLA, staffing, BAFO, pricing).

aVa answers vendor-response questions from grounding rather than invention. Asked which vendor claims
are unsupported, it returned specifics — one vendor "addressed only 1 of 6 value dimensions, left 2
dodged" — rather than a generic answer.

## Solution architecture

The one extraction dimension in the packet's list with no obvious home is **solution architecture**.
Every other dimension maps to an existing field. If architecture comparison matters for evaluation, it
needs a field; if it does not, the packet's list should drop it.

## Gap 1 — the rendered dossiers are fixtures, not parsed documents

The three packages that render are `Vendor A — incumbent operations profile`, `Vendor B — scale
transformation profile`, and `Vendor C — specialist service profile`, carried in
`proposal-intelligence/mve-profile.ts` with a `syntheticDemo` marker and ~100-page equivalents.

The packet's acceptance — "at least three synthetic vendor response packages are parsed into durable
dossiers" — is met in the sense that three packages exist, are rich, and drive real downstream
behaviour. It is not met in the sense of a document being uploaded and *parsed* into
`source_vendor_proposal_facts` end to end. The schema for that is in place; what is unproven is the
upload → parse → persist → render path on a real document.

That path is the honest remaining build, and it is smaller than Lane 5 first appears.

## Gap 2 — aVa and the Responses stage name different vendors for the same event (new)

On event `fa4d9a8f…`:

- The **Responses stage** renders `Vendor A`, `Vendor B`, `Vendor C`.
- **aVa**, asked about unsupported claims on the same event, answered about **Amadeus** — a vendor
  that does not appear on the stage at all.

Both describe the same event at the same moment. This is the same class of defect as AVA-S-02 (aVa's
portfolio counts disagreeing with the workspace header): two grounding paths over the same subject
that have never been reconciled. It is more damaging here, because a buyer reading a vendor name that
is not in their own response set will not trust anything else in the answer.

Which set is authoritative is deliberately not asserted here.

## Recommendation

1. Do not rebuild Lane 5. Close Gap 1 by proving the upload → parse → persist → render path on one
   real document against the existing schema.
2. Treat Gap 2 as part of the same reconciliation work as AVA-S-02 — one decision about which vendor
   and portfolio grounding is authoritative, applied to both.
3. Decide whether solution architecture is a required extraction dimension before adding a field for
   it.

## Not covered

- No upload of a real 50-75 page document was attempted; that is Gap 1's proof and needs a fixture
  document plus a parse run.
- The `source_vendor_proposal_facts` tables were read at the schema level, not queried for row counts
  on the live tenant.
