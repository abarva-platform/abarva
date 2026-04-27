# Intelligence - Sentinel Pattern Workspace

Source artifacts:

- Founder-authored DOCX: `docs/platform-design/wireframes/intelligence/INTELLIGENCE_WIREFRAME.docx`
- Normalized from `/Users/anand/Downloads/AbarVa_Wireframe_Specifications_Program_Intelligence_Tower/AbarVa_Intelligence_Wireframe_Specification.docx`

## 1. Page identity

- Canonical page name: `Intelligence - Sentinel Pattern Workspace`
- Routes:
  - `/tenant/[tenantSlug]/intelligence`
  - `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]`
- Surface: `Intelligence`
- Primary agent owner: `Sentinel`
- Secondary agents: `Nexus`, `Steward`, `Atlas`
- Primary user question: What patterns, risks, evidence gaps, and opportunities is Sentinel detecting for this tenant, and what should we do next?

## 2. Five-question test answers

- Where am I: shell and page header identify the tenant and `Intelligence`.
- What matters right now: Sentinel brief identifies the top active pattern and the impacted work object.
- What is blocked or at risk: evidence basis and gap card show unsupported claims and missing evidence.
- What does the agent recommend: recommended actions canvas shows the next action or handoff.
- What should I do next: action bar offers three context-aware moves plus custom.

## 3. Zone composition

- Zone A: canonical AbarVa shell with Intelligence active.
- Zone B: context strip for tenant, intelligence mode, top pattern, evidence confidence, and deterministic/live caveat.
- Zone C: Sentinel-led workspace with active pattern strip and one active canvas mode at a time: `Summary`, `Evidence`, `Programs`, `Actions`, `Signals`.
- Zone D: agent rail with Sentinel primary and contextual handoffs only.
- Zone E: drawers for evidence, pattern detail, source basis, program impact, and action/handoff detail.

## 4. ASCII wireframe with coordinate labels

```text
+------------------------------------------------------------------------------------------------------+
| [A-1] AbarVaLogo [A-2] Apex Retail - Rich [A-3] Home Programs Source Intelligence Tower Admin [A-4]|
+------------------------------------------------------------------------------------------------------+
| [B-1] Context: Intelligence - Sentinel - Top pattern: commercial variance - Evidence: partial       |
+------------------------------------------------------------------------------------------------------+
| [C-1] Intelligence Header                                            | [D-1] Agent Rail            |
| [C-2] Sentinel Editorial Brief                                       | [D-2] Sentinel Gap Card    |
| [C-3] Active Pattern Strip                                           | [D-3] Nexus Handoff        |
| [C-4] Summary | Evidence | Programs | Actions | Signals              | [D-4] Steward Blocker      |
| [C-5] Active Insight Canvas                                          | [D-5] Atlas Implication    |
| [C-6] Recommended Actions                                            | [D-6] 3 Suggestions+Custom |
| [C-7] Evidence / Source Basis Preview                                |                            |
| [C-8] Action Bar                                                     |                            |
+------------------------------------------------------------------------------------------------------+
| [E-1] Evidence, pattern, source basis, program impact, and handoff drawers                            |
+------------------------------------------------------------------------------------------------------+
```

## 5. Element catalog

- `A-1` Canonical logo and shell: no legacy chrome, no dark dashboard posture.
- `B-1` Context strip: must expose evidence confidence and deterministic/live caveat.
- `C-2` Sentinel editorial: evidence-first, context-first, and explicit about unsupported claims.
- `C-3` Pattern strip: horizontal list of active patterns with no icon spam.
- `C-5` Insight canvas: one active mode at a time, with evidence/source basis visible.
- `C-6/C-8` Recommended actions and action bar: context-generated, never generic.
- `D-2/D-4` Gap and governance cards: show evidence and readiness implications tied to the current pattern.

## 6. Click and interaction map

- Pattern chip -> updates active insight canvas and may open pattern detail drawer.
- Mode tab -> switches the active canvas without route change.
- Evidence item -> opens evidence drawer.
- Create Nexus workshop handoff -> opens handoff rationale; no action is executed automatically.
- Ask Sentinel -> opens a scoped contextual query path rather than a blank chat surface.

## 7. Agent editorial contract

- Authoring agent: `Sentinel`
- Required context bundle: tenant, patterns, source basis, evidence confidence, impacted work objects, missing inputs, context quality.
- Permitted modes: `status`, `diagnostic`, `recommendation`, `evidence`, `refusal_or_caveat`
- Voice contract: skeptical, evidence-oriented, and explicit about unsupported claims.
- Confidence rendering: supported/partial/low/blocked/unavailable aligned to evidence state.
- Forbidden behavior: no unsupported pattern claims, no hidden low-context state, no generic AI insight language.

## 8. Suggested actions specification

- Fresh load with full context:
  - Open evidence basis
  - Show impacted programs
  - Create Nexus workshop handoff
  - Custom
- Low-context tenant:
  - Show missing data
  - Open setup/data readiness guidance
  - Switch to Apex Retail rich demo
  - Custom
- Blocked evidence state:
  - List unsupported claims
  - Request evidence manifest
  - Ask Steward to review evidence usability
  - Custom

## 9. Workflow state rendering

- Intelligence state model: `observed -> evidence_partial -> evidence_supported -> action_recommended -> actioned/deferred`
- Pattern status variants: `active`, `monitoring`, `blocked_by_evidence`, `retired`
- Current state is reflected in the pattern chip and active canvas.
- Blocked states require explicit missing-evidence explanation.
- No click path may resolve a pattern without approved workflow support.

## 10. File attachment behavior

- Intelligence does not accept direct uploads on this page.
- Evidence enters through Source, Programs, Admin/Data, or a dedicated evidence surface on the originating work object.
- Intelligence can inspect evidence via drawers, but cannot create provenance-breaking uploads here.

## 11. Cross-surface consistency

- Pattern names and categories must match shared intelligence/pattern registries and Source commercial signals where connected.
- Evidence confidence must match any referenced evidence drawer or program evidence trace.
- Tenant data tier must match the demo dataset registry.
- Impacted programs and Source events must use canonical names and IDs.

## 12. Failure modes this page must prevent

- Generic AI insight blocks with no evidence basis
- Blank chat-first intelligence page
- High confidence when evidence is partial or missing
- Rich-demo intelligence shown for thin or shell-only tenants
- Pattern lists with no recommended next action or affected work object

## 13. Acceptance criteria

- Five-question test passes above the fold.
- Sentinel brief, active pattern strip, evidence/source basis, and next action render without opening a drawer.
- Low-context tenants visibly disclose missing data and never inherit Apex-level richness.
- Design canon stays warm, restrained, and workflow-first.

## 14. Persona walkthrough

- Persona: transformation lead or CIO reviewing cross-program and cross-source signals.
- Goal: understand which patterns are real, which are weakly supported, and what to do next.
- First three seconds: the user sees tenant context, the active pattern, evidence confidence, and Sentinel's recommendation.
- Turn 1: inspect evidence basis for the top pattern.
- Turn 2: review impacted programs or Source events.
- Turn 3: hand off a concrete follow-up to Nexus or Steward.
- Exit state: the user leaves with a real pattern judgment, not just an interesting signal.

