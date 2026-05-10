import {
  composeAgentOutputFewShotPromptBlock,
  visibleFewShotOutput,
} from './few-shot-prompt';

describe('agent output few-shot prompt block', () => {
  it('renders examples as plain visible text, not custom tags', () => {
    const visible = visibleFewShotOutput(
      '<p>Use <abv-pattern id="P-HC-005">CMIO sponsorship pattern</abv-pattern>.</p><abv-sources><abv-source ref="Healthcare pack" reliability="HIGH"/></abv-sources>',
    );

    expect(visible).toContain('CMIO sponsorship pattern');
    expect(visible).toContain('Source basis: Healthcare pack (HIGH).');
    expect(visible).not.toContain('<abv-pattern');
    expect(visible).not.toContain('P-HC-005');
  });

  it('injects two Nexus examples by default', () => {
    const block = composeAgentOutputFewShotPromptBlock('Nexus');

    expect(block).toContain('AGENT OUTPUT FEW-SHOT EXAMPLES');
    expect(block.match(/Example \d:/g)).toHaveLength(2);
    expect(block).toContain('Demand forecasting');
    expect(block).toContain('Source basis:');
    expect(block).not.toContain('<abv-');
    expect(block).not.toMatch(/\[(?:P|UC|V|PAT)-[A-Z0-9-]+\]/);
  });

  it('normalizes agent names before selecting examples', () => {
    const atlas = composeAgentOutputFewShotPromptBlock('AbarVa Atlas');
    const steward = composeAgentOutputFewShotPromptBlock('Setup Steward');

    expect(atlas).toContain('Agent example set: atlas.');
    expect(steward).toContain('Agent example set: steward.');
  });
});
