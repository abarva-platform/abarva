# AbarVa — Trade Secret Register (T071)

_Companion to the **Trade Secret Policy** (`docs/ip/trade-secret-policy.md`, T070). This register identifies the
specific assets AbarVa protects as trade secrets, where they live, why they qualify, and the marking applied.
Last updated 2026-06-10._

## Ownership context
Trade-secret ownership flows to the company via founder/employee **IP assignment** (T005/T075). For the record:
- **Entity:** Abarva, Inc. (Delaware C-Corp; brand styled "AbarVa") — formed via Stripe Atlas.
- **Founder / CEO:** Anand Shanmugasundaram · **Co-founder:** Abarna Sivarajan.
- All pre-existing AbarVa IP is assigned to the company under the founder IP-assignment agreement (T005).
- Anyone who touches code, prompts, or corpus signs an **NDA + IP assignment before access** (T075). No exceptions.

## Marking convention
- **Source files:** a header banner `AbarVa Confidential — Trade Secret (TS-NN)` referencing this register.
- **Documents:** `AbarVa Confidential — Trade Secret` in the header/footer.
- **Access:** least-privilege; NDA + IP assignment on file before access; access reviewed periodically.
- **Never** publish externally, paste into support tickets/marketing, or send outside the tenant boundary / to any
  model context that leaves the governed boundary.

## Register

| ID | Trade secret | Representative location(s) | Why it qualifies | Disposition |
|---|---|---|---|---|
| **TS-01** | Agent system prompts / synthesis instruction sets (Sentinel, Nexus, Atlas, Steward, Maestro) | `src/lib/intelligence/ask/synthesizer.ts`, `src/lib/intelligence/synthesis-prompts.ts`, agent prompt modules | Tuned over many iterations; not public; the direct driver of answer quality | Trade secret — marked |
| **TS-02** | Specialist routing logic (one-front-agent → many specialists) | agent orchestration / dispatcher modules | Differentiating architecture; non-obvious | Trade secret — implementation secret; the *pattern* is defensively published (T073) |
| **TS-03** | Corpus curation methodology (how governed patterns + genome patterns are authored, scored, deduped, overlaid) | `src/lib/corpus/authoring.ts`, corpus pipeline | The "industry genome" moat; cost + judgment to reproduce | Trade secret — marked; the corpus DB asset also gets copyright registration (T069) |
| **TS-04** | Evaluation rubrics / quality gates (grounding, citation, non-fabrication, leakage scoring) | `src/lib/agent-eval/`, QA harnesses | Encodes what "good" means; competitive yardstick | Trade secret — marked |
| **TS-05** | Governed retrieval + promotion-gate logic (context↔corpus fusion, agent_ready gating, tenant fencing) | `src/lib/governance/context-corpus-policy.ts`, `src/lib/retrieval.ts`, context-bundle | Core mechanism tying data quality to answer trust | Trade secret — marked; broker boundary *contract* is defensively published (T072), implementation stays secret |
| **TS-06** | Tenant context templates + ingestion mappings (multi-dimension enterprise model, template registry) | `src/lib/enterprise-context/` (template-schema, loaders) | The schema that turns messy enterprise data into governed facts | Trade secret |
| **TS-07** | Growth / GTM playbooks + pricing/cost model | pricing & cost-model artifacts, sales docs | Commercial strategy; not public | Trade secret (business) |
| **TS-08** | Customer/tenant data + derived facts | private Azure data plane (`enterprise_context_*`) | Client-confidential by contract; PHI/PII-adjacent | **Confidential + contractual** (processor obligation; RLS + tenant isolation enforced) — not company-owned IP |

## Disposition rule (per asset)
- **Keep secret** when value comes from *not being known* and it's hard to reverse-engineer (TS-01, TS-03, TS-04, TS-06, TS-07).
- **Defensively publish the pattern** (not the implementation) to block others patenting it against you (TS-02, TS-05 → T072–T074).
- **Copyright** the expressive corpus database (TS-03 asset → T069).
- **Patent** only a novel, hard-to-keep-secret mechanism — capture candidates via the invention-disclosure form (T076).

## Evidence (T071 "Done")
- This register: `docs/ip/trade-secret-register.md`.
- Marked sample set (header banner applied): `context-corpus-policy.ts`, `synthesizer.ts`, `corpus/authoring.ts`, `agent-eval/index.ts`.
- Access review + NDA coverage confirmation: tie to T075 (NDA + IP assignment template) before broad access is granted.
