import { buildTemplateOutline, templateOutlineFilename } from '../template-outline';
import { PHASE_TEMPLATE_CATALOG, templatesForPhase } from '../catalog';

describe('buildTemplateOutline — deterministic starter doc from the catalog', () => {
  const t = templatesForPhase('P2')[0];

  it('includes the title, purpose, and every required section as a heading', () => {
    const md = buildTemplateOutline(t);
    expect(md).toContain(`# ${t.label}`);
    expect(md).toContain(t.clientPurpose);
    for (const s of t.requiredSections) {
      expect(md).toContain(`### ${s.section}`);
    }
  });

  it('includes the sample questions as prompts', () => {
    const md = buildTemplateOutline(t);
    for (const q of t.sampleQuestions) {
      expect(md).toContain(`- ${q}`);
    }
  });

  it('never leaks internal keys/jargon into the document', () => {
    for (const tpl of PHASE_TEMPLATE_CATALOG) {
      const md = buildTemplateOutline(tpl);
      expect(md).not.toMatch(/process_redesign|controls_governance_risk|templateId|parsedOutputs|mappedBlocks/);
    }
  });

  it('produces a safe, stable .md filename', () => {
    expect(templateOutlineFilename(t)).toMatch(/^[a-z0-9-]+\.md$/);
    expect(templateOutlineFilename(t)).toBe(templateOutlineFilename(t)); // deterministic
  });

  it('every catalog template produces a non-trivial outline', () => {
    for (const tpl of PHASE_TEMPLATE_CATALOG) {
      expect(buildTemplateOutline(tpl).length).toBeGreaterThan(80);
    }
  });
});
