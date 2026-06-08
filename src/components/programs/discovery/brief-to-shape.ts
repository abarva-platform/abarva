// brief-to-shape · S6b
//
// Pure mapper: project the origination brief draft (ProgramBriefDraft) into a
// DiscoveryShape so the DiscoveryCapturePanel can render the captured frame
// while the brief is being filled. Conversation-captured fields are tagged
// `chat`; the landscape / context / upload fields are populated later by the
// extraction + pre-fill paths. Pure — no state, no side effects.

import type { ProgramBriefDraft } from '../origination/ProgramBriefPanel';
import {
  captureField,
  emptyDiscoveryShape,
  type DiscoveryShape,
} from '@/lib/programs/discovery/discovery-intake';

export function briefToDiscoveryShape(brief: ProgramBriefDraft): DiscoveryShape {
  const s = emptyDiscoveryShape();
  if (brief.problemStatement) {
    s.problem = captureField(s.problem, brief.problemStatement, 'chat');
  }
  if (brief.targetOutcome) {
    s.valueHypothesis = captureField(s.valueHypothesis, brief.targetOutcome, 'chat', {
      confidence: 'medium',
    });
  }
  if (brief.classification) {
    s.archetype = captureField(s.archetype, brief.classification, 'chat');
  }
  if (brief.sponsor) {
    s.sponsor = captureField(s.sponsor, brief.sponsor, 'chat');
  }
  return s;
}
