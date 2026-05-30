import { buildSyntheticNorthwindCmdb } from '@/lib/tower/ingest/servicenow-cmdb/sample';
import { validateCmdbExtract } from '@/lib/tower/ingest/servicenow-cmdb/validate';

describe('ServiceNow CMDB · FK validation', () => {
  it('passes the synthetic Northwind extract with zero blocking issues', () => {
    const { cis, dependencies } = buildSyntheticNorthwindCmdb();
    const result = validateCmdbExtract({ cis, dependencies });

    expect(result.ok).toBe(true);
    expect(result.ciCount).toBe(cis.length);
    expect(result.dependencyCount).toBe(dependencies.length);
    // No duplicate-CI / duplicate-edge / orphan-edge issues.
    const blocking = result.issues.filter(
      (i) =>
        i.kind === 'duplicate_ci_sys_id' ||
        i.kind === 'duplicate_edge' ||
        i.kind === 'orphan_dependency_source' ||
        i.kind === 'orphan_dependency_target',
    );
    expect(blocking).toEqual([]);
  });

  it('flags an orphan dependency edge (FK to missing CI)', () => {
    const { cis, dependencies } = buildSyntheticNorthwindCmdb();
    const tampered = [
      ...dependencies,
      {
        sourceCiSysId: cis[0]!.ciSysId,
        targetCiSysId: 'ffffffffffffffffffffffffffffffff', // not in cis
        dependencyType: 'depends_on' as const,
      },
    ];
    const result = validateCmdbExtract({ cis, dependencies: tampered });
    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (i) => i.kind === 'orphan_dependency_target' && i.edge?.targetCiSysId === 'ffffffffffffffffffffffffffffffff',
      ),
    ).toBe(true);
  });

  it('flags duplicate CI sys_ids', () => {
    const { cis, dependencies } = buildSyntheticNorthwindCmdb();
    const dupe = { ...cis[0]!, ciName: `${cis[0]!.ciName} (duplicate)` };
    const result = validateCmdbExtract({
      cis: [...cis, dupe],
      dependencies,
    });
    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (i) => i.kind === 'duplicate_ci_sys_id' && i.ciSysId === cis[0]!.ciSysId,
      ),
    ).toBe(true);
  });

  it('flags duplicate dependency edges (same source/target/type triple)', () => {
    const { cis, dependencies } = buildSyntheticNorthwindCmdb();
    const result = validateCmdbExtract({
      cis,
      dependencies: [...dependencies, dependencies[0]!],
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.kind === 'duplicate_edge')).toBe(true);
  });
});
