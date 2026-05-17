// Source · Artifact disclosure-classification flag · GAP-9 · serde tests.
//
// Exercises the persistence round-trip: a typed ArtifactDisclosureFlag
// serialized to the JSON shape stored in the
// `source_artifacts.disclosure_classification` column and parsed back.

import {
  defaultDisclosureFlag,
  inheritDisclosureFlag,
  makeDisclosureFlag,
  parseDisclosureFlag,
  serializeDisclosureFlag,
  type ArtifactDisclosureFlag,
} from '../index';

describe('disclosure flag serde · serialize', () => {
  it('serializes the default flag to null (column stays NULL)', () => {
    expect(serializeDisclosureFlag(defaultDisclosureFlag())).toBeNull();
  });

  it('serializes undefined to null', () => {
    expect(serializeDisclosureFlag(undefined)).toBeNull();
  });

  it('serializes a privileged flag to a full JSON object', () => {
    const flag = makeDisclosureFlag({
      classification: 'attorney_client',
      privilegeHolder: 'General Counsel',
      basis: 'Consent-order remediation analysis at direction of counsel.',
    });
    expect(serializeDisclosureFlag(flag)).toEqual({
      classification: 'attorney_client',
      privileged: true,
      setBy: 'explicit',
      privilegeHolder: 'General Counsel',
      basis: 'Consent-order remediation analysis at direction of counsel.',
      inheritedFromArtifactId: null,
    });
  });

  it('serializes a non-privileged regulator_restricted flag', () => {
    const flag = makeDisclosureFlag({ classification: 'regulator_restricted' });
    const json = serializeDisclosureFlag(flag);
    expect(json).not.toBeNull();
    expect(json?.classification).toBe('regulator_restricted');
    expect(json?.privileged).toBe(false);
  });
});

describe('disclosure flag serde · parse', () => {
  it('parses null and undefined to undefined (unmarked artifact)', () => {
    expect(parseDisclosureFlag(null)).toBeUndefined();
    expect(parseDisclosureFlag(undefined)).toBeUndefined();
  });

  it('parses a persisted default-shaped object to undefined', () => {
    expect(
      parseDisclosureFlag({
        classification: 'none',
        privileged: false,
        setBy: 'default',
        privilegeHolder: '',
        basis: '',
        inheritedFromArtifactId: null,
      }),
    ).toBeUndefined();
  });

  it('rejects malformed input', () => {
    expect(parseDisclosureFlag('not-an-object')).toBeUndefined();
    expect(parseDisclosureFlag(42)).toBeUndefined();
    expect(parseDisclosureFlag({ classification: 'bogus' })).toBeUndefined();
  });

  it('re-derives privileged from the classification — tamper-resistant', () => {
    // A row claiming privileged:false for a privileged class is corrected.
    const parsed = parseDisclosureFlag({
      classification: 'work_product',
      privileged: false,
      setBy: 'explicit',
      privilegeHolder: 'Litigation Counsel',
      basis: 'Litigation hold analysis.',
      inheritedFromArtifactId: null,
    });
    expect(parsed?.privileged).toBe(true);
  });

  it('drops a privilegeHolder when the classification is not privileged', () => {
    const parsed = parseDisclosureFlag({
      classification: 'regulator_restricted',
      privileged: true,
      setBy: 'explicit',
      privilegeHolder: 'Should Not Survive',
      basis: '',
      inheritedFromArtifactId: null,
    });
    expect(parsed?.privileged).toBe(false);
    expect(parsed?.privilegeHolder).toBe('');
  });
});

describe('disclosure flag serde · round-trip', () => {
  const cases: Array<[string, ArtifactDisclosureFlag]> = [
    [
      'explicit attorney-client',
      makeDisclosureFlag({
        classification: 'attorney_client',
        privilegeHolder: 'General Counsel',
        basis: 'Prepared at direction of counsel.',
      }),
    ],
    [
      'privileged_and_confidential',
      makeDisclosureFlag({
        classification: 'privileged_and_confidential',
        privilegeHolder: 'Deputy GC',
        basis: 'AML KPI remediation.',
      }),
    ],
    [
      'regulator_restricted',
      makeDisclosureFlag({ classification: 'regulator_restricted' }),
    ],
    [
      'inherited from an upstream artifact',
      inheritDisclosureFlag({
        parentFlag: makeDisclosureFlag({
          classification: 'attorney_client',
          privilegeHolder: 'General Counsel',
          basis: 'Upstream privileged analysis.',
        }),
        parentArtifactId: 'artifact-upstream-1',
      }),
    ],
  ];

  it.each(cases)('round-trips a %s flag through persistence', (_label, flag) => {
    const persisted = serializeDisclosureFlag(flag);
    expect(persisted).not.toBeNull();
    // Simulate a JSONB column read (driver returns a parsed object).
    const fromDb = JSON.parse(JSON.stringify(persisted));
    expect(parseDisclosureFlag(fromDb)).toEqual(flag);
  });

  it('preserves the inheritance audit link across the round-trip', () => {
    const inherited = inheritDisclosureFlag({
      parentFlag: makeDisclosureFlag({
        classification: 'work_product',
        privilegeHolder: 'Litigation Counsel',
        basis: 'Litigation analysis.',
      }),
      parentArtifactId: 'artifact-parent-99',
    });
    const restored = parseDisclosureFlag(serializeDisclosureFlag(inherited));
    expect(restored?.setBy).toBe('inherited');
    expect(restored?.inheritedFromArtifactId).toBe('artifact-parent-99');
  });

  it('default flag round-trips as undefined (no column value)', () => {
    const restored = parseDisclosureFlag(
      serializeDisclosureFlag(defaultDisclosureFlag()),
    );
    expect(restored).toBeUndefined();
  });
});
