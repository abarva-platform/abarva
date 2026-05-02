# Source E2E UX Assessment Report

Date: 2026-05-02  
Target: https://app.abarva.ai

## Overall UX Verdict

Pre-production but materially improved. Source now has a credible enterprise top-nav entry, reachable Source module, working event lifecycle, and visible Tower handoff. The biggest remaining UX risks are not page cosmetics; they are trust gaps where the UI can imply more runtime sophistication than the backend currently proves.

## Screenshots Captured

| Area | Artifact path |
| --- | --- |
| Apex lifecycle crawl | `/tmp/source-apex-lifecycle-live-crawl/` |
| Meridian lifecycle crawl | `/tmp/source-meridian-lifecycle-live-crawl/` |
| First Capital lifecycle crawl | `/tmp/source-firstcapital-lifecycle-live-crawl/` |
| Tower post-fix handoff | `/tmp/source-tower-postfix-check/` |
| Artifact generation/upload | `/tmp/source-artifact-capability-live-check/` |
| Pricing upload | `/tmp/source-pricing-upload-live-check/` |

## Strengths

- Top product nav made Source easy to find from Home for all three client admins.
- The Source command center showed tenant-scoped events only during the crawl.
- Completed Source events now appear in Tower, making Transition/Value feel connected to portfolio observation.
- The artifact routes return explicit parser/vector/graph receipts instead of pretending evidence is fully processed.
- Pricing parser now avoids obvious false-positive extraction after PR #1439.

## Severity 1 Issues

None remaining from this crawl.

## Severity 2 Issues

| Issue | Evidence | Recommendation |
| --- | --- | --- |
| Demo sign-in occasionally stalls on `/sign-in` after ticket sign-in. | Pricing rerun failed once, then passed on retry. | Add a deterministic redirect/timeout recovery path and visible error or retry state. |
| Generated artifacts are visible as persisted rows but stay parser/vector/graph pending. | `/tmp/source-artifacts-db-verification.json` | UI should clearly label generated artifacts as stored drafts until parsed and citeable. |
| Evidence-gate completion is not clearly enforced in stage progression. | Stage API crawl advanced all stages directly as admin. | Add gate-readiness refusal/approval UI before allowing stage transition in pilot demos. |
| First Capital still has legacy `arcturus` source event keys. | DB verification showed `client_key=arcturus`. | Normalize tenant key naming or hide legacy key from any receipt/debug surface. |

## Severity 3 Issues

| Issue | Evidence | Recommendation |
| --- | --- | --- |
| Tower top chrome no longer shows client name, so automated client-visible assertions need to rely on account chip/event content. | First Capital Tower check had event visible but `expectedClientVisible=false`. | This is acceptable if top chrome intentionally removed client names; otherwise add a subtle workspace/client receipt. |
| Artifact generation content is currently caller-supplied markdown. | Generate route persisted test content. | Add stronger template-backed generation flows per stage. |

## UX Quality By Area

| Area | Assessment |
| --- | --- |
| Home to Source navigation | Good. Source is visible and reachable for client admins. |
| Source event lifecycle | Functional. Needs stronger visual gate receipts for real pilot trust. |
| Tower handoff | Good after PR #1437. The handoff panel now shows completed Source events. |
| Artifact receipts | Honest but technical. Good for demos with practitioner explanation; needs a friendlier artifact processing rail. |
| Pricing support | Improving. Structured extraction works, but users will expect analysis, benchmarking, and negotiation advice beyond extraction. |
| Auth/logout/sign-in | Needs hardening. Demo access page is usable but occasional stalled sign-in is confidence-draining. |

## Recommendation

Treat Source as pilot-usable for controlled admin-led demos, not yet fully self-serve for a live procurement team. The next UX slice should focus on making the gate/artifact processing state visible and unambiguous: created, uploaded, parsed, citeable, approved, and Tower-observed.
