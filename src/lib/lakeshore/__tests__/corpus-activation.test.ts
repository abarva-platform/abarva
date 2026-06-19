import {
  assertLakeshoreCorpusSourcesExist,
  buildLakeshoreCorpusActivationPlan,
} from '../corpus-activation';
import { CXO_PERSONAS, type CxoPersona } from '@/lib/auth/cxo-personas';

type ExtendedCxoPersona = Omit<CxoPersona, 'clientKey' | 'tenantKey'> & {
  clientKey: string;
  tenantKey: string;
};

describe('Lakeshore corpus activation plan', () => {
  it('declares exactly the two requested Lakeshore CXO logins', () => {
    const plan = buildLakeshoreCorpusActivationPlan({ generatedAt: '2026-06-04T00:00:00.000Z' });

    expect(plan.cxoLogins).toHaveLength(2);
    expect(plan.cxoLogins.map((login) => login.email).sort()).toEqual([
      'cfo@lakeshore-holdings.example.com',
      'cio@lakeshore-holdings.example.com',
    ]);
    expect(plan.cxoLogins.every((login) => login.requiredMetadata.clientId === 'lakeshore')).toBe(true);
    expect(plan.cxoLogins.every((login) => login.requiredMetadata.tenantKey === 'lakeshore-holdings')).toBe(true);
  });

  it('has matching canonical CXO persona records for Clerk provisioning', () => {
    const personas = CXO_PERSONAS as ReadonlyArray<ExtendedCxoPersona>;
    const lakeshore = personas.filter((persona) => persona.clientKey === 'lakeshore');

    expect(lakeshore).toHaveLength(2);
    expect(lakeshore.map((persona) => persona.slug).sort()).toEqual([
      'cfo-lakeshore',
      'cio-lakeshore',
    ]);
    expect(lakeshore.every((persona) => persona.tenantKey === 'lakeshore-holdings')).toBe(true);
    expect(lakeshore.every((persona) => persona.email.endsWith('@lakeshore-holdings.example.com'))).toBe(true);
  });

  it('points every corpus source at an existing artifact', () => {
    expect(assertLakeshoreCorpusSourcesExist(process.cwd())).toEqual([]);
  });

  it('marks the governed load ledger as pending until PR 2997 lands', () => {
    const plan = buildLakeshoreCorpusActivationPlan({ generatedAt: '2026-06-04T00:00:00.000Z' });
    const pending = plan.sources.filter((source) => source.availability !== 'available');

    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      id: 'lakeshore-governed-load-ledger',
      availability: 'blocked_pending_pr',
      blockedBy: expect.stringContaining('PR #2997'),
    });
  });

  it('pins grounding rules for the four product agents', () => {
    const plan = buildLakeshoreCorpusActivationPlan({ generatedAt: '2026-06-04T00:00:00.000Z' });

    expect(plan.agentGrounding.map((rule) => rule.agent).sort()).toEqual([
      'Atlas',
      'Nexus',
      'Sentinel',
      'Steward',
    ]);
    expect(plan.hallucinationControls).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Dry-run evidence'),
        expect.stringContaining('reusable pattern packs'),
      ]),
    );
  });
});
