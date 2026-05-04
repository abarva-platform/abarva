import fs from 'node:fs';
import path from 'node:path';

describe('origination submit insert contract', () => {
  it('writes legacy-compatible engagement fields required by older live schemas', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/programs/origination-submit.ts'),
      'utf8',
    );

    expect(source).toContain('buildEngagementGraphNodeId(input.programName)');
    expect(source).toContain('graph_node_id: graphNodeId');
    expect(source).toContain('solution: input.programName');
    expect(source).toContain('value_projected_low_usd: parsedValueRange?.low ?? null');
    expect(source).toContain('value_projected_high_usd: parsedValueRange?.high ?? null');
    expect(source).toContain("value_verified_status: parsedValueRange ? 'pending' : null");
    expect(source).toContain("value_currency: 'USD'");
    expect(source).toContain('value_assumptions_jsonb: valueAssumptions');
  });
});
