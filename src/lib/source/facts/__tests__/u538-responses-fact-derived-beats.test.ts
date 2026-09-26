import { buildLiveStageView } from '@/lib/source/facts/view/stage-analytics-builder';
import { getSourceArchetype } from '@/lib/source/archetypes/registry';
import { SAMPLE_RESPONSES_STAGE } from '@/components/source/canvas/analytics/sample-view-model';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const archetype = getSourceArchetype('AMS_MANAGED_SERVICES')!;
const rules = archetype.valueLeverRules!;

function factsForFirstRule(): Record<string, number> {
  return Object.fromEntries(
    rules[0].computation.inputs.map((input) => [
      input.key,
      input.unit === 'pct' ? 20 : input.unit === 'count' ? 3 : 1_000_000,
    ]),
  );
}

function build(
  vendorResponses?: {
    vendors: readonly string[];
    statusByVendorLever: ReadonlyMap<
      string,
      ReadonlyMap<string, 'addressed' | 'partial' | 'dodged'>
    >;
  },
) {
  const view = buildLiveStageView({
    inputs: factsForFirstRule(),
    citations: {},
    archetypeId: archetype.id,
    stageKey: 'responses',
    vendorResponses,
  });
  expect(view).not.toBeNull();
  return view!;
}

describe('U-538 Responses stage fact-derived beats', () => {
  it('starts from a real derived view, not the exemplar approver or invented response completion', () => {
    const view = build();
    expect(view.beatProvenance).toEqual({
      tasks: 'fact_derived',
      gate: 'fact_derived',
      scaffoldSource: null,
    });
    expect(view.gate.approver).toBe(archetype.requiredStakeholders[0]);
    expect(view.gate.approver).not.toBe(SAMPLE_RESPONSES_STAGE.gate.approver);
    expect(view.tasks[0].id).toBe('responses.coverage');
    expect(view.tasks[0].factTemplateCode).toBe('RESPONSE_COVERAGE_V1');
    expect(view.gate.confirms[0].label).toBe('No vendor response cells observed');
    expect(view.gate.confirms.map((item) => item.detail).join(' ')).toMatch(/no vendor response coverage/i);
    expect(view.gate.confirms.map((item) => item.detail).join(' ')).not.toMatch(/responses are complete/i);
  });

  it('moves the coverage task and gate with observed vendor-by-lever facts', () => {
    const empty = build();
    const withCoverage = build({
      vendors: ['vendor-a'],
      statusByVendorLever: new Map([
        ['vendor-a', new Map([[rules[0].key, 'addressed']])],
      ]),
    });
    expect(withCoverage.tasks).not.toEqual(empty.tasks);
    expect(withCoverage.gate.confirms).not.toEqual(empty.gate.confirms);
    expect(withCoverage.gate.confirms[0].label).toContain(`1 of ${rules.length}`);
    expect(withCoverage.gate.confirms[0].detail).toMatch(/not observed/i);
    expect(withCoverage.gate.confirms[0].detail).not.toMatch(/all suppliers responded/i);
  });

  it('moves with the archetype and never carries the exemplar deliverable', () => {
    const view = build();
    expect(view.tasks[0].guide).toContain(rules[0].name);
    expect(view.gate.generates).toEqual(
      archetype.deliverablePack
        .filter((item) => item.stage === 'responses')
        .map((item) => ({ label: item.label })),
    );
    expect(view.gate.generates).not.toEqual(SAMPLE_RESPONSES_STAGE.gate.generates);
  });

  it('wires the tenant-scoped response read into the live stage builder', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(maestro)/source/events/[eventId]/page.tsx'),
      'utf8',
    );
    const tree = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const calls: ts.CallExpression[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'buildLiveStageView') {
        calls.push(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(tree);
    expect(calls).toHaveLength(1);
    const argument = calls[0].arguments[0];
    expect(ts.isObjectLiteralExpression(argument)).toBe(true);
    const properties = (argument as ts.ObjectLiteralExpression).properties;
    expect(properties.some((property) =>
      ts.isShorthandPropertyAssignment(property) && property.name.text === 'vendorResponses',
    )).toBe(true);
  });
});
