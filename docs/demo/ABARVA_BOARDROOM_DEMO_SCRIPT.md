# AbarVa Boardroom Demo Script

Version: 1.0-demo
Date: 2026-04-26
Status: DEMO-READY (seed data only — see caveats section)

---

## Audience

Primary: CIO, CTO, CFO, CAIO, VP/Head of AI Transformation, Digital Transformation Lead
Secondary: Enterprise Architecture Lead, Head of AI/ML, Chief Data Officer

---

## Demo Versions

| Version | Duration | Depth | Best For |
|---------|----------|-------|----------|
| Sprint | 20 min | Home → Admin → Prod Readiness → Programs → Intelligence → Tower → Close | First meeting, C-suite time-box |
| Standard | 45 min | Full story arc | Champion meeting, detailed evaluation |
| Founder / Deep Dive | 90 min | Full arc + architecture + data plane + Azure reference | Technical co-evaluation, pilot scoping |

---

## IMPORTANT CAVEATS — READ BEFORE DEMOING

### What AbarVa currently is (as of 2026-04-26)

- A high-fidelity demonstration platform running on deterministic seed data.
- All program data, pattern detections, intelligence signals, Atlas briefs, and admin posture are pre-seeded read models. No live LLM calls are wired in the demo environment.
- The production readiness tracker shows real build status (35–40% overall product maturity, 65–70% demo/POC maturity).
- Agent architecture, data contracts, runtime safety gate contracts, and the enterprise trust framework are fully designed and documented in code; they are not yet wired to live infrastructure.

### What AbarVa will be at GA

- Full live agent runtime: Nexus, Sentinel, Atlas, and Steward running via a governed Model Gateway with per-tenant routing, audit ledger, and cost tracking.
- Live evidence ingestion, vector/graph retrieval, and real deliverable generation.
- Production audit trail, gate workflow, and approval/export pipeline.
- Azure VNet private deployment option with customer-managed keys and zero-egress guarantees.

### What NOT to claim in the demo

- Do NOT claim live LLM composition unless the demo environment has been explicitly configured for live calls.
- Do NOT claim real-time monitoring of Vercel/CI status — the Production Readiness Tracker reads from a deterministic manifest.
- Do NOT claim the evidence ledger is live — evidence IDs (E-###) are seeded, not fetched from a real retrieval backend.
- Do NOT claim deliverable download/export is production-ready — the artifact canvas is a shell.
- Do NOT claim agent memory persists across sessions in the demo environment.

---

## Story Arc

```
Home → Admin/Setup → Production Readiness → Programs → Program Workshop Mode
  → Meeting Notes / Proposed Updates → Deliverables / Artifact Canvas
  → Intelligence Patterns → AI Control Tower → Solution Intelligence
  → Data Trust / Private Data Plane narrative → Close / Ask
```

---

## 20-MINUTE VERSION — Sprint Demo

### Stop 1: Home (2 min)
**Route:** `/(maestro)/home`

**Talk track:**
"This is the executive's first 90 seconds in AbarVa. It is not a dashboard — it is a brief. Three paragraphs: where the AI portfolio stands, the strongest active pattern Sentinel has detected, and the single next move Atlas recommends. The goal is that any CIO can land here Monday morning and know exactly what to address before their first meeting."

**What to show:**
- The Atlas executive brief in the hero section — portfolio posture sentence, highest-pressure program callout, strongest active Sentinel pattern, single recommended next action.
- The metric strip below the brief — programs in motion, gates signed, programs under pressure.
- The "Open in Programs" routing chip that Nexus surfaces.

**What NOT to claim:** The brief is deterministic in this build, not live-composed by Atlas. In production, Atlas writes this brief fresh each session using the Model Gateway with full audit trail.

**Caveat:** All data is seeded. The program names, phase states, and pressure cards reflect the Apex Retail demo tenant.

---

### Stop 2: Admin / Setup (2 min)
**Route:** `/(maestro)/platform/admin`

**Talk track:**
"Before we look at programs, let me show you how an operator verifies that the tenant is ready to produce trustable guidance. Setup is Steward's room — it is not a settings page, it is a readiness control plane. Steward answers one question: is this tenant ready, and what is the single most leveraged thing to fix next?"

**What to show:**
- The Steward brief at the top naming the most leveraged next fix.
- The dataset domain inventory — 12 canonical domains, each showing loaded / available / usable-as-evidence counts.
- The agent readiness matrix — per-agent × per-domain readiness state.
- The Production Readiness Tracker panel showing the deterministic component status grid.
- Users & Access panel (read-only role/count surface for 7 canonical roles).

**What NOT to claim:** Live connector sync is not wired — domain inventory is seed-driven. Users panel is read-only; invite/edit/revoke are future capabilities.

---

### Stop 3: Programs (3 min)
**Route:** `/programs` or `/tenant/apex-retail/programs`

**Talk track:**
"This is AbarVa's portfolio canvas. Nexus runs the mastermind layer across all programs and tells the operator where to focus. The page reads like a private-banking statement: each row is a program, each column is a signal. You can see gate state, phase, value posture, and the Sentinel patterns that mention each program — without leaving this surface."

**What to show:**
- The Nexus portfolio brief and recommended action chip.
- The portfolio table — program codes, current phase, gate state, evidence posture, Steward name.
- Per-program value summary: projected vs realized.
- Click one program row to expand the per-program canvas inline.
- Point to the gate cap on the phase rail and explain: green = Steward signed; amber = missing inputs; red = blocked.

**What NOT to claim:** Programs are seed-driven — this is the Apex Retail demo tenant with four canonical programs (Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting). Live program editor and cross-tenant rollup are not in v2.

---

### Stop 4: Intelligence (3 min)
**Route:** `/(maestro)/intelligence`

**Talk track:**
"Intelligence is Sentinel's room. Sentinel does not chat — it surfaces patterns. Each pattern has a severity, a confidence score, a basis declaration (internal evidence from your tenant vs external research), and a recommended next action with a named handoff target. The discipline here is that basis is never silent: Sentinel always tells you whether it is reasoning from your evidence or from public research."

**What to show:**
- The Sentinel brief at the top — portfolio risk posture, hot pattern count, strongest signal callout.
- The Active Patterns strip — scroll through 3–5 cards showing severity, confidence, affected programs.
- Click one pattern card to open the Dynamic Insight Canvas: evidence trail with E-### IDs, basis declaration, recommended action, handoff target.
- Point to the internal vs external basis disclosure line.

**What NOT to claim:** Patterns are deterministic seed data, not live LLM-composed. Evidence IDs are pre-seeded — the real evidence drawer and live retrieval backend are deferred. Cross-tenant pattern rollups are not in v2.

---

### Stop 5: AI Control Tower (3 min)
**Route:** `/(maestro)/tower`

**Talk track:**
"The AI Control Tower is Atlas's room — the boardroom-ready operating brief for the entire AI portfolio. Atlas answers three questions in under three minutes: where does the portfolio stand, where is it at risk, and what is the next steering decision. The dark-surface Atlas Brief is the only place in the platform that uses dark chrome — the contrast is intentional. It signals that this is an executive decision surface, not an operational tool."

**What to show:**
- The Atlas Executive Brief in the dark-surface hero — portfolio posture, value at risk vs value secured, highest-pressure program, single next steering decision verb.
- The scorecard strip — programs in motion, gates signed, value secured, vendor concentration, run-rate.
- The pressure cards (≤ 3) — each card names a program, its pressure type, and links back to Programs.
- Point to one Tower subsurface (e.g., `/tower/projects` or `/tower/volumetrics`) to show depth.
- The "Ask Atlas" drawer entry point.

**What NOT to claim:** Atlas brief is deterministic in this build. Live spend/burn tracking and live throughput telemetry are seeded. Ask Atlas single-turn drawer is the only interaction mode; conversational chat is not in scope.

---

### Close (2 min)

See the "Close / Ask" section at the end of this document.

---

## 45-MINUTE VERSION — Standard Demo

Includes all 20-minute stops, plus:

### Stop 3B: Program Workshop Mode (5 min)
**Route:** `/tenant/apex-retail/programs/[programSlug]` (e.g., Contact Center AI program detail)

**Talk track:**
"Workshop Mode is where the Client Maestro prepares for, runs, and synthesizes a single program phase. Nexus prepares the pre-workshop brief before you walk in: objective, required attendees, pre-read list, agenda, likely tensions, and decisions needed. After the workshop, Nexus synthesizes what was captured into the phase artifact. The Maestro drives; Nexus supports."

**What to show:**
- The pre-workshop brief panel: objective, attendee list, agenda, questions to ask, decisions needed, evidence checklist.
- The current phase/gate state in the left journey rail — gate caps showing Steward-signed vs missing-inputs.
- The center-canvas active deliverable for the current phase.
- The gate readiness right rail when a gate cap is clicked.
- The recommended SME panel (names only — never auto-assigned).

**What NOT to claim:** Live model-composed brief authoring is deferred. Transcript ingestion is deferred — meeting notes are not live-parsed in the demo. Calendar/SME booking is not integrated. Sentinel does not speak during workshops; it surfaces patterns afterward.

---

### Stop 4B: Meeting Notes / Proposed Updates (4 min)
**Route:** Same program canvas, notes capture section

**Talk track:**
"After the workshop, Nexus synthesizes what the Maestro recorded into proposed updates to the program. This is the governance moment: Steward reviews, the Maestro approves, and the program state advances. Nothing advances without an explicit human decision."

**What to show:**
- The post-workshop synthesis state indicator (captured / pending / blocked).
- The proposed updates panel — Nexus lists what changed.
- The Steward gate readiness check before advancing.
- Point to the immutability discipline: no silent state changes.

**Caveat:** In the demo, proposed updates are deterministic. Live Nexus synthesis requires the Model Gateway, which is deferred to production infrastructure.

---

### Stop 5B: Deliverables / Artifact Canvas (4 min)
**Route:** Deliverable drawer from within the program canvas, or `/programs/[programId]` deliverables tab

**Talk track:**
"Every phase produces a decision-grade artifact. The artifact canvas shows the current deliverable for the phase — structured, versioned, and tied to the evidence that supports each claim. At GA, deliverables are generated by Nexus using the solution architecture composition contracts and reviewed by a human before advancing."

**What to show:**
- The deliverable artifact card in the per-program canvas.
- Click to open the DetailDrawerShell — deliverable type, phase, creation metadata.
- Point to the evidence citations (E-### IDs) tied to claims.
- Show the deliverables library for the phase if present.

**What NOT to claim:** Deliverable generation is not live in v2 — artifacts are seeded. Production HTML/Markdown renderer, versioning, approval workflow, and download/export are deferred.

---

### Stop 6: Solution Intelligence (4 min)
**Route:** `/(maestro)/source` or solution intelligence surfaces within the platform

**Talk track:**
"Solution Intelligence is AbarVa's pattern-driven architecture layer. For each AI initiative, the platform holds a solution archetype: the canonical build/buy/partner decision framework, the reference architecture pattern, the known failure modes, and the engagement path. When Nexus composes a workshop brief, it draws from Solution Intelligence to tell the Maestro which patterns apply and which risks to watch."

**What to show:**
- The solution archetype registry — list of canonical solution types.
- One archetype detail — build/buy/partner framework, architecture pattern, failure modes pack.
- The connection back to Programs: how a program's solution archetype drives the workshop brief.

**What NOT to claim:** SOL9 recommendation engine (live solution recommendation from program evidence) is deferred. Architecture draft generation and workshop-to-architecture live refinement are deferred.

---

## 90-MINUTE VERSION — Founder / Deep Dive

Includes all 45-minute stops, plus:

### Architecture Deep Dive (20 min)
**Route:** No specific route — whiteboard or architecture deck

**Talk track:**
"Let me walk you through the architecture that makes this trustable at enterprise scale. There are four agents: Nexus (the program orchestrator), Sentinel (the pattern detector), Atlas (the executive brief composer), and Steward (the governance enforcer). Every agent call goes through a central Model Gateway — a single choke point that enforces per-tenant routing policy, logs every model invocation, and writes to the audit ledger before any result is surfaced."

**What to show / cover:**
- Agent model: Nexus / Sentinel / Atlas / Steward — each agent's room, primary question, and handoff contracts.
- Model Gateway: per-tenant model routing policy matrix, cost tracking, prompt assembly, fallback strategy, and audit ledger write.
- Runtime Safety Gate (SEC1): the YES / NO / WAIVER / REVIEW gate that runs before any tool call, model call, evidence use, dataset access, export, or cross-agent handoff.
- Tool Layer: canonical tool registry (TOOL2), guarded tool calls, graph/vector/file/workflow/export tools — contract-defined, implementation in progress.
- Context Bundle: how each agent session assembles evidence, conversation history, dataset pointers, and disclosure metadata before any model call.
- Data plane: vector store, graph store, object store, evidence ledger, audit ledger, and tenant isolation envelope.

**Key architectural honesty points:**
- The Model Gateway is contract-defined and designed; the production implementation (live provider calls, real audit ledger writes) is the primary deferred item.
- All agent contracts enforce no-fabrication: agents are forbidden from presenting claims without evidence IDs or disclosure lines.
- The pattern graph (traversal beyond M1–M6) is designed; full traversal is deferred.

---

### Data Trust / Private Data Plane Narrative (15 min)
**When to present:** When the audience includes a CDO, CISO, data privacy lead, or when the prospect has raised data residency concerns.

**Talk track:**
"Before we talk about deployment options, let me be precise about what AbarVa touches and what it does not. AbarVa is a governed intelligence fabric, not a SaaS data processor. Your program evidence, meeting notes, and deliverables never leave your control boundary unless you explicitly authorize an export. Let me walk through the three deployment postures."

**Three postures:**

1. **Hosted (Default)**
   - AbarVa-managed infrastructure on Azure.
   - Tenant data is isolated at the database, vector, and graph layer — strict per-tenant row-level isolation enforced by the tenant isolation envelope (TEN2/TEN4 contracts).
   - Model calls go through AbarVa's Model Gateway to the configured provider (Azure OpenAI by default).
   - Audit log is AbarVa-managed; tenant can export on demand.
   - What to claim: tenant isolation, audit trail, no cross-tenant data exposure.
   - What NOT to claim: customer-managed keys are not yet implemented in hosted tier.

2. **Azure VNet Private Data Plane**
   - AbarVa deployed inside the customer's Azure subscription via VNet peering or private endpoint.
   - No data crosses the public internet — all model calls go through the customer's Azure OpenAI resource in their tenant.
   - Customer-managed keys for encryption at rest (Azure Key Vault integration).
   - Zero data exfiltration guarantee: AbarVa only reads from the customer's data plane; no telemetry, no model training on customer data.
   - What to claim: this deployment posture is the design target for regulated industries (financial services, healthcare, government).
   - What NOT to claim: Azure VNet deployment is not yet GA. It is a design commitment on the roadmap, not a shippable feature today.

3. **Air-gapped / On-premises (Future)**
   - Fully disconnected deployment using on-premises model hosting (e.g., Azure Stack, NVIDIA NIM).
   - Not on the current roadmap for pilot. Flag as a directional commitment only.

**Customer-managed keys narrative:**
"In the Azure VNet posture, every encryption key is held in the customer's Azure Key Vault. AbarVa never sees plaintext at rest. If you revoke the key, AbarVa's access is immediately severed. This is the architecture pattern enterprise security teams require for AI systems that process program strategy and evidence."

**What NOT to claim:**
- Azure VNet deployment is not yet GA. Do not promise a delivery date without a signed pilot agreement.
- Customer-managed keys are designed and on the roadmap; implementation is deferred.
- Zero-egress is a design principle, not a certified compliance posture today. A formal audit and certification process is required before claiming SOC 2 / ISO 27001 coverage of the private data plane.

---

### Enterprise Trust Narrative (10 min)
**Talk track:**
"Enterprise trust in an AI governance platform requires four things: data isolation, model auditability, human-in-the-loop enforcements, and the ability to explain every output. AbarVa is designed around all four."

**The four trust pillars:**

1. **Governed Intelligence Fabric**
   - No agent output is presented without provenance. Every pattern, brief, and recommendation carries a basis declaration (internal evidence or external research).
   - The no-fabrication rule is enforced at the type level in code — agents cannot return claims without evidence IDs or disclosure metadata.

2. **Human-in-the-Loop by Design**
   - Gates do not advance without Steward sign-off.
   - Deliverables are proposed by Nexus and approved by the Maestro — never auto-published.
   - Recommended SMEs are surfaced as suggestions, never auto-assigned.
   - Atlas briefs are framed as recommendations, not decisions.

3. **Audit by Default**
   - Every model call, tool invocation, evidence access, gate transition, and deliverable generation event is an audit row.
   - The audit ledger is immutable, per-tenant, and exportable.
   - The Runtime Safety Gate (SEC1) runs before any action and logs YES/NO/WAIVER/REVIEW decisions.

4. **Tenant Isolation**
   - No cross-tenant data exposure at any layer: database, vector store, graph store, or audit ledger.
   - The tenant isolation envelope (TEN2/TEN4) is enforced at every read path.
   - Tested via the canonical tenant isolation probe suite.

**What NOT to claim:** The audit ledger backend persistence is deferred to production infrastructure. The deterministic read model exists; the live write path is not yet wired.

---

## Close / Ask

### The Pilot Offer

**Talk track:**
"What we are proposing is a 90-day governed pilot. Here is exactly what that means."

**What the pilot includes:**

1. **Tenant setup** — AbarVa configures one tenant for your organization: data domain inventory, user roles, governance posture baseline, and connector scaffolding.
2. **Seed program** — We onboard one real AI program (an initiative already in flight) into the Programs surface. Program phases, gate criteria, and the pre-workshop brief are configured with your team.
3. **Workshop run** — Nexus prepares and synthesizes a live workshop session for one phase of that program. The Client Maestro walks in with a genuine AbarVa-generated brief and walks out with a synthesized artifact.
4. **Intelligence baseline** — Sentinel runs its pattern detection over the program evidence. We present the first Intelligence brief together with your team.
5. **Control Tower review** — Atlas generates the executive brief for the program portfolio. We present it to the CIO/CAIO together.
6. **Governance posture report** — Steward produces a tenant readiness report at the end of the pilot, naming gaps and recommended next actions.

**What the pilot does NOT include:**
- Live Model Gateway in production (hosted infrastructure will be provisioned; Azure VNet peering requires separate scoping).
- Integration with existing enterprise systems (Jira, Confluence, SharePoint, etc.) — connector scaffolding is seeded; live sync is a post-pilot milestone.
- Customer-managed key setup — available in the Azure VNet posture, scoped separately.

### Next Steps

1. Schedule a 2-hour technical deep-dive with the architecture team to validate the data plane posture required.
2. Identify the seed program: one real AI initiative in flight, with an owner willing to be the pilot Maestro.
3. Sign a 90-day pilot agreement. AbarVa provisions the tenant within one week of signature.
4. First workshop brief is ready within 10 business days of tenant provisioning.

---

## Route Reference Card

| Surface | Route | Primary Agent | Demo Status |
|---------|-------|---------------|-------------|
| Home | `/(maestro)/home` | Atlas | Seeded |
| Admin / Setup | `/(maestro)/platform/admin` | Steward | Seeded |
| Dataset Explorer | `/(maestro)/platform/data` | Steward | Seeded |
| Users & Access | `/(maestro)/platform/users` | Steward | Read-only seed |
| Programs Portfolio | `/programs` | Nexus | Seeded (Apex Retail tenant) |
| Program Workshop Mode | `/tenant/apex-retail/programs/[slug]` | Nexus | Seeded |
| Intelligence | `/(maestro)/intelligence` | Sentinel | Seeded |
| Intelligence Patterns | `/(maestro)/intelligence/patterns` | Sentinel | Seeded |
| Intelligence Briefing | `/(maestro)/intelligence/briefing` | Sentinel | Seeded |
| AI Control Tower | `/(maestro)/tower` | Atlas | Seeded |
| Tower Projects | `/(maestro)/tower/projects` | Atlas | Seeded |
| Tower Volumetrics | `/(maestro)/tower/volumetrics` | Atlas | Seeded |
| Tower Ask Atlas | `/(maestro)/tower/ask` | Atlas | Single-turn only |
| Source / Sourcing | `/(maestro)/source` | Steward | Partial shell |

---

## Known Caveats Summary

| Area | Current State | GA Target |
|------|---------------|-----------|
| Agent briefs (Atlas / Nexus / Sentinel / Steward) | Deterministic seed data | Live LLM composition via Model Gateway |
| Evidence IDs (E-###) | Pre-seeded, deterministic | Live retrieval from evidence ledger backend |
| Pattern detections | Pre-seeded, deterministic | Live Sentinel validation pipeline |
| Deliverable generation | Shell/seed | Live Nexus composition + human approval |
| Meeting notes ingestion | Not wired | Live transcript ingestion pipeline |
| Audit ledger | Write-path deferred | Production immutable audit ledger |
| Model Gateway | Contract-defined, not wired | Live per-tenant routing + cost tracking |
| Azure VNet private data plane | Design target on roadmap | GA deployment option |
| Customer-managed keys | Design target on roadmap | Azure Key Vault integration |
| CI / Vercel status | Static manifest, not polled | Live CI webhook + Vercel status polling |

---

## Competitive Positioning Notes

Do not position AbarVa against generic LLM wrappers or AI chat tools. The positioning is:

- **vs generic AI assistants (Copilot, ChatGPT enterprise):** AbarVa is a governed program-execution platform, not a query tool. It enforces human-in-the-loop at gate boundaries, maintains an audit trail, and produces decision-grade artifacts — not answers.
- **vs project management tools (Jira, Asana, ServiceNow):** AbarVa is not a ticket tracker. It is the intelligence layer above the work — it tells the Maestro what to do in the workshop before the ticket is created.
- **vs BI / analytics platforms:** AbarVa does not aggregate historical data — it guides forward-looking AI program execution with pattern-based guidance and evidence-anchored recommendations.

---

*Document created: 2026-04-26*
*Slice: DEMO1 — Boardroom Demo Script / Walkthrough*
*Build wave: wave-11 — Demo Readiness + Architecture Overview*
