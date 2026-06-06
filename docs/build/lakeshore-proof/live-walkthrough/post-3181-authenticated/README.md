# Lakeshore Authenticated Live Walkthrough Capture

Base URL: https://app.abarva.ai
Production deploy: dpl_6bYhy85nRq6rWCA69eepCZuePueT
Commit: 2a86962317661ad4ecce06c1f1a17359673f85e7
Captured: 2026-06-06T08:43:55.486Z
Result: 28/28 signed-in route screenshots passed sign-in and forbidden-client checks

| # | Area | Persona | Route | Status | Lakeshore label | Sign-in hits | Forbidden hits | Screenshot | Why captured |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | Home | CFO | `/home?client=lakeshore` | 200 | yes | - | - | `screenshots/01-home-home-client-lakeshore.png` | Landing proof for Lakeshore tenant and CFO persona. |
| 2 | Setup | CFO | `/admin/data-trust?client=lakeshore` | 200 | yes | - | - | `screenshots/02-setup-admin-data-trust-client-lakeshore.png` | Data trust / readiness control plane. |
| 3 | Setup | CFO | `/admin/setup?client=lakeshore` | 200 | yes | - | - | `screenshots/03-setup-admin-setup-client-lakeshore.png` | Setup/Admin tenant readiness entry. |
| 4 | Setup | CFO | `/admin/setup/cxo-intel?client=lakeshore` | 200 | yes | - | - | `screenshots/04-setup-admin-setup-cxo-intel-client-lakeshore.png` | CXO intel bundle index. |
| 5 | Setup | CIO | `/admin/setup/cxo-intel/cio?client=lakeshore` | 200 | yes | - | - | `screenshots/05-setup-admin-setup-cxo-intel-cio-client-lakeshore.png` | CIO context bundle proof. |
| 6 | Setup | CFO | `/admin/setup/cxo-intel/cfo?client=lakeshore` | 200 | yes | - | - | `screenshots/06-setup-admin-setup-cxo-intel-cfo-client-lakeshore.png` | CFO context bundle proof. |
| 7 | Intelligence | CIO | `/intelligence?client=lakeshore` | 200 | yes | - | - | `screenshots/07-intelligence-intelligence-client-lakeshore.png` | Intelligence home and tenant shell. |
| 8 | Intelligence | CIO | `/intelligence/ask?client=lakeshore` | 200 | yes | - | - | `screenshots/08-intelligence-intelligence-ask-client-lakeshore.png` | Ask experience for captured answer proof. |
| 9 | Intelligence | CIO | `/intelligence/t3-h01?client=lakeshore` | 200 | yes | - | - | `screenshots/09-intelligence-intelligence-t3-h01-client-lakeshore.png` | Pattern detail route that previously leaked Apex copy. |
| 10 | Intelligence | CIO | `/intelligence/patterns?client=lakeshore` | 200 | yes | - | - | `screenshots/10-intelligence-intelligence-patterns-client-lakeshore.png` | Pattern graph / corpus navigation. |
| 11 | Moves | CFO | `/strategic-moves?client=lakeshore` | 200 | yes | - | - | `screenshots/11-moves-strategic-moves-client-lakeshore.png` | Moves portfolio. |
| 12 | Moves | CFO | `/strategic-moves/1196dac0-715c-45ce-8eeb-5e70792d9aa4?client=lakeshore` | 200 | yes | - | - | `screenshots/12-moves-strategic-moves-1196dac0-715c-45ce-8eeb-5e70792d9aa4-client-lakeshore.png` | Kyriba Move workspace. |
| 13 | Moves | CFO | `/strategic-moves/1196dac0-715c-45ce-8eeb-5e70792d9aa4?tab=documents&client=lakeshore` | 200 | yes | - | - | `screenshots/13-moves-strategic-moves-1196dac0-715c-45ce-8eeb-5e70792d9aa4-tab-documents-client-lakeshore.png` | Kyriba Move documents/evidence. |
| 14 | Moves | CFO | `/strategic-moves/6a4c7fc4-0a2d-4479-b807-7350fb727527?client=lakeshore` | 200 | yes | - | - | `screenshots/14-moves-strategic-moves-6a4c7fc4-0a2d-4479-b807-7350fb727527-client-lakeshore.png` | Additional Lakeshore Move proof. |
| 15 | Source | CFO | `/source/events?client=lakeshore` | 200 | yes | - | - | `screenshots/15-source-source-events-client-lakeshore.png` | Source portfolio entry. |
| 16 | Source | CFO | `/source/compare?client=lakeshore` | 200 | yes | - | - | `screenshots/16-source-source-compare-client-lakeshore.png` | Source comparison proof. |
| 17 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=strategy&client=lakeshore` | 200 | yes | - | - | `screenshots/17-source-source-events-lsh-kyriba-treasury-2026-stage-strategy-client-lakeshore.png` | Kyriba Strategy stage. |
| 18 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=scope&client=lakeshore` | 200 | yes | - | - | `screenshots/18-source-source-events-lsh-kyriba-treasury-2026-stage-scope-client-lakeshore.png` | Kyriba Scope stage. |
| 19 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=rfp&client=lakeshore` | 200 | yes | - | - | `screenshots/19-source-source-events-lsh-kyriba-treasury-2026-stage-rfp-client-lakeshore.png` | Kyriba RFP stage. |
| 20 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=responses&client=lakeshore` | 200 | yes | - | - | `screenshots/20-source-source-events-lsh-kyriba-treasury-2026-stage-responses-client-lakeshore.png` | Kyriba Responses stage. |
| 21 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=evaluation&client=lakeshore` | 200 | yes | - | - | `screenshots/21-source-source-events-lsh-kyriba-treasury-2026-stage-evaluation-client-lakeshore.png` | Kyriba Evaluation stage. |
| 22 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=pricing&client=lakeshore` | 200 | yes | - | - | `screenshots/22-source-source-events-lsh-kyriba-treasury-2026-stage-pricing-client-lakeshore.png` | Kyriba Pricing stage. |
| 23 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=bafo&client=lakeshore` | 200 | yes | - | - | `screenshots/23-source-source-events-lsh-kyriba-treasury-2026-stage-bafo-client-lakeshore.png` | Kyriba BAFO stage. |
| 24 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=executive_decision&client=lakeshore` | 200 | yes | - | - | `screenshots/24-source-source-events-lsh-kyriba-treasury-2026-stage-executive-decision-client-lakeshore.png` | Kyriba Executive Decision stage. |
| 25 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=selection&client=lakeshore` | 200 | yes | - | - | `screenshots/25-source-source-events-lsh-kyriba-treasury-2026-stage-selection-client-lakeshore.png` | Kyriba Selection stage. |
| 26 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=transition&client=lakeshore` | 200 | yes | - | - | `screenshots/26-source-source-events-lsh-kyriba-treasury-2026-stage-transition-client-lakeshore.png` | Kyriba Transition stage. |
| 27 | Source | CFO | `/source/events/LSH-KYRIBA-TREASURY-2026?stage=value&client=lakeshore` | 200 | yes | - | - | `screenshots/27-source-source-events-lsh-kyriba-treasury-2026-stage-value-client-lakeshore.png` | Kyriba Value stage. |
| 28 | Tower | CFO | `/tower/source-portfolio-value?client=lakeshore` | 200 | yes | - | - | `screenshots/28-tower-tower-source-portfolio-value-client-lakeshore.png` | Tower value ledger / Source portfolio proof. |

## Truth Boundary

- This is signed-in live production evidence against `https://app.abarva.ai` using freshly regenerated Clerk session states for Lakeshore CFO/CIO agents.
- Pass means the route returned HTTP 200, did not render Clerk sign-in copy, and did not show known foreign-client copy strings: Apex Retail, Meridian Health, or SkyHarbor.
- Some admin/product surfaces use neutral shell text and do not render the literal Lakeshore label in body text; session priming separately verified Lakeshore Holdings on `/home`, `/tower`, and `/intelligence`.
- This capture does not prove Azure/private-plane endpoint readiness; that remains tracked separately.
