import { parseJiraRows, JIRA_TEMPLATE_COLUMNS } from '../parse';
import { buildNorthwindSampleRows } from '../northwind-sample';

describe('parseJiraRows · syntactic validation', () => {
  test('accepts a fully-populated valid row', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-1',
        issue_type: 'Epic',
        epic_key: '',
        team: 'Storefront',
        status: 'In Progress',
        story_points: '',
        created_at: '2026-03-01',
        started_at: '2026-03-02',
        completed_at: '',
        cycle_time_hours: '',
      },
    ]);
    expect(result.rows_total).toBe(1);
    expect(result.rows_valid).toBe(1);
    expect(result.rows_invalid).toBe(0);
    expect(result.rows[0].issue_key).toBe('NW-1');
    expect(result.rows[0].issue_type).toBe('Epic');
    expect(result.rows[0].created_at).toBe('2026-03-01T00:00:00Z');
  });

  test('rejects missing issue_key', () => {
    const result = parseJiraRows([
      {
        issue_type: 'Task',
        team: 'Platform',
        status: 'Done',
        created_at: '2026-03-01',
      },
    ]);
    expect(result.rows_invalid).toBe(1);
    expect(result.errors[0].reason).toMatch(/issue_key required/);
  });

  test('rejects malformed issue_key', () => {
    const result = parseJiraRows([
      {
        issue_key: 'nw-1',
        issue_type: 'Task',
        team: 'Platform',
        status: 'Done',
        created_at: '2026-03-01',
      },
    ]);
    expect(result.rows_invalid).toBe(1);
    expect(result.errors[0].reason).toMatch(/ABC-123/);
  });

  test('rejects unknown issue_type', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-9',
        issue_type: 'Spike',
        team: 'Platform',
        status: 'Done',
        created_at: '2026-03-01',
      },
    ]);
    expect(result.rows_invalid).toBe(1);
    expect(result.errors[0].reason).toMatch(/issue_type must be one of/);
  });

  test('normalizes case-variant issue_type and status', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-1',
        issue_type: 'epic',
        team: 'Search',
        status: 'in progress',
        created_at: '2026-03-01',
      },
    ]);
    expect(result.rows_valid).toBe(1);
    expect(result.rows[0].issue_type).toBe('Epic');
    expect(result.rows[0].status).toBe('In Progress');
  });

  test('rejects non-integer story_points', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-1',
        issue_type: 'Epic',
        team: 'Search',
        status: 'Done',
        created_at: '2026-03-01',
        story_points: '3.5',
      },
    ]);
    expect(result.rows_invalid).toBe(1);
    expect(result.errors[0].reason).toMatch(/story_points/);
  });

  test('rejects negative cycle_time_hours', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-1',
        issue_type: 'Epic',
        team: 'Search',
        status: 'Done',
        created_at: '2026-03-01',
        cycle_time_hours: '-2',
      },
    ]);
    expect(result.rows_invalid).toBe(1);
    expect(result.errors[0].reason).toMatch(/cycle_time_hours/);
  });

  test('rejects non-ISO created_at', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-1',
        issue_type: 'Epic',
        team: 'Search',
        status: 'Done',
        created_at: '01/03/2026',
      },
    ]);
    expect(result.rows_invalid).toBe(1);
    expect(result.errors[0].reason).toMatch(/created_at/);
  });

  test('accepts full ISO-8601 timestamp', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-1',
        issue_type: 'Epic',
        team: 'Search',
        status: 'Done',
        created_at: '2026-03-01T14:30:00Z',
      },
    ]);
    expect(result.rows_valid).toBe(1);
    expect(result.rows[0].created_at).toBe('2026-03-01T14:30:00Z');
  });

  test('column constant lists ten ordered columns', () => {
    expect(JIRA_TEMPLATE_COLUMNS).toEqual([
      'issue_key',
      'issue_type',
      'epic_key',
      'team',
      'status',
      'story_points',
      'created_at',
      'started_at',
      'completed_at',
      'cycle_time_hours',
    ]);
  });
});

describe('parseJiraRows · cross-row referential checks', () => {
  test('flags Story rows without epic_key', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-9',
        issue_type: 'Story',
        epic_key: '',
        team: 'Search',
        status: 'Done',
        created_at: '2026-03-01',
      },
    ]);
    expect(result.rows_invalid).toBe(1);
    expect(result.errors[0].reason).toMatch(/Story rows must reference an epic_key/);
  });

  test('flags Story rows referencing a missing Epic', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-9',
        issue_type: 'Story',
        epic_key: 'NW-99',
        team: 'Search',
        status: 'Done',
        created_at: '2026-03-01',
      },
    ]);
    expect(result.rows_invalid).toBe(1);
    expect(result.errors[0].reason).toMatch(/not present in the batch/);
  });

  test('accepts Story when its Epic is in the batch', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-1',
        issue_type: 'Epic',
        team: 'Search',
        status: 'In Progress',
        created_at: '2026-03-01',
      },
      {
        issue_key: 'NW-9',
        issue_type: 'Story',
        epic_key: 'NW-1',
        team: 'Search',
        status: 'Done',
        created_at: '2026-03-05',
      },
    ]);
    expect(result.rows_valid).toBe(2);
    expect(result.errors.length).toBe(0);
  });

  test('Bug and Task rows are allowed without epic_key', () => {
    const result = parseJiraRows([
      {
        issue_key: 'NW-1',
        issue_type: 'Bug',
        team: 'Search',
        status: 'Done',
        created_at: '2026-03-01',
      },
      {
        issue_key: 'NW-2',
        issue_type: 'Task',
        team: 'Search',
        status: 'Done',
        created_at: '2026-03-01',
      },
    ]);
    expect(result.rows_valid).toBe(2);
    expect(result.errors.length).toBe(0);
  });
});

describe('parseJiraRows · Northwind sample', () => {
  test('the published sample parses with zero errors', () => {
    const rows = buildNorthwindSampleRows({ asOf: '2026-05-30' });
    expect(rows.length).toBeGreaterThanOrEqual(700);
    const result = parseJiraRows(rows);
    if (result.errors.length > 0) {
      // Helpful failure detail.
      console.error(result.errors.slice(0, 5));
    }
    expect(result.rows_invalid).toBe(0);
    expect(result.rows_valid).toBe(rows.length);
  });

  test('Northwind sample is deterministic across builds', () => {
    const a = buildNorthwindSampleRows({ asOf: '2026-05-30' });
    const b = buildNorthwindSampleRows({ asOf: '2026-05-30' });
    expect(a.length).toBe(b.length);
    expect(a[0]).toEqual(b[0]);
    expect(a[a.length - 1]).toEqual(b[b.length - 1]);
  });

  test('Northwind sample covers all 10 teams', () => {
    const rows = buildNorthwindSampleRows({ asOf: '2026-05-30' });
    const teams = new Set(rows.map((r) => r.team));
    expect(teams.size).toBe(10);
  });

  test('Northwind sample has plausible Epic / Story / Bug / Task distribution', () => {
    const rows = buildNorthwindSampleRows({ asOf: '2026-05-30' });
    const epicCount = rows.filter((r) => r.issue_type === 'Epic').length;
    const storyCount = rows.filter((r) => r.issue_type === 'Story').length;
    const bugCount = rows.filter((r) => r.issue_type === 'Bug').length;
    const taskCount = rows.filter((r) => r.issue_type === 'Task').length;
    expect(epicCount).toBe(20);
    expect(storyCount).toBeGreaterThan(bugCount);
    expect(storyCount).toBeGreaterThan(taskCount);
    expect(epicCount + storyCount + bugCount + taskCount).toBe(rows.length);
  });

  test('Done rows have plausible cycle-time distribution', () => {
    const rows = buildNorthwindSampleRows({ asOf: '2026-05-30' });
    const done = rows.filter(
      (r) => r.status === 'Done' && typeof r.cycle_time_hours === 'number',
    );
    expect(done.length).toBeGreaterThan(100);
    const cycles = done.map((r) => r.cycle_time_hours as number);
    const min = Math.min(...cycles);
    const max = Math.max(...cycles);
    const avg = cycles.reduce((a, c) => a + c, 0) / cycles.length;
    expect(min).toBeGreaterThanOrEqual(0.5);
    expect(max).toBeLessThanOrEqual(240);
    // Average should be in a sensible engineering range, not pathological.
    expect(avg).toBeGreaterThan(2);
    expect(avg).toBeLessThan(80);
  });
});
