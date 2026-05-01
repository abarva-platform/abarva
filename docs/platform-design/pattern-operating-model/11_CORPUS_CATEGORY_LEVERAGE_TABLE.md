# Corpus Category Leverage Table

| Category | What Is In It | Example IDs | How A Program Leverages It |
|---|---|---|---|
| `pattern` | Reusable execution playbooks mapped to failure modes, lifecycle phases, and sourcing stages. Includes concrete signals, manifestations, consequences, and cross-industry variants. | `PAT-FM-03-DUAL-RUN-CUTOVER`, `PAT-FM-06-GOVERNANCE-RISK-PLAYBOOK` | Use in steering and program design to select preventive controls before failure occurs. Inject as primary retrieval context for Nexus/Atlas during delivery planning. |
| `anti-pattern` | Failure signatures and traps with recognition signals and evidence of degradation. | `ANT-FM-03-BIG-BANG-MIGRATION`, `ANT-FM-08-PILOT-TO-PROD-TRAP` | Use as a risk triage checklist in weekly governance; route to Steward for control escalation when triggers appear. |
| `solution-architecture` | Cloud + platform assembly patterns for modernization, with component-level structure and lifecycle relevance. | `SA-DF-LAKEHOUSE-AZURE`, `SA-FS-RISK-LAKEHOUSE-AWS` | Use in architecture decision forums to compare options and accelerate approved reference patterns with known tradeoffs. |
| `deliverable-template` | Structured output formats for charters, value trees, readiness packs, and governance artifacts with section scaffolds. | `DEL-CHARTER-AI-PROGRAM-V1`, `DEL-ROADMAP-V1` | Use for program artifact generation so operator outputs stay consistent and auditable across phases and teams. |
| `decision-framework` | Explicit decision logic with dimensions and worked examples for recurring executive/program choices. | `DF-BUILD-VS-BUY-AI-COMPONENT`, `DF-PRIORITIZE-USE-CASES-V1` | Use at decision gates (P1-P3, Evaluation/BAFO) to reduce ad-hoc choices and improve traceable tradeoff decisions. |
| `evidence-template` | Evidence artifact specs and acceptance criteria for value, risk, quality, cutover, and control verification. | `EV-P1-BASELINE-METRIC-CAPTURE`, `EV-CONTROL-TEST-V1` | Use as mandatory completion criteria before phase exits so value/risk claims are evidenced, not asserted. |
| `industry-source-system` | Profiles of major source systems by industry, including data model and integration modernization considerations. | `SYS-HC-EPIC-CLARITY`, `SYS-FS-FISERV-DNA`, `SYS-RT-SALESFORCE-COMMERCECLOUD` | Use for discovery and migration planning to anchor recommendations in source-system realities, not generic guidance. |
| `vendor-implementation` | Vendor-specific implementation overlays linked to architecture/pattern parents with capability boundaries and assumptions. | `VI-LAKEHOUSE-DATABRICKS`, `VI-SNOWFLAKE-IMPLEMENTATION` | Use for implementation planning and vendor comparison in-context; connect abstract strategy to concrete build path. |
| `regulatory-frame` | Regulation-specific operational control mappings with applicability, required controls, and audit evidence expectations. | `REG-US-FED-HIPAA-PRIVACY-RULE`, `REG-EU-GEN-AI-ACT` | Use to enforce governance-by-design: pre-filter options by compliance viability and evidence burden before committing. |

## How this maps to agent behavior

- `Nexus`: prioritizes `pattern`, `deliverable-template`, `decision-framework`, and contextual `industry-*` namespaces.
- `Sentinel`: synthesizes `industry-source-system`, `solution-architecture`, `vendor-implementation`, and `regulatory-frame` for intelligence answers.
- `Atlas`: uses `pattern`, `solution-architecture`, and `vendor-implementation` for portfolio-level reasoning.
- `Steward`: emphasizes `regulatory-frame`, `anti-pattern`, and `evidence-template` for control posture and escalation.
