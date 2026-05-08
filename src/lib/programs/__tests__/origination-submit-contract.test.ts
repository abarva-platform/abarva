import fs from 'node:fs';
import path from 'node:path';

describe('origination submit insert contract', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/programs/origination-submit.ts'),
      'utf8',
    );
  });

  it('writes legacy-compatible engagement fields required by older live schemas', () => {
    expect(source).toContain('buildEngagementGraphNodeId(input.programName)');
    expect(source).toContain('graph_node_id: graphNodeId');
    expect(source).toContain('solution: input.programName');
    expect(source).toContain('value_projected_low_usd: parsedValueRange?.low ?? null');
    expect(source).toContain('value_projected_high_usd: parsedValueRange?.high ?? null');
    expect(source).toContain("value_verified_status: parsedValueRange ? 'pending' : null");
    expect(source).toContain("value_currency: 'USD'");
    expect(source).toContain('value_assumptions_jsonb: valueAssumptions');
  });

  it('writes charter JSONB to engagement at P0 origination', () => {
    // charter must be computed and written in the same insert
    expect(source).toContain('buildOriginationCharter(');
    expect(source).toContain('charter,');
    // charter helper must capture all 7 scaffold fields
    expect(source).toContain('problem_statement: input.problemStatement');
    expect(source).toContain('scope_boundary: input.scopeBoundary');
    expect(source).toContain('evidence_family: input.evidenceFamily');
    expect(source).toContain('value_hypothesis: input.targetOutcome');
    expect(source).toContain('foundation_readiness: input.timeline');
    // initiative context must be preserved
    expect(source).toContain('initiative_context: input.fromInitiativeId');
  });

  it('accepts and persists origination chat turns to turns table', () => {
    // Input type must include turns
    expect(source).toContain('originationTurns?: OriginationTurn[] | null');
    // Turns must be written to DB after engagement creation
    expect(source).toContain('persistOriginationTurns(');
    expect(source).toContain("sender: t.role === 'assistant' ? 'agent' : 'user'");
    // Phase 0 — origination phase
    expect(source).toContain('phase: 0');
  });

  it('accepts extended scaffold fields scopeBoundary and evidenceFamily', () => {
    expect(source).toContain('scopeBoundary?: string | null');
    expect(source).toContain('evidenceFamily?: string | null');
    expect(source).toContain('fromInitiativeId?: string | null');
    expect(source).toContain('fromGapUsd?: number | null');
  });
});
