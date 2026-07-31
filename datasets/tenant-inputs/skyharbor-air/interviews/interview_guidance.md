# Airline Demo Interview Guidance

Use this interview pack to create candidate-only planning context for global airline. Interview rows must reveal priorities, blockers, data readiness, vendor/control evidence, budget/value baselines, and module-readiness gaps.

Rules:
- Use Airline Demo in AbarVa-facing pages.
- Keep SkyHarbor Air only as a physical/source label.
- Treat unanswered or weak answers as context gaps, not invented facts.
- Do not claim realized value, production use, active tenant truth, or live customer/passenger/account evidence.
- Every answer row must retain evidence_id, source_row_id, confidence, candidate_contract_version, load_run_id, generated_at, source_type, and truth_statement.

## Question design (regenerated 2026-07-31)

Each of the 18 stakeholder groups has its own role-specific question set (~12 questions,
one per `question_category` in `interview_question_bank.csv`). Questions and answers must not be
templated across roles: a CIO question about application-portfolio technical debt and a CTO
question about cloud-migration maturity are not interchangeable, and neither should reduce to the
same underlying sentence with the noun swapped out.

- Technical roles (CIO, CTO, CDAO, CISO, Enterprise architecture, Application owner, IT service
  management) must, across their 12 questions, genuinely cover: modernization plan/roadmap,
  technical/operational challenges, data quality issues, platform/organizational maturity, and
  cloud journey (current state, target state, blockers). These are must-have themes, not optional.
- `system_or_vendor_mentioned`, `data_domain_mentioned`, and `metric_mentioned` must be populated
  on every row where the answer content supports it (which is nearly every row) with specific,
  airline-realistic names, not left empty.
- No two `synthetic_answer` values may share a distinctive multi-word phrase. Each answer should be
  independently written, not derived from a shared template sentence with a topic name substituted
  in. Cross-referencing the same underlying initiative or system from different stakeholder vantage
  points (e.g. a contact-center modernization program discussed by IT, security, the contact-center
  leader, and finance) is encouraged and is different from boilerplate reuse.
