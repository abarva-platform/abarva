import {
  repairAgentOutputContractText,
  validateAgentOutputContractText,
} from './response-contract';

describe('agent output response contract repair', () => {
  it('detects raw markdown emphasis and raw visible entity ids', () => {
    const violations = validateAgentOutputContractText(
      'Use **ambient documentation** with [P-HC-005] before scaling UC-HC-FRONT-001.',
    );

    expect(violations).toContain('raw_markdown_emphasis');
    expect(violations).toContain('raw_visible_entity_id');
  });

  it('strips bracketed raw ids while preserving the human-readable label', () => {
    const repaired = repairAgentOutputContractText(
      'Use the CMIO sponsorship pattern [P-HC-005] before scaling.',
    );

    expect(repaired.text).toBe('Use the CMIO sponsorship pattern before scaling.');
    expect(repaired.violations).toContain('raw_visible_entity_id');
  });

  it('replaces bare raw use-case ids with a generic source-backed phrase', () => {
    const repaired = repairAgentOutputContractText(
      'UC-HC-FRONT-001 is relevant, but only if clinical sponsorship exists.',
    );

    expect(repaired.text).toBe('the cited pattern is relevant, but only if clinical sponsorship exists.');
    expect(repaired.violations).toContain('raw_visible_entity_id');
  });

  it('splits overlong prose paragraphs into readable chunks', () => {
    const repaired = repairAgentOutputContractText(
      'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five.',
    );

    expect(repaired.violations).toContain('overlong_paragraph');
    expect(repaired.text.split('\n\n')).toHaveLength(2);
  });
});

