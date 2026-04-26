import { buildPersonaWalkResults, PersonaWalkStatus, DesignedVsTested } from '../../../lib/qa/persona-walk-results';

const VALID_STATUSES: PersonaWalkStatus[] = ['pass', 'partial', 'deferred', 'fail'];
const VALID_DESIGNED_VS_TESTED: DesignedVsTested[] = ['designed', 'scaffolded', 'tested', 'deferred'];
const EXPECTED_PERSONA_IDS = [
  'founder-operator',
  'client-maestro',
  'cio-cto',
  'cfo-value-office',
  'steward-admin',
  'data-owner',
  'transformation-lead',
];

describe('persona-walk-results', () => {
  const manifest = buildPersonaWalkResults();

  it('returns a manifest', () => {
    expect(manifest).toBeDefined();
  });

  it('generatedAt is 2026-04-26', () => {
    expect(manifest.generatedAt).toBe('2026-04-26');
  });

  it('totalPersonas equals results.length', () => {
    expect(manifest.totalPersonas).toBe(manifest.results.length);
  });

  it('all 7 expected persona IDs present', () => {
    const ids = manifest.results.map((r) => r.personaId);
    for (const id of EXPECTED_PERSONA_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('count fields reconcile', () => {
    const { passCount, partialCount, deferredCount, failCount, totalPersonas } = manifest;
    expect(passCount + partialCount + deferredCount + failCount).toBe(totalPersonas);
  });

  describe('each persona', () => {
    for (const result of manifest.results ?? []) {
      describe(`persona ${result.personaId}`, () => {
        it('has non-empty objective', () => {
          expect(result.objective.length).toBeGreaterThan(0);
        });

        it('has at least one route step', () => {
          expect(result.routeSequence.length).toBeGreaterThanOrEqual(1);
        });

        it('currentReadiness is valid', () => {
          expect(VALID_STATUSES).toContain(result.currentReadiness);
        });

        it('designedVsTested is valid', () => {
          expect(VALID_DESIGNED_VS_TESTED).toContain(result.designedVsTested);
        });

        it('has blockers array', () => {
          expect(Array.isArray(result.blockers)).toBe(true);
        });

        it('has evidenceRequired array', () => {
          expect(Array.isArray(result.evidenceRequired)).toBe(true);
        });

        it('has non-empty nextValidationAction', () => {
          expect(result.nextValidationAction.length).toBeGreaterThan(0);
        });

        it('walkedAt is 2026-04-26', () => {
          expect(result.walkedAt).toBe('2026-04-26');
        });

        for (const step of result.routeSequence ?? []) {
          describe(`step ${step.route}`, () => {
            it('has non-empty route', () => {
              expect(step.route.length).toBeGreaterThan(0);
            });

            it('has non-empty expectedAction', () => {
              expect(step.expectedAction.length).toBeGreaterThan(0);
            });

            it('has non-empty expectedInsight', () => {
              expect(step.expectedInsight.length).toBeGreaterThan(0);
            });

            it('actualStatus is valid', () => {
              expect(VALID_STATUSES).toContain(step.actualStatus);
            });

            it('has non-empty evidence', () => {
              expect(step.evidence.length).toBeGreaterThan(0);
            });
          });
        }
      });
    }
  });
});
