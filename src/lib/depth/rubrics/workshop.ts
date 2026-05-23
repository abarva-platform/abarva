import { defineRubric } from './shared';

export const workshopRubric = defineRubric({
  type: 'workshop',
  code: 'W',
  title: 'Workshop',
  description: 'A workshop must choreograph decisions before, during, and after the room.',
  passThreshold: 8,
  requiredSections: ['Pre-read', 'Facilitator brief', 'Agenda', 'Worksheets', 'Decision capture', 'Post-read'],
  criteria: [
    { id: 'W1', label: 'Pre-read', weight: 1, description: '15-30 minute sequenced pre-read with glossary.', evidence: ['pre-read', '15-30 min', 'glossary'] },
    { id: 'W2', label: 'Facilitator brief', weight: 1, description: 'Objectives, success criteria, escalation, time-boxes.', evidence: ['facilitator brief', 'success criteria', 'escalation'] },
    { id: 'W3', label: 'Minute agenda', weight: 1, description: 'Every 10 minutes accounted for.', evidence: ['00:00', '00:10', 'minute-by-minute', 'agenda'] },
    { id: 'W4', label: 'Numerical hypothesis', weight: 1, description: 'A testable numeric hypothesis opens the work.', evidence: ['numerical hypothesis', 'hypothesis to test', '%'] },
    { id: 'W5', label: 'Facilitation tactics', weight: 1, description: 'Push/listen/escalate triggers are named.', evidence: ['facilitation tactics', 'push', 'listen', 'escalate trigger'] },
    { id: 'W6', label: 'Worksheets', weight: 1, description: 'Canvases or worksheets are pre-built.', evidence: ['worksheet', 'canvas', 'pre-built'] },
    { id: 'W7', label: 'Decision capture', weight: 1, description: 'Decision, owner, rationale, dissent, follow-ups.', evidence: ['decision capture', 'dissent', 'follow-up'] },
    { id: 'W8', label: 'Pre-mortem', weight: 1, description: '15 minute pre-mortem ritual.', evidence: ['pre-mortem', '15 min'] },
    { id: 'W9', label: 'Stakeholder map', weight: 1, description: 'Influence x interest grid and named pre-work.', evidence: ['stakeholder map', 'influence', 'interest', '1:1'] },
    { id: 'W10', label: 'Post-read tracker', weight: 1, description: '24 hour post-read and commitments tracker.', evidence: ['post-read', '24h', 'commitments tracker'] },
  ],
});
