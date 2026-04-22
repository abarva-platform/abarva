-- Migration 20260422010100 · diagnostic charter template content
--
-- Why: populate template content for the existing diagnostic_charter
-- deliverable type without overwriting rows that are already populated.

BEGIN;

UPDATE deliverable_types
SET
  template_structure = '{
    "sections": [
      {
        "key": "problem_definition",
        "title": "Problem Definition",
        "required": true,
        "description": "State the operational or strategic problem in sponsor language, including why it matters now.",
        "example_completed": "Store labor is being consumed by low-value inventory checks, while same-store sales pressure requires associates to spend more time with customers."
      },
      {
        "key": "sponsor_and_decision_needed",
        "title": "Sponsor + Decision Needed",
        "required": true,
        "description": "Name the accountable sponsor and the specific decision they must be prepared to make at the end of Diagnose.",
        "example_completed": "Sponsor: Priya Patel, VP Store Operations. Decision needed: approve AI-assisted store workflows for a 60-store pilot with labor and change-management funding."
      },
      {
        "key": "baseline_metrics",
        "title": "Baseline Metrics",
        "required": true,
        "description": "Capture the current-state metrics that anchor the case for action and will be reused in Verify.",
        "example_completed": "Baseline: 23 minutes average daily task-search time per associate, 61% on-time replenishment completion, 2.8% same-store sales drag in pilot cohort stores."
      },
      {
        "key": "root_cause_hypotheses",
        "title": "Root-Cause Hypotheses",
        "required": true,
        "description": "Separate what is confirmed from what remains a working hypothesis, and tie each to evidence.",
        "example_completed": "Confirmed: fragmented tasking tools create duplicate work. Hypothesis: store-level exceptions are underreported because managers normalize workarounds."
      },
      {
        "key": "diagnostic_evidence",
        "title": "Diagnostic Evidence",
        "required": true,
        "description": "Summarize the evidence collected so far: turns, patterns, and relevant peer decisions.",
        "example_completed": "Evidence includes sponsor intake turns, two active operating-model patterns, and three peer programs that reduced time-to-task completion after workflow unification."
      },
      {
        "key": "first_win_scope",
        "title": "First-Win Scope",
        "required": true,
        "description": "Define the smallest credible first-win scope to carry into Design.",
        "example_completed": "First win: receiving, replenishment, and exception handling workflows for 60 stores across two formats, excluding full labor-scheduling redesign."
      },
      {
        "key": "success_criteria",
        "title": "Success Criteria",
        "required": true,
        "description": "List the measurable conditions that would justify moving from Diagnose into Design.",
        "example_completed": "Move forward only if the team can show a 15%+ task-time reduction path, clear systems ownership, and sponsor agreement on pilot stores and baseline metrics."
      },
      {
        "key": "decision_required_by_end_of_phase_1",
        "title": "Decision Required by End of Phase 1",
        "required": true,
        "description": "State the explicit end-of-phase decision and the unresolved items that still need sponsor confirmation.",
        "example_completed": "Approve the pilot design brief, named pilot stores, and baseline metric pack; unresolved items are labor-allocation guardrails and field enablement ownership."
      }
    ],
    "format": "markdown",
    "rendering_notes": "Keep the document concise and sponsor-readable. Mark uncertain points as hypotheses, not facts, and preserve section order exactly."
  }'::jsonb,
  quality_rubric = '[
    {
      "criterion": "baseline_is_quantified",
      "rationale": "The diagnostic charter is not useful unless it locks quantified baselines that can be carried into Design and Verify.",
      "severity": "blocker"
    },
    {
      "criterion": "hypotheses_are_labeled_honestly",
      "rationale": "The document must distinguish confirmed facts from working hypotheses so the sponsor is not misled about certainty.",
      "severity": "blocker"
    },
    {
      "criterion": "claims_cited_to_turns_or_patterns",
      "rationale": "Every specific claim, quote, metric, or decision recommendation should trace back to intake turns, patterns, or peer evidence.",
      "severity": "blocker"
    },
    {
      "criterion": "first_win_scope_is_bounded",
      "rationale": "A good Diagnose output narrows the solution space; it does not leave the first implementation wave vague or sprawling.",
      "severity": "major"
    },
    {
      "criterion": "decision_at_end_of_phase_is_explicit",
      "rationale": "The sponsor should know exactly what they are being asked to approve at the Diagnose-to-Design gate.",
      "severity": "major"
    },
    {
      "criterion": "document_reads_like_partner_diagnostic",
      "rationale": "The tone should feel precise, evidence-led, and commercially aware rather than academic or generic.",
      "severity": "minor"
    }
  ]'::jsonb,
  generation_prompt_template = $prompt$
You are drafting a Diagnostic Charter in Markdown.

ENGAGEMENT
${engagement.id}

CLIENT
${client.name}

STRUCTURE
${structure_as_outline}

PHASE 1 FINDINGS
${current_state_baseline_from_phase_1}

ACTIVE PATTERNS
${active_patterns_with_confidence}

PEER DECISIONS
${peer_cohort_summary}

QUALITY RUBRIC
${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Every factual claim, quote, metric, and recommendation must cite one or more bracketed turn references like [turn 02].
- Explicitly label working hypotheses as hypotheses. Do not present them as confirmed facts.
- Use the active patterns and peer decisions only when they genuinely fit the evidence gathered so far.
- If a required section lacks support, write [DATA GAP: what is missing] instead of inventing details.
- Keep the tone crisp, sponsor-ready, and diagnostic rather than solution-heavy.

Write the full diagnostic charter now.
  $prompt$
WHERE
  type_key = 'diagnostic_charter'
  AND (template_structure = '{}'::jsonb OR template_structure IS NULL);

NOTIFY pgrst, 'reload schema';

COMMIT;
