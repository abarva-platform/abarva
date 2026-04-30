import type { StagePack } from './types';

export const S0_INTAKE: StagePack = {
  stage: 0,
  label: 'S0 Intake',
  sourceStageKeys: ['intake', 'scope'],
  crossReferences: { patternIds: [], sourceStageKeys: ['intake', 'scope'] },
  outcome:
    'Intake is complete when the sourcing event has a named business owner, a concrete problem statement, a scope boundary, the decision that procurement is being asked to support, and a kill criterion that can stop the event before market motion begins. This stage does not end because someone requested an RFP. It ends when Sentinel can explain why the event exists, what would make it unnecessary or unsafe, which stakeholders must approve the path, and which evidence is still missing before the market is contacted.',
  definitionOfDone: [
    { id: 'business-owner-named', label: 'Business owner and accountable sponsor named', severity: 'hard', evaluationHint: 'Source event context or intake artifact names the business owner, sponsor, and decision authority. A distribution list or generic procurement owner is not enough.' },
    { id: 'problem-statement-specific', label: 'Problem statement specific enough to test', severity: 'hard', evaluationHint: 'Intake artifact states the current pain, affected population, business consequence, and desired outcome. It should not read as a solution request only.' },
    { id: 'scope-boundary-recorded', label: 'Scope boundary recorded with explicit out-of-scope items', severity: 'hard', evaluationHint: 'Scope artifact or event brief lists in-scope services, systems, geographies, timing, and out-of-scope items that vendors must not price implicitly.' },
    { id: 'kill-criterion-set', label: 'Kill criterion or stop condition set before spend begins', severity: 'hard', evaluationHint: 'Decision memo or intake note states the condition that would cancel, defer, or redirect the sourcing event before RFI/RFP work starts.' },
    { id: 'stakeholder-map-started', label: 'Stakeholder and approver map started', severity: 'soft', evaluationHint: 'Event evidence names business, IT, procurement, legal/security, finance, and operations participants with missing roles called out rather than assumed.' },
  ],
  rightQuestions: {
    open: [
      { id: 'why-now', text: 'What changed that makes this sourcing event necessary now?', why: 'Separates real business trigger from habitual renewal or vendor pressure.', expectedAnswerShape: 'Trigger, consequence of inaction, deadline source, and impacted owner.' },
      { id: 'decision-needed', text: 'What decision must this event enable, and who can make it?', why: 'Prevents the event from becoming a document factory without a decision owner.', expectedAnswerShape: 'Decision, authority, timing, and escalation path.' },
    ],
    converge: [
      { id: 'scope-edge', text: 'Where is the sharpest scope edge that vendors could misread?', why: 'Most early sourcing drift begins when scope boundaries are left implicit.', expectedAnswerShape: 'In-scope, out-of-scope, assumptions, and known ambiguity.' },
      { id: 'kill-signal', text: 'Which signal would make us stop rather than continue to market?', why: 'Creates permission to avoid zombie sourcing motion once evidence turns weak.', expectedAnswerShape: 'Measurable or observable stop condition and owner.' },
    ],
    close: [
      { id: 'ready-for-market-shape', text: 'What evidence is still missing before we ask the market for information?', why: 'Intake should hand S1 a real brief, not an empty request for vendor education.', expectedAnswerShape: 'Missing evidence list with owner and decision if it remains missing.' },
      { id: 'sponsor-accepts-boundary', text: 'Has the sponsor accepted the scope boundary and kill criterion?', why: 'Market work is wasteful if the sponsor can later disown the boundary.', expectedAnswerShape: 'Sponsor approval, caveats, or explicit unresolved item.' },
    ],
  },
  antiPatterns: [
    { id: 'rfp-as-intake', label: 'RFP As Intake', detectionHint: 'The user treats the request to run an RFP as the problem statement and cannot name the business decision it enables.', whatToFlag: 'Tell the user the procurement mechanism is not the business problem.', mitigation: 'Redirect to trigger, owner, consequence, scope, and kill criterion before market work.' },
    { id: 'ghost-sponsor', label: 'Ghost Sponsor', detectionHint: 'A project team or procurement contact is named, but no accountable sponsor can approve scope or stop the event.', whatToFlag: 'Surface that the event lacks decision authority.', mitigation: 'Name sponsor, delegated approver, and escalation path before S1.' },
    { id: 'scope-by-vendor', label: 'Vendor-Defined Scope', detectionHint: 'The team expects vendors to define the scope because internal stakeholders have not agreed the boundary.', whatToFlag: 'Flag that the market will optimize around vendor framing, not buyer intent.', mitigation: 'Set a buyer-owned baseline and let vendors challenge it explicitly in S1.' },
  ],
  coachingArc: {
    entry: 'Start by slowing the motion down. Ask why now, who owns the decision, and what would make the event stop.',
    midPhase: 'Drive the user from request language into evidence language: scope, consequence, owner, assumptions, and missing inputs.',
    exit: 'Package the intake as a market-shape brief and refuse to advance if sponsorship, scope, or kill criteria remain vaporous.',
  },
  dependencies: {
    requiresFromPrior: ['Business trigger or program handoff exists, even if it is rough', 'User can identify the affected capability, vendor, service, or system area'],
    producesForNext: ['Buyer-owned problem statement', 'Scope boundary with out-of-scope list', 'Named sponsor and stakeholder map', 'Kill criterion and missing-evidence list'],
  },
};
