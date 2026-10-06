import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { SAMPLE_RFP_STAGE } from '@/components/source/canvas/analytics/sample-view-model';
import { getSourceArchetype } from '@/lib/source/archetypes/registry';
import { buildLiveStageView } from '@/lib/source/facts/view/stage-analytics-builder';

const ams = getSourceArchetype('AMS_MANAGED_SERVICES')!;
const renewal = getSourceArchetype('CONTRACT_RENEWAL')!;

function firstRuleFacts(archetype: typeof ams): Record<string, number> {
  return Object.fromEntries(
    archetype.valueLeverRules![0].computation.inputs.map((input) => [
      input.key,
      input.unit === 'pct' ? 20 : input.unit === 'count' ? 3 : 1_000_000,
    ]),
  );
}

function build(
  archetype = ams,
  rfpClausePresentLeverKeys?: ReadonlySet<string>,
) {
  const view = buildLiveStageView({
    inputs: firstRuleFacts(archetype),
    citations: {},
    archetypeId: archetype.id,
    stageKey: 'rfp',
    rfpClausePresentLeverKeys,
  });
  expect(view).not.toBeNull();
  return view!;
}

describe('U-540 RFP stage fact-derived beats', () => {
  it('never treats a missing clause signal as a completed RFP', () => {
    const view = build();
    expect(view.beatProvenance).toEqual({
      tasks: 'fact_derived',
      gate: 'fact_derived',
      scaffoldSource: null,
    });
    expect(view.tasks[0].id).toBe('rfp.clause-coverage');
    expect(view.tasks[0].factTemplateCode).toBe('RFP_CLAUSES_V1');
    expect(view.gate.approver).toBe(ams.requiredStakeholders[0]);
    expect(view.gate.confirms[0].label).toMatch(/no clause checklist observed/i);
    expect(view.gate.confirms).not.toEqual(SAMPLE_RFP_STAGE.gate.confirms);
    expect(view.gate.confirms.map((item) => item.detail).join(' ')).not.toMatch(/every priced lever has a clause/i);
  });

  it('moves task and gate with observed included-clause facts without equating missing with absent', () => {
    const missing = build();
    const observed = build(ams, new Set([ams.valueLeverRules![0].key]));
    expect(observed.tasks).not.toEqual(missing.tasks);
    expect(observed.gate.confirms).not.toEqual(missing.gate.confirms);
    expect(observed.gate.confirms[0].label).toContain(`1 of ${ams.valueLeverRules!.length}`);
    expect(observed.gate.confirms[0].detail).toMatch(/not confirmed/i);
    expect(observed.tasks[0].rows).toContainEqual(expect.objectContaining({
      key: ams.valueLeverRules![0].name,
      value: 'Included-clause fact observed',
    }));
  });

  it('does not count undeclared lever keys or turn an empty observed signal into completion', () => {
    const noSignal = build();
    const emptySignal = build(ams, new Set());
    const foreignOnly = build(ams, new Set(['another-archetype.lever']));
    expect(noSignal.gate.confirms[0].label).toBe('No clause checklist observed');
    expect(emptySignal.gate.confirms[0].label).toBe(`0 of ${ams.valueLeverRules!.length} value-lever clauses evidenced`);
    expect(foreignOnly.gate.confirms[0].label).toBe(emptySignal.gate.confirms[0].label);
    expect(foreignOnly.gate.confirms[0].detail).toMatch(/not confirmed/i);
  });

  it('uses archetype clause language and only its declared RFP deliverables', () => {
    const amsView = build();
    const renewalView = build(renewal);
    expect(amsView.tasks[0].guide).toContain(ams.valueLeverRules![0].rfpClause);
    expect(renewalView.tasks[0].guide).toContain(renewal.valueLeverRules![0].rfpClause);
    expect(renewalView.tasks[0].guide).not.toBe(amsView.tasks[0].guide);
    expect(amsView.gate.generates).toEqual(
      ams.deliverablePack.filter((item) => item.stage === 'rfp').map((item) => ({ label: item.label })),
    );
    expect(renewalView.gate.generates).toEqual(
      renewal.deliverablePack.filter((item) => item.stage === 'rfp').map((item) => ({ label: item.label })),
    );
  });

  it('wires the tenant-scoped clause signal into the mounted live stage builder', () => {
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
    expect((argument as ts.ObjectLiteralExpression).properties.some((property) =>
      ts.isShorthandPropertyAssignment(property) && property.name.text === 'rfpClausePresentLeverKeys',
    )).toBe(true);
  });
});
