import {
  firstClientSearchParam,
  resolveIntelligenceDecisionRouteMode,
} from '../decision-route-mode';

describe('firstClientSearchParam', () => {
  it('preserves a single requested client key', () => {
    expect(firstClientSearchParam('lakeshore')).toBe('lakeshore');
  });

  it('uses the first requested client key when Next provides repeated params', () => {
    expect(firstClientSearchParam(['lakeshore', 'meridian'])).toBe('lakeshore');
  });

  it('returns null when no client was requested', () => {
    expect(firstClientSearchParam(undefined)).toBeNull();
  });
});

describe('resolveIntelligenceDecisionRouteMode', () => {
  it('renders an empty state for an active tenant with no supported industry binding', () => {
    expect(
      resolveIntelligenceDecisionRouteMode({
        activeClientKey: 'lakeshore',
        industryKey: null,
      }),
    ).toBe('tenant-empty');
  });

  it('allows the Meridian reference only when no active tenant row resolved', () => {
    expect(
      resolveIntelligenceDecisionRouteMode({
        activeClientKey: null,
        industryKey: null,
      }),
    ).toBe('reference-example');
  });

  it('renders an empty state when the resolved binding belongs to another tenant', () => {
    expect(
      resolveIntelligenceDecisionRouteMode({
        activeClientKey: 'northwind',
        industryKey: 'retail',
        bindingExpectedClientKey: 'apexretail',
      }),
    ).toBe('tenant-empty');
  });

  it('renders tenant selection when the resolved binding belongs to the active tenant', () => {
    expect(
      resolveIntelligenceDecisionRouteMode({
        activeClientKey: 'apexretail',
        industryKey: 'retail',
        bindingExpectedClientKey: 'apexretail',
      }),
    ).toBe('tenant-selection');
  });
});
