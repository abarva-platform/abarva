import {
  inferTemplateFromFilename,
  uploadCategoryForTemplate,
} from '../upload-inference';
import { classifyUpload } from '../classification';
import { templatesForPhase } from '../catalog';

describe('inferTemplateFromFilename — closes the download→fill→upload loop', () => {
  it('matches a downloaded starter filename back to its template', () => {
    const t = templatesForPhase('P2')[0];
    // the starter is named `<slug>.md` (templateOutlineFilename)
    const slug = t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    expect(inferTemplateFromFilename(`${slug}.md`, 'P2')?.templateId).toBe(t.templateId);
  });

  it('still matches when the user appends "-final" / "-v2" to the filename', () => {
    const t = templatesForPhase('P3').find((x) => x.label.toLowerCase().includes('decision'))!;
    const slug = t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    expect(inferTemplateFromFilename(`${slug}-final.docx`, 'P3')?.templateId).toBe(t.templateId);
  });

  it('returns null when nothing matches (never guesses)', () => {
    expect(inferTemplateFromFilename('random-notes.pdf', 'P2')).toBeNull();
    expect(inferTemplateFromFilename('', 'P2')).toBeNull();
  });

  it('picks a sensible upload category from the session type', () => {
    const decision = templatesForPhase('P3').find((x) => x.recommendedSessionType === 'decision_review');
    if (decision) expect(uploadCategoryForTemplate(decision)).toBe('review_summary');
    expect(uploadCategoryForTemplate(null)).toBe('workshop_output');
  });
});

describe('upload → classifyUpload mapping is honest + Move-scoped', () => {
  it('maps an inferred P3 decision summary to lane, phase, and next-phase input, no promotion', () => {
    const t = templatesForPhase('P3').find((x) => x.label.toLowerCase().includes('decision'))!;
    const c = classifyUpload({
      uploadId: 'decision.md',
      moveId: 'm1',
      phase: 'P3',
      uploadCategory: uploadCategoryForTemplate(t),
      inferredTemplateId: t.templateId,
      confidence: 'high',
    });
    expect(c.moveScopedOnly).toBe(true);
    expect(c.enterprisePromotionEligibility).toBe('not_eligible');
    expect(c.clientFacingSummary.enterpriseContextNote).toMatch(/not added to enterprise context/i);
    expect(c.parsedOutputs.length).toBeGreaterThan(0); // derived from the template
    expect(c.nextPhaseInputsUpdated.length).toBeGreaterThan(0);
  });
});
