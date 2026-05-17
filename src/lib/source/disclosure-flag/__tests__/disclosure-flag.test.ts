// Source · Artifact disclosure-classification flag · Wave C1 · tests.
//
// Exercises flag construction, the privilege/classification invariant,
// inheritance (the flag travelling the loop), and handling obligations.

import {
  DISCLOSURE_CLASSIFICATIONS,
  PRIVILEGED_CLASSIFICATIONS,
  defaultDisclosureFlag,
  disclosureClassificationLabel,
  disclosureHandlingRequirements,
  inheritDisclosureFlag,
  isPrivilegedClassification,
  makeDisclosureFlag,
} from '../index';

describe('disclosure classification taxonomy', () => {
  it('treats the three counsel-privilege classes as privileged', () => {
    expect([...PRIVILEGED_CLASSIFICATIONS].sort()).toEqual(
      ['attorney_client', 'privileged_and_confidential', 'work_product'].sort(),
    );
    expect(isPrivilegedClassification('none')).toBe(false);
    expect(isPrivilegedClassification('regulator_restricted')).toBe(false);
    expect(isPrivilegedClassification('attorney_client')).toBe(true);
  });

  it('labels every classification', () => {
    for (const c of DISCLOSURE_CLASSIFICATIONS) {
      expect(disclosureClassificationLabel(c).length).toBeGreaterThan(0);
    }
  });
});

describe('makeDisclosureFlag', () => {
  it('builds the non-privileged default', () => {
    const flag = defaultDisclosureFlag();
    expect(flag.classification).toBe('none');
    expect(flag.privileged).toBe(false);
    expect(flag.setBy).toBe('default');
  });

  it('derives privileged from the classification', () => {
    const flag = makeDisclosureFlag({
      classification: 'privileged_and_confidential',
      privilegeHolder: 'General Counsel',
      basis: 'Consent-order remediation analysis at the direction of counsel.',
    });
    expect(flag.privileged).toBe(true);
    expect(flag.setBy).toBe('explicit');
    expect(flag.privilegeHolder).toBe('General Counsel');
  });

  it('rejects a privileged classification with no privilege holder', () => {
    expect(() =>
      makeDisclosureFlag({ classification: 'attorney_client' }),
    ).toThrow(/privilegeHolder/);
  });

  it('clears the privilege holder for a non-privileged classification', () => {
    const flag = makeDisclosureFlag({
      classification: 'regulator_restricted',
      privilegeHolder: 'Ignored',
    });
    expect(flag.privileged).toBe(false);
    expect(flag.privilegeHolder).toBe('');
  });
});

describe('inheritDisclosureFlag — the flag travels the loop', () => {
  const privilegedParent = makeDisclosureFlag({
    classification: 'privileged_and_confidential',
    privilegeHolder: 'General Counsel',
    basis: 'AML KPI analysis.',
  });

  it('forces a derived artifact to inherit a privileged parent flag', () => {
    const child = inheritDisclosureFlag({
      parentFlag: privilegedParent,
      parentArtifactId: 'ART-parent',
    });
    expect(child.privileged).toBe(true);
    expect(child.classification).toBe('privileged_and_confidential');
    expect(child.setBy).toBe('inherited');
    expect(child.inheritedFromArtifactId).toBe('ART-parent');
    expect(child.basis).toMatch(/Inherited from upstream/);
  });

  it('leaves the child untouched when the parent is not privileged', () => {
    const childCurrent = defaultDisclosureFlag();
    const result = inheritDisclosureFlag({
      parentFlag: defaultDisclosureFlag(),
      parentArtifactId: 'ART-parent',
      childCurrentFlag: childCurrent,
    });
    expect(result).toBe(childCurrent);
  });

  it('does not weaken a child that already carries the same privilege', () => {
    const childCurrent = makeDisclosureFlag({
      classification: 'privileged_and_confidential',
      privilegeHolder: 'Deputy GC',
    });
    const result = inheritDisclosureFlag({
      parentFlag: privilegedParent,
      parentArtifactId: 'ART-parent',
      childCurrentFlag: childCurrent,
    });
    expect(result).toBe(childCurrent);
  });

  it('requires a parent artifact id for the audit link', () => {
    expect(() =>
      inheritDisclosureFlag({ parentFlag: privilegedParent, parentArtifactId: '' }),
    ).toThrow(/parentArtifactId/);
  });
});

describe('disclosureHandlingRequirements', () => {
  it('imposes nothing for a non-disclosure flag', () => {
    const req = disclosureHandlingRequirements(defaultDisclosureFlag());
    expect(req.requiresLegend).toBe(false);
    expect(req.restrictExport).toBe(false);
    expect(req.propagatesToDerivedArtifacts).toBe(false);
  });

  it('requires legend, export restriction and propagation for privileged content', () => {
    const req = disclosureHandlingRequirements(
      makeDisclosureFlag({
        classification: 'attorney_client',
        privilegeHolder: 'General Counsel',
      }),
    );
    expect(req.requiresLegend).toBe(true);
    expect(req.legendText).toMatch(/General Counsel/);
    expect(req.restrictExport).toBe(true);
    expect(req.propagatesToDerivedArtifacts).toBe(true);
  });

  it('scopes regulator-restricted content to the regulator channel', () => {
    const req = disclosureHandlingRequirements(
      makeDisclosureFlag({ classification: 'regulator_restricted' }),
    );
    expect(req.requiresLegend).toBe(true);
    expect(req.restrictExport).toBe(true);
    expect(req.legendText).toMatch(/regulator channel/);
  });
});
