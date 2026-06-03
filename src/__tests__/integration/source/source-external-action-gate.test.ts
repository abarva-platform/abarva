import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS,
  isSourceExternalActionWorkItem,
  normalizeSourceExternalActionEvidenceRefs,
  validateSourceExternalActionGate,
} from '@/lib/source/external-action-gate';

describe('Source external-action human gate', () => {
  it('classifies serve_notice work items as external actions', () => {
    expect(isSourceExternalActionWorkItem('serve_notice')).toBe(true);
    expect(
      isSourceExternalActionWorkItem('workplan_item', {
        subKind: 'vendor_notification',
      }),
    ).toBe(true);
    expect(isSourceExternalActionWorkItem('owner_assignment')).toBe(false);
    expect(isSourceExternalActionWorkItem('tower_watch')).toBe(false);
  });

  it('rejects serve_notice without explicit human confirmation', () => {
    const result = validateSourceExternalActionGate({
      kind: 'serve_notice',
      humanJustification:
        'Legal reviewed the renewal terms and approved creating the notice task.',
      evidenceRefs: ['contract:abc'],
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: 'human_external_action_gate_required',
      }),
    );
  });

  it('rejects serve_notice when the human rationale is too short', () => {
    const result = validateSourceExternalActionGate({
      kind: 'serve_notice',
      humanConfirmed: true,
      humanJustification: 'Reviewed.',
      evidenceRefs: ['contract:abc'],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected serve_notice gate rejection.');
    expect(result.detail).toContain(
      String(SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS),
    );
  });

  it('rejects serve_notice without evidence refs', () => {
    const result = validateSourceExternalActionGate({
      kind: 'serve_notice',
      humanConfirmed: true,
      humanJustification:
        'Legal reviewed the renewal terms and approved creating the notice task.',
      evidenceRefs: [],
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: 'human_external_action_gate_required',
      }),
    );
  });

  it('accepts a confirmed serve_notice with rationale and evidence refs', () => {
    const result = validateSourceExternalActionGate({
      kind: 'serve_notice',
      humanConfirmed: true,
      humanJustification:
        'Legal reviewed the renewal terms and approved creating the notice task.',
      evidenceRefs: ['contract:abc', 'posture:decline'],
    });

    expect(result).toEqual({
      ok: true,
      required: true,
      normalizedJustification:
        'Legal reviewed the renewal terms and approved creating the notice task.',
      normalizedEvidenceRefs: ['contract:abc', 'posture:decline'],
    });
  });

  it('allows internal work items without the external-action gate', () => {
    const result = validateSourceExternalActionGate({
      kind: 'tower_watch',
    });

    expect(result).toEqual({
      ok: true,
      required: false,
      normalizedJustification: null,
      normalizedEvidenceRefs: [],
    });
  });

  it('normalizes comma-separated evidence refs from route callers', () => {
    expect(
      normalizeSourceExternalActionEvidenceRefs('contract:abc, posture:decline'),
    ).toEqual(['contract:abc', 'posture:decline']);
  });

  it('keeps the API route and cockpit wired to the gate', () => {
    const route = readFileSync(
      join(process.cwd(), 'src/app/api/v1/source/work-items/route.ts'),
      'utf8',
    );
    const component = readFileSync(
      join(process.cwd(), 'src/components/source/RenewalCockpitActionBar.tsx'),
      'utf8',
    );

    expect(route).toContain('validateSourceExternalActionGate');
    expect(route).toContain('human_external_action_gate_required');
    expect(route).toContain("metadata.externalActionGate = 'human_confirmed'");
    expect(component).toContain('serveNoticeJustification');
    expect(component).toContain('humanConfirmed: true');
    expect(component).toContain('evidenceRefs: serveNoticeEvidenceRefs');
  });
});
