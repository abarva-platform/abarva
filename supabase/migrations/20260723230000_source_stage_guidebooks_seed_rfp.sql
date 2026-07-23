-- Seed the global RFP-stage guidebook.
--
-- The RFP stage's gate is the readiness review before d09_rfp_pack goes
-- vendor-facing: scope lock against the approved Scope Memo, the 15-exhibit
-- evidence coverage map (src/lib/source/agent-generation/prompt-registry.ts,
-- D09_RFP_EVIDENCE_COVERAGE_RULES), the 8-component Vendor Response Control
-- Pack, and the evaluation weights/disqualification rules -- all grounded in
-- the actual d09_rfp_pack prompt contract (version 10), not generic
-- procurement filler. RFP was the first non-Strategy stage without an
-- authored guidebook; the document-generation contract for d09 was already
-- strong (11 required sections, mandatory tables, block_until_complete
-- missing-input policy) while the facilitator/session layer was empty.

INSERT INTO source_stage_guidebooks (
  stage_key, client_key, title, purpose, duration_minutes, status, sections, version
)
VALUES (
  'rfp',
  NULL,
  'RFP Readiness Review',
  'Confirm the RFP is actually ready to go vendor-facing -- scope is locked against the approved Scope Memo, every evidence gap is named as a client-to-complete item instead of silently missing, the response-control rules are intact, and the evaluation weights are final before any bidder sees them.',
  35,
  'published',
  jsonb_build_array(
    jsonb_build_object(
      'type', 'purpose',
      'title', 'What this session is for',
      'body', 'The RFP Package is the flagship vendor-facing document -- vendors price and propose against it, and once issued its scope and rules read as binding in tone even before a contract exists. This session is the last internal checkpoint before that happens. It exists to catch three specific failure modes before a vendor does: scope that drifted since the Scope Memo was approved, evidence gaps that got left vague instead of named with an owner and date, and evaluation rules that are soft enough to be argued with later. If any of the three is unresolved, hold the RFP -- an issued document is much harder to walk back than an unissued one.',
      'timeBoxMinutes', null
    ),
    jsonb_build_object(
      'type', 'agenda',
      'title', 'Agenda (35 min)',
      'body', E'1. Scope lock confirmation -- reread the in/out tower matrix against the approved Scope Memo (d05); confirm nothing drifted (7 min)\n2. Evidence coverage walk-through -- go exhibit by exhibit through the 15-exhibit coverage map; anything not loaded becomes a named client-to-complete gap (10 min)\n3. Response-control rules sign-off -- confirm all 8 Vendor Response Control Pack components will actually be enforced at evaluation, not simplified away (8 min)\n4. Evaluation weights and disqualification rules -- confirm the weights are final and every disqualification trigger is something the team would actually act on (6 min)\n5. Decision: ready to issue, held for gap closure, or sent back to Scope (4 min)',
      'timeBoxMinutes', 35
    ),
    jsonb_build_object(
      'type', 'facilitator_brief',
      'title', 'Facilitator talking points',
      'body', E'- Open by naming the stakes: once this document goes to vendors, walking back scope or rules costs credibility with every bidder in the room, not just the one who asks about it. That is why this review exists.\n- On scope lock: read the in-scope/out-of-scope tower matrix back verbatim and ask "has anything changed since Scope was approved?" Scope drift between the approved Scope Memo and the issued RFP is the single most common cause of vendor confusion and post-award disputes.\n- On evidence coverage: walk the 15 exhibits one at a time (see the worksheet). For each, ask "loaded, or client-to-complete gap?" -- do not accept "we will get it later" without a named owner and a real date. The RFP prompt will otherwise honestly list an unresolved exhibit as a client-to-complete gap that vendors can see, which reads as under-preparedness.\n- On response-control rules: the point of requiring all 8 pack components (Vendor Claim Register, Automation/Productivity Commitment Table, Structured Pricing Workbook, Staffing and Location Model, SLA Commitment Table, Assumptions and Exclusions Log, Transition Plan Template, Commercial Exceptions Table) is bid comparability. If any one is dropped or watered down here to make the RFP shorter, vendor bids stop being apples-to-apples and evaluation becomes subjective later -- push back on that request specifically.\n- On evaluation weights: ask directly whether the weights were set before or after any informal vendor conversations. Weights set after early vendor positioning is a real fairness risk even when unintentional. Confirm each disqualification trigger is something the team would actually enforce, not a trigger nobody intends to use.',
      'timeBoxMinutes', null
    ),
    jsonb_build_object(
      'type', 'worksheet',
      'title', 'Evidence coverage checklist (15 exhibits)',
      'body', E'For each exhibit, mark Loaded or Gap. A Gap needs an accountable owner and a target date or gate-relative trigger before this session ends -- an unnamed gap becomes a vague client-to-complete line the RFP prompt cannot turn into anything useful.\n\n1. Exhibit 01 -- Application portfolio and criticality baseline\n2. Exhibit 02 -- ITSM ticket volumetrics and service demand baseline\n3. Exhibit 03 -- System workload volumetrics\n4. Exhibit 04 -- Resource capacity and FTE pyramid\n5. Exhibit 05 -- SLA/XLA matrix\n6. Exhibit 06 -- Tower scope and service catalog\n7. Exhibit 07 -- Incumbent contract baseline (internal-only)\n8. Exhibit 08 -- Locked pricing assumptions and volume bands\n9. Exhibit 09 -- Approved evaluation criteria and weights\n10. Exhibit 10 -- Vendor response expectations\n11. Exhibit 11 -- Data center and infrastructure inventory\n12. Exhibit 12 -- Network topology and circuit inventory\n13. Exhibit 13 -- Security and compliance control posture\n14. Exhibit 14 -- Transition operations blackout calendar\n15. Exhibit 15 -- Run-vs-change financial baseline',
      'timeBoxMinutes', 10
    ),
    jsonb_build_object(
      'type', 'decision_capture',
      'title', 'Decision to record',
      'body', E'Record exactly one of:\n- Ready to issue -- scope confirmed locked, evidence gaps named with owners/dates, response-control pack intact, weights final.\n- Held for gap closure -- name every unresolved exhibit gap, its accountable owner, and target date or gate-relative trigger; do not issue until those close.\n- Sent back to Scope -- name the specific tower or exclusion that drifted and route it back through the Scope gate before RFP proceeds.\n\nDo not record "issue with open items" -- an open item material enough to name is material enough to block issuing; anything not worth blocking on is not worth recording here.',
      'timeBoxMinutes', null
    ),
    jsonb_build_object(
      'type', 'pre_mortem',
      'title', 'Failure modes to watch for',
      'body', E'- A tower quietly added or dropped between the approved Scope Memo and the RFP without anyone signing off -- surfaces later as a vendor scope-creep argument during negotiation, when it is much more expensive to resolve.\n- An evidence gap recorded as "TBD" instead of a named client-to-complete item with an owner and date -- a vague RFP reads to vendors as a client that is not actually ready to buy, and invites low-confidence, padded bids.\n- Evaluation weights that shift after bids come in -- the single biggest source of vendor protest and delayed executive decisions is weights that move once one bidder is already known.\n- A response-control component quietly dropped "to make the RFP shorter" -- it is almost always the Structured Pricing Workbook or the Automation/Productivity Commitment Table, which are exactly the tables that make BAFO negotiation defensible three stages later.',
      'timeBoxMinutes', null
    )
  ),
  1
)
ON CONFLICT DO NOTHING;
