// stage-playbooks.ts
//
// 10-stage procurement methodology playbook library.
// Injected into the Sentinel system prompt when a Source tracker stage is active,
// giving the agent stage-appropriate, expert-level guidance instead of generic answers.
//
// Keys must match the exact stage label strings used in the Source tracker UI.

export const STAGE_PLAYBOOKS: Record<string, string> = {
  Plan: `
STAGE: Plan — Procurement Strategy & Scoping

Definition: Establish the strategic foundation before any supplier engagement. This stage transforms a business need into a structured procurement programme with approved mandate, budget, and timeline.

Key buyer activities:
- Conduct make-vs-buy analysis and document the case for external supply; confirm category ownership and escalation paths
- Run stakeholder alignment workshops to capture requirements from technical, commercial, legal, and business owners
- Execute market sounding (desk research, analyst briefings, informal supplier conversations) to validate feasibility and baseline pricing
- Define category strategy: preferred route to market (open tender, direct award, framework call-off), sustainability criteria, and diversity targets
- Secure budget approval and sign-off on a Requirements Document that is version-controlled and traceable

Risks to watch: Scope creep before RFI launch; under-resourced evaluation team; legal not engaged early enough; requirements authored by a single stakeholder without cross-functional review.

Gate criteria before advancing: Board-approved budget line confirmed in writing; Requirements Document signed off by all functional owners; Procurement timeline published; make-vs-buy decision documented and accepted.

Outputs: Requirements Document v1.0, Procurement Strategy Brief, stakeholder RACI, indicative budget envelope, high-level timeline.
`.trim(),

  RFI: `
STAGE: RFI — Request for Information / Market Engagement

Definition: A no-commitment market intelligence exercise to map the supplier landscape, assess capability maturity, and build a qualified long list before issuing any competitive tender.

Key buyer activities:
- Issue structured RFI questionnaire covering: company profile, financial health (last 2 years accounts), relevant reference clients, technical capability, implementation methodology, data security posture, and indicative pricing ranges
- Conduct analyst briefings (Gartner, Forrester, IDC) and peer-reference calls to supplement vendor self-reporting
- Assess financial viability: Dun & Bradstreet scores, credit ratings, ownership structure, key-person dependency
- Complete a Capability Matrix scoring each respondent across agreed dimensions (usually 5–8 criteria weighted by strategic priority)
- Long-list 6–10 vendors; exclude non-compliant or financially marginal respondents with a written rationale

Risks to watch: Receiving low-quality RFI responses due to poor question design; over-relying on brand recognition instead of evidence; failing to include emerging challengers who may outperform incumbents.

Gate criteria before advancing: Capability Matrix populated and peer-reviewed; shortlisting criteria agreed and documented by stakeholder panel; minimum 6 qualified respondents assessed.

Outputs: Supplier Capability Matrix, long list of 6–10 vendors with scoring summary, shortlisting criteria document.
`.trim(),

  Shortlist: `
STAGE: Shortlist — Vendor Qualification & Down-Selection

Definition: Rigorous evaluation of RFI responses to narrow the field to 3–5 vendors capable of responding meaningfully to a full RFP. Protects the evaluation team's bandwidth and signals market seriousness.

Key buyer activities:
- Score each long-listed vendor against the agreed Capability Matrix using a blind or panel-reviewed process; document scoring rationale for audit trail
- Conduct structured reference checks: minimum 2 client references per vendor, covering implementation quality, support responsiveness, and commercial relationship
- Run financial viability screening: review audited accounts, check for change-of-control risk, confirm insurance levels meet minimum thresholds
- Issue preliminary Due Diligence questionnaires where data security or regulatory compliance is material (e.g., GDPR, FedRAMP, ISO 27001)
- Hold shortlist rationale review with stakeholder panel; document and approve final shortlist of 3–5 vendors

Risks to watch: Panel bias toward known incumbents; reference check fatigue (all references are pre-selected wins); financial screening missed for smaller challengers.

Gate criteria before advancing: Shortlist of 3–5 vendors formally approved by stakeholder panel; written rationale documented for each inclusion and exclusion; legal and procurement director sign-off obtained.

Outputs: Scored Capability Matrix with shortlist rationale, vendor shortlist approval memo, due diligence summaries.
`.trim(),

  RFP: `
STAGE: RFP — Request for Proposal

Definition: The formal competitive tender stage. A fully specified RFP document invites shortlisted vendors to submit binding technical and commercial proposals against a consistent evaluation framework.

Key buyer activities:
- Draft a detailed Requirements Document translated into RFP Sections: company background, scope of work, functional and non-functional requirements, implementation approach, SLA specifications, pricing template (fixed, T&M, or outcome-based), and contractual terms summary
- Design the Evaluation Scorecard: define mandatory (pass/fail) criteria, weighted technical categories, and commercial scoring methodology before RFP issue to prevent post-hoc scoring manipulation
- Establish submission format and compliance checklist: page limits, mandatory appendices, pricing template lock (no deviations accepted), and submission portal/deadline
- Issue RFP to shortlisted vendors with a cover letter confirming the procurement timetable, evaluation process, and no-collusion declaration requirement
- Conduct RFP review and approval internally before issue — legal, commercial, and technical sign-off required

Risks to watch: Ambiguous requirements leading to non-comparable proposals; pricing template flexibility enabling comparison difficulties; evaluation scorecard not finalised before proposals received (manipulation risk).

Gate criteria before advancing: RFP document approved by legal, commercial, and technical stakeholders; evaluation scorecard locked and stored in sealed record before any proposals received.

Outputs: RFP document (final issued version), evaluation scorecard, no-collusion declaration template, RFP issue confirmation log.
`.trim(),

  "Q&A": `
STAGE: Q&A — Clarification Period

Definition: A structured window for shortlisted vendors to seek clarification on RFP requirements. All questions and answers are shared simultaneously with all bidders to maintain competitive fairness and prevent information asymmetry.

Key buyer activities:
- Publish a Q&A submission deadline and confirm all questions must be submitted in writing via the procurement portal (no verbal clarifications accepted)
- Triage incoming questions: categorise as (a) genuine scope ambiguity requiring a formal answer, (b) commercially sensitive fishing requiring deflection, or (c) out-of-scope requiring no response
- Draft answers collaboratively with technical, legal, and commercial owners; obtain sign-off before publishing
- Issue all Q&A responses simultaneously to all shortlisted vendors in a numbered Q&A log; update the RFP document or issue a formal addendum if scope is materially clarified
- Close the Q&A log formally on the published deadline; confirm final clarifications constitute the definitive tender specification

Risks to watch: Allowing verbal or bilateral clarifications that give one vendor an information advantage; scope changes introduced through Q&A that materially alter the original requirement; Q&A log not maintained creating audit gaps.

Gate criteria before advancing: Q&A log formally closed and communicated to all vendors; any scope changes documented as formal addenda with version control; all vendors confirm receipt of final clarification pack.

Outputs: Numbered Q&A log (all questions and answers), any RFP addenda, final clarification confirmation letter issued to all vendors.
`.trim(),

  "Initial-Bid": `
STAGE: Initial-Bid — First Pricing Submission & Technical Proposal Review

Definition: Receipt and initial evaluation of first-round vendor proposals. This is a diagnostic stage — the goal is to understand the commercial landscape, identify non-conformances, and establish a baseline before negotiation.

Key buyer activities:
- Receive proposals by the submission deadline; log receipt and confirm acknowledgement to all vendors immediately
- Run compliance check against the mandatory criteria and submission format checklist: non-compliant proposals are scored zero on affected criteria or excluded if a mandatory requirement is missed
- Evaluate technical proposals against the locked evaluation scorecard; use panel scoring to reduce individual bias; log non-conformances and deviations from requirements
- Analyse pricing submissions: decompose total cost of ownership (TCO) across implementation, licence/subscription, integration, support, and exit/transition; normalise to a common comparison basis
- Produce an Initial-Bid Evaluation Report summarising technical scores, commercial ranges, and key non-conformances per vendor

Risks to watch: Evaluators sharing scores between themselves before independent scoring is complete; non-conformances logged but not followed up; pricing comparison based on headline number rather than TCO.

Gate criteria before advancing: All proposals received; compliance check complete and documented; panel scoring independently completed and consolidated; non-conformances formally notified to relevant vendors.

Outputs: Compliance check log, scored evaluation matrix (initial), TCO comparison model, Initial-Bid Evaluation Report, non-conformance notification letters.
`.trim(),

  BAFO: `
STAGE: BAFO — Best and Final Offer

Definition: The final competitive negotiation round. Vendors are invited to submit their best and final commercial and technical position. BAFO responses are binding commitments — there is no further negotiation after evaluation.

Key buyer activities:
- Issue BAFO invitation letter to 2–3 vendors (down-selecting from initial-bid field); include: specific areas for improvement (price levers, SLA uplifts, commercial term changes), a revised pricing template, and a firm deadline — no extensions
- Conduct bilateral negotiation sessions before BAFO close: use competitive tension explicitly ("another vendor has addressed X, we expect you to match or exceed"); push on: unit pricing, implementation risk transfer, payment milestones, warranty periods, exit provisions
- Identify price levers: volume commitments, payment terms acceleration, multi-year lock-in in exchange for rate card reduction, reduced scope optionality
- Evaluate BAFO responses against the updated scorecard; re-run TCO model with final pricing; document final technical and commercial scores
- Hold evaluation panel consensus session; agree final ranking; escalate to required authority if delta between #1 and #2 is within a stated threshold

Risks to watch: Vendors retracting commitments made in BAFO (BAFO is binding — enforce this); procurement team revealing the winning position to a vendor before award; evaluation panel scoring shifting to match a preferred outcome.

Gate criteria before advancing: BAFO responses received by all invited vendors; evaluation panel scores finalised, documented, and signed by panel members; recommended vendor identified with full rationale; approval authority notified.

Outputs: BAFO invitation letters, bilateral negotiation records, updated TCO model, BAFO evaluation report, panel scoring sign-off sheet.
`.trim(),

  Selection: `
STAGE: Selection — Vendor Award Decision & Approvals

Definition: The formal vendor selection decision. An evaluation panel rationale is documented, the selection is approved by the required authority, and legal negotiation of the contract commences. No commitment is made to vendors until approval is obtained.

Key buyer activities:
- Prepare Award Recommendation Paper: summarise evaluation methodology, scoring outcomes, BAFO results, TCO comparison, and a clear recommendation with supporting rationale; include risk assessment of the recommended vendor
- Present to the approval authority (CPO, CFO, board committee, or delegated approver per the Scheme of Delegation); obtain written approval before communicating to vendors
- Initiate legal review of Heads of Terms and preferred contractual framework; identify material negotiation points (liability caps, IP ownership, data protection schedules, termination rights)
- Issue standstill notification to unsuccessful vendors (mandatory in regulated procurement; best practice in commercial); document debrief availability
- Commence contract negotiation with preferred vendor; track open commercial and legal points in a Negotiation Issues Log

Risks to watch: Approval authority not engaged early enough and delaying award; verbal commitments made to the preferred vendor before written approval obtained; standstill period not observed creating legal challenge exposure.

Gate criteria before advancing: Written award approval obtained from required authority; standstill period complete (or explicitly waived with legal sign-off); Heads of Terms agreed; contract negotiation formally commenced.

Outputs: Award Recommendation Paper, approval authority sign-off, standstill notification letters, Heads of Terms, Negotiation Issues Log.
`.trim(),

  Award: `
STAGE: Award — Contract Execution & Programme Mobilisation

Definition: The commercial relationship is formally established. Both parties execute the contract, implementation timelines are confirmed, governance structures are activated, and the incumbent supplier (if replacing one) is formally notified.

Key buyer activities:
- Execute the contract: ensure all schedules (SLA schedule, data processing agreement, pricing schedule, change control procedure) are final, initialled, and signed by authorised signatories on both sides; store executed copies in the contract management system
- Confirm implementation timeline, project governance structure (steering committee, operational cadence, escalation path), and first milestone dates in writing
- Set SLA baselines: document initial performance benchmarks, measurement methodology, reporting cadence, and remedies framework (service credits, step-in rights, termination for cause triggers)
- Notify the incumbent supplier per contractual notice requirements; activate transition and exit plan; confirm data return/destruction obligations
- Issue internal award announcement and activate the contract management framework; assign a named contract manager

Risks to watch: Contract executed but not registered in contract management system (creating renewal/obligation blind spots); SLA baselines set without agreeing measurement methodology; incumbent transition plan not activated promptly.

Gate criteria before advancing: Contract fully executed by both parties (wet or digital signatures confirmed); implementation timeline agreed in writing; SLA baselines documented; incumbent notified; contract registered in contract management system.

Outputs: Executed contract (all schedules), implementation timeline, SLA baseline register, incumbent notification letter, contract management framework activation record.
`.trim(),

  Onboard: `
STAGE: Onboard — Vendor Integration, Go-Live & Hypercare

Definition: The operational phase begins. The vendor delivers initial integration and knowledge transfer; the buyer validates technical and commercial readiness; a hypercare period provides elevated support before steady-state operations are confirmed.

Key buyer activities:
- Execute the go-live checklist: confirm system integration testing (SIT) and user acceptance testing (UAT) sign-off, data migration validation, user training completion, and rollback plan readiness before production cutover
- Run hypercare period (typically 30–90 days post go-live): elevated support SLA, daily stand-ups between buyer and vendor delivery teams, accelerated issue triage and resolution
- Validate first invoice against contract pricing schedule and milestone acceptance criteria; reject non-compliant invoices promptly and document the basis for rejection
- Establish relationship governance cadence: operational review (monthly), service review (quarterly), strategic review (annually); confirm attendees, agenda templates, and action log ownership
- Conduct a post-implementation review (PIR) at hypercare exit: measure outcomes against business case KPIs, document lessons learned, and identify improvement actions for the steady-state relationship

Risks to watch: Hypercare period ending without formal sign-off (leaving ambiguity about when steady-state SLAs apply); invoice validation deferred creating accruals uncertainty; governance cadence agreed but not activated.

Gate criteria before advancing (to steady-state Operate): Hypercare period formally signed off by buyer and vendor; all critical go-live checklist items resolved; first invoice validated and approved; governance cadence first cycle completed; PIR documented and shared.

Outputs: Go-live checklist sign-off, hypercare exit report, first invoice validation record, governance cadence schedule, post-implementation review.
`.trim(),
};

export function getStagePlaybook(stage: string | null | undefined): string | null {
  if (!stage) return null;
  return STAGE_PLAYBOOKS[stage] ?? null;
}
