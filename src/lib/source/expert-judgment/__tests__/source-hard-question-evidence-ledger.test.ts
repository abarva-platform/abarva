import { answerHardSourceQuestion } from '../source-hard-question-answer';

describe('Source hard questions evidence specificity', () => {
  it('prefers exact intake fields over generic evidence categories', () => {
    const answer = answerHardSourceQuestion(
      'BlueYonder is cheapest. Should I recommend award even if legal says telemetry model-improvement rights are a P0 issue?',
      [
        'Scope evidence is generally available for this event and blockers remain open.',
        "intake.scope.line_items[3] = 'BlueYonder AI module pricing blank; telemetry/model-improvement rights redline unresolved' refreshed 2026-05-22.",
      ].join('\n'),
    );

    expect(answer?.answerText).toContain('price cannot override');
    expect(answer?.evidenceReference).toContain('intake.scope.line_items[3]');
    expect(answer?.evidenceReference).toContain('telemetry/model-improvement rights');
  });
});
