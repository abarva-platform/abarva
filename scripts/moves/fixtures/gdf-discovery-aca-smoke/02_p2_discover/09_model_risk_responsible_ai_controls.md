# Responsible AI and model-risk boundary

**SYNTHETIC - NOT CLIENT-ATTESTED.** No real model inventory, no approved
model-risk policy, and no production AI control attestation is represented here.

## Working model for the scenario

AI and LLM use on a healthcare data foundation must stay inside an explicit
boundary: it supports governed analytics and decision preparation, it does not
make autonomous clinical decisions, and it never consumes ungoverned PHI.

## Candidate control boundary

- No autonomous clinical or coverage decision: AI output is decision support,
  reviewed and owned by an accountable human.
- Models read only certified, versioned datasets and measures; raw PHI never
  reaches an ungoverned model path.
- Every model/AI feature records its intended use, its approved data inputs,
  and the human owner accountable for its output.
- Bias and fairness are reviewed across protected and clinically relevant
  populations before and during use; a measure that cannot be fairly computed
  is not shipped.
- Behavioral-health (42 CFR Part 2) and other specially protected data require
  an explicit approved basis before any model use.
- An AI output that influences care or coverage carries its lineage and a
  caveat when evidence is thin; it never asserts a savings, ROI, or clinical
  conclusion the evidence does not support.

## Test cases for design review

| Case | Expected behavior | Owner to confirm |
|---|---|---|
| Model asked to decide coverage autonomously | Refuse; route to accountable human | Responsible-AI owner |
| Raw PHI requested as model context | Block; require governed, minimized slice | Privacy owner |
| Population with too few cases for a measure | Suppress or abstain; do not fabricate | Clinical analytics owner |

## Still required before this is a client fact

The real model inventory, the approved model-risk policy, the fairness review
process, and the named responsible-AI owner are not established here and must be
confirmed with the client.
