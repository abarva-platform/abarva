# 11 SCORECARD GOVERNANCE

## Lifecycle

Default Generated -> Client Edited -> Rationale Added -> Reviewed -> Approved -> Locked -> Used for Vendor Evaluation

## Required Behavior

- pattern-pack default criteria and weights
- client override support
- total weight validation = 100%
- rationale required for material changes
- material-change flag when weight changes beyond threshold
- approval/lock before evaluation
- audit trail from default to customized model
- Nexus explanation of weighting tradeoffs
- Steward enforcement before evaluation begins

## Material Change

A material change occurs when:

- a criterion weight changes beyond threshold
- a criterion is added
- a criterion is removed
- evaluation meaning changes materially

Material changes require rationale and review.

## Default Scorecard: Data & AI Modernization Sourcing

| Criterion | Weight |
|---|---:|
| Data platform modernization capability | 20% |
| Migration factory / delivery approach | 15% |
| Domain/data model expertise | 15% |
| Cloud platform expertise | 15% |
| Governance/security/quality | 10% |
| Commercial model | 10% |
| AI/GenAI enablement roadmap | 10% |
| Change/adoption and operating model | 5% |

### Data & AI Modernization Weight Rationale

| Criterion | Why It Matters | Why Default Weight Is Reasonable | Increase Weight When | Decrease Weight When | Evidence Required |
|---|---|---|---|---|---|
| Data platform modernization capability | Core modernization capability determines whether the vendor can deliver the target data estate | 20% anchors the scorecard on the primary transformation outcome | platform migration is the main value driver or architecture risk is high | event is mainly analytics enablement or advisory | reference architecture, migration examples, platform certifications, delivery case studies |
| Migration factory / delivery approach | Determines repeatability, speed, quality, and transition risk | 15% balances delivery method with technical depth | large workload volumes or aggressive timeline | small scope or client controls migration factory | migration plan, sample backlog, tooling, quality controls |
| Domain/data model expertise | Data semantics and domain understanding affect adoption and usefulness | 15% gives business context equal importance to delivery method | domain complexity is high or data definitions are contested | domain model is already mature and client-owned | domain examples, semantic model approach, client references |
| Cloud platform expertise | Cloud execution risk is material for platform modernization | 15% reflects infrastructure, security, and tooling dependency | cloud migration or platform selection is central | target platform is already built and stable | certifications, architecture patterns, platform accelerators |
| Governance/security/quality | Poor governance undermines compliance, trust, and AI readiness | 10% ensures controls are material without dominating capability | regulated data, sensitive data, or AI use cases are in scope | non-sensitive internal analytics only | security requirements, data classification, quality framework |
| Commercial model | Pricing must support phases, uncertainty, and measurable outcomes | 10% keeps cost credible without letting price overpower risk | budget pressure or commercial complexity is high | vendor pool is prequalified and commercial structure is fixed | pricing template, assumptions, rate card, milestone model |
| AI/GenAI enablement roadmap | AI aspirations require realistic sequencing and data readiness | 10% recognizes strategic upside while avoiding hype overweighting | GenAI capability is central to business case | AI is exploratory or out of scope | roadmap, use cases, governance, proof points |
| Change/adoption and operating model | Adoption determines whether modernization creates value | 5% keeps it visible while acknowledging technical sourcing focus | business adoption is a major risk | event is technical foundation only | operating model, change plan, training/adoption evidence |

## Default Scorecard: AMS / Managed Services Sourcing

| Criterion | Weight |
|---|---:|
| Commercial competitiveness | 20% |
| Transition capability | 20% |
| Service delivery operating model | 15% |
| Technical/application portfolio fit | 15% |
| Automation / AI productivity roadmap | 10% |
| Risk, security, compliance | 10% |
| Cultural / stakeholder fit | 5% |
| Innovation / continuous improvement | 5% |

### AMS / Managed Services Weight Rationale

| Criterion | Why It Matters | Why Default Weight Is Reasonable | Increase Weight When | Decrease Weight When | Evidence Required |
|---|---|---|---|---|---|
| Commercial competitiveness | Managed services value often depends on run-rate improvement | 20% reflects savings importance while not letting price dominate | event is primarily cost takeout | continuity and risk outweigh savings | pricing template, volume assumptions, productivity commitments |
| Transition capability | Transition is the highest early failure risk in AMS | 20% gives transition equal weight to economics | incumbent transition is complex or timeline is tight | vendor is incumbent and transition risk is low | transition plan, KT model, Day 1 checklist, references |
| Service delivery operating model | The operating model determines daily service quality | 15% materially weights run effectiveness | multisupplier governance or global delivery is complex | scope is narrow and governance is simple | delivery model, escalation paths, governance cadence |
| Technical/application portfolio fit | Vendor must understand the application estate and support profile | 15% balances technical fit with operational model | portfolio is heterogeneous or critical | portfolio is standardized and well documented | app inventory, technical capability map, support examples |
| Automation / AI productivity roadmap | Automation drives sustainable savings but is often overclaimed | 10% recognizes upside with evidence discipline | automation is core to savings case | automation is speculative or not contracted | automation use cases, baseline, tooling evidence |
| Risk, security, compliance | AMS vendors often operate critical systems and sensitive processes | 10% ensures controls remain visible | regulated or mission-critical systems are in scope | low-risk internal apps only | compliance requirements, security controls, continuity plan |
| Cultural / stakeholder fit | Stakeholder trust affects transition and issue resolution | 5% keeps fit visible without making it subjective-heavy | high-touch business support is required | low-touch commodity support | stakeholder interview feedback, reference checks |
| Innovation / continuous improvement | Prevents service from becoming static cost management | 5% recognizes future value while limiting vague promises | improvement roadmap is part of contract value | event is pure stabilization | improvement examples, governance model, contractual mechanisms |

## Default Scorecard: Digital Product Build Vendor Selection

| Criterion | Weight |
|---|---:|
| Product delivery capability | 20% |
| UX/design and discovery approach | 15% |
| Architecture and engineering quality | 15% |
| Agile delivery model | 15% |
| Relevant domain experience | 10% |
| Commercial model | 10% |
| Security/compliance | 10% |
| Post-launch support model | 5% |

### Digital Product Build Weight Rationale

| Criterion | Why It Matters | Why Default Weight Is Reasonable | Increase Weight When | Decrease Weight When | Evidence Required |
|---|---|---|---|---|---|
| Product delivery capability | The vendor must turn ambiguous product goals into working releases | 20% anchors evaluation on delivery outcome | timeline is aggressive or scope uncertainty is high | internal team owns delivery leadership | release examples, delivery plan, product references |
| UX/design and discovery approach | Product success depends on user understanding and discovery quality | 15% gives design meaningful weight without overpowering engineering | user adoption risk is high | design is already complete and validated | discovery method, research examples, prototype quality |
| Architecture and engineering quality | Technical decisions shape maintainability, security, and scale | 15% balances build quality with product and delivery | integration complexity or scale risk is high | low-risk internal tool | architecture samples, engineering practices, code quality evidence |
| Agile delivery model | Delivery rhythm and transparency reduce build risk | 15% reflects need for predictable iteration | client needs frequent reprioritization | fixed scope and timeline are stable | sprint model, backlog approach, demo cadence |
| Relevant domain experience | Domain experience reduces ramp time and misinterpretation | 10% is material but not decisive | domain rules are complex | domain is straightforward or client provides SMEs | comparable work, references, domain accelerators |
| Commercial model | Commercial structure must handle uncertainty without misaligned incentives | 10% keeps price and contracting meaningful | scope uncertainty or milestone risk is high | rate card and scope are pre-approved | pricing model, assumptions, change control |
| Security/compliance | Product build can introduce data, access, and regulatory risk | 10% ensures controls are not deferred | sensitive data or regulated users are in scope | non-sensitive prototype only | security approach, compliance controls, threat model |
| Post-launch support model | Launch success depends on ownership after build | 5% keeps support visible without turning build into AMS | long-term vendor support is expected | internal team will own operations | support model, warranty, handoff plan |

## Validation Rules

- total weight must equal 100%
- rationale required for material changes
- locked scorecard is read-only
- evaluation cannot begin until approved and locked

## Anti-Patterns

- vendor scoring before scorecard lock
- hidden weight changes
- criteria without definitions
- rationale-free overrides
- generic scorecards unrelated to sourcing archetype
