// Sourcing work-item model · unit tests.
//
//   - validateNewWorkItem rejects half-formed rows (no subject, no title,
//     owner_assignment with no owner, bad due-date);
//   - accountabilityFor projects owner + SLA from a contract's work items;
//   - groupBySubject buckets items by their subjectRef.

import {
  accountabilityFor,
  groupBySubject,
  isOpenWorkItem,
  validateNewWorkItem,
} from '@/lib/source/work-items/work-item-model';
import type {
  NewSourcingWorkItem,
  SourcingWorkItem,
} from '@/lib/source/work-items/types';

function baseNew(
  overrides: Partial<NewSourcingWorkItem> = {},
): NewSourcingWorkItem {
  return {
    tenantClientKey: 'apexretail',
    subjectKind: 'contract',
    subjectRef: 'contract-1',
    subjectLabel: 'Adobe — Creative Cloud',
    kind: 'serve_notice',
    title: 'Serve notice — Adobe',
    owner: null,
    dueDate: '2026-08-01',
    status: 'open',
    legalStatus: 'not_started',
    procurementStatus: 'not_started',
    note: null,
    createdBy: 'user-1',
    ...overrides,
  };
}

function item(overrides: Partial<SourcingWorkItem> = {}): SourcingWorkItem {
  return {
    id: 'wi-1',
    tenantClientKey: 'apexretail',
    subjectKind: 'contract',
    subjectRef: 'contract-1',
    subjectLabel: 'Adobe — Creative Cloud',
    kind: 'owner_assignment',
    title: 'Renewal owner — Adobe',
    owner: 'Dana Lee',
    dueDate: '2026-08-01',
    status: 'open',
    legalStatus: null,
    procurementStatus: null,
    note: null,
    metadata: {},
    createdBy: 'user-1',
    createdAt: '2026-05-17T10:00:00Z',
    updatedBy: 'user-1',
    updatedAt: '2026-05-17T10:00:00Z',
    ...overrides,
  };
}

describe('validateNewWorkItem', () => {
  it('accepts a well-formed serve-notice work item', () => {
    expect(validateNewWorkItem(baseNew()).ok).toBe(true);
  });

  it('rejects a missing subjectRef', () => {
    const result = validateNewWorkItem(baseNew({ subjectRef: '  ' }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/subjectRef/);
  });

  it('rejects a missing title', () => {
    const result = validateNewWorkItem(baseNew({ title: '' }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/title/);
  });

  it('rejects an owner_assignment with no owner', () => {
    const result = validateNewWorkItem(
      baseNew({ kind: 'owner_assignment', owner: null }),
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/owner/);
  });

  it('accepts an owner_assignment that names an owner', () => {
    expect(
      validateNewWorkItem(
        baseNew({ kind: 'owner_assignment', owner: 'Dana Lee' }),
      ).ok,
    ).toBe(true);
  });

  it('rejects a malformed due date', () => {
    const result = validateNewWorkItem(baseNew({ dueDate: '08/01/2026' }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/dueDate/);
  });

  it('allows a null due date', () => {
    expect(validateNewWorkItem(baseNew({ dueDate: null })).ok).toBe(true);
  });

  it('rejects an unknown kind', () => {
    const result = validateNewWorkItem(
      baseNew({ kind: 'bogus' as NewSourcingWorkItem['kind'] }),
    );
    expect(result.ok).toBe(false);
  });
});

describe('isOpenWorkItem', () => {
  it('treats open and in_progress as open', () => {
    expect(isOpenWorkItem(item({ status: 'open' }))).toBe(true);
    expect(isOpenWorkItem(item({ status: 'in_progress' }))).toBe(true);
  });
  it('treats done and cancelled as not open', () => {
    expect(isOpenWorkItem(item({ status: 'done' }))).toBe(false);
    expect(isOpenWorkItem(item({ status: 'cancelled' }))).toBe(false);
  });
});

describe('accountabilityFor', () => {
  it('returns an empty summary for no work items', () => {
    expect(accountabilityFor([])).toEqual({
      owner: null,
      dueDate: null,
      openCount: 0,
      hasOpenNotice: false,
      hasTowerWatch: false,
    });
  });

  it('surfaces the owner from the freshest open owner-assignment', () => {
    const a = accountabilityFor([
      item({
        id: 'wi-old',
        owner: 'Old Owner',
        createdAt: '2026-05-01T10:00:00Z',
      }),
      item({
        id: 'wi-new',
        owner: 'New Owner',
        createdAt: '2026-05-17T10:00:00Z',
      }),
    ]);
    expect(a.owner).toBe('New Owner');
  });

  it('surfaces the soonest SLA across open items', () => {
    const a = accountabilityFor([
      item({ id: 'wi-1', dueDate: '2026-09-01' }),
      item({ id: 'wi-2', dueDate: '2026-06-15' }),
      item({ id: 'wi-3', dueDate: '2026-12-01' }),
    ]);
    expect(a.dueDate).toBe('2026-06-15');
  });

  it('ignores done / cancelled items for owner + SLA', () => {
    const a = accountabilityFor([
      item({ id: 'wi-done', status: 'done', owner: 'Done Owner', dueDate: '2026-01-01' }),
      item({ id: 'wi-open', status: 'open', owner: 'Open Owner', dueDate: '2026-07-01' }),
    ]);
    expect(a.owner).toBe('Open Owner');
    expect(a.dueDate).toBe('2026-07-01');
    expect(a.openCount).toBe(1);
  });

  it('flags an open serve-notice and a tower-watch item', () => {
    const a = accountabilityFor([
      item({ id: 'wi-notice', kind: 'serve_notice', status: 'open' }),
      item({ id: 'wi-watch', kind: 'tower_watch', status: 'done' }),
    ]);
    expect(a.hasOpenNotice).toBe(true);
    // tower_watch is reported even when done — Tower still tracks it.
    expect(a.hasTowerWatch).toBe(true);
  });
});

describe('groupBySubject', () => {
  it('buckets work items by their subjectRef', () => {
    const groups = groupBySubject([
      item({ id: 'a', subjectRef: 'contract-1' }),
      item({ id: 'b', subjectRef: 'contract-2' }),
      item({ id: 'c', subjectRef: 'contract-1' }),
    ]);
    expect(groups.get('contract-1')).toHaveLength(2);
    expect(groups.get('contract-2')).toHaveLength(1);
  });
});
