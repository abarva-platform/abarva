import { allowedCorpusIndustryScopes } from './industry-scope';

describe('allowedCorpusIndustryScopes', () => {
  it('allows Lakeshore private holdings corpus overlays for Lakeshore tenants', () => {
    expect(allowedCorpusIndustryScopes({ tenantKey: 'lakeshore' })).toEqual([
      'lakeshore-capital',
      'private-holdings',
      'cross_industry',
    ]);
    expect(allowedCorpusIndustryScopes({ tenantKey: 'lakeshore-holdings' })).toEqual([
      'lakeshore-capital',
      'private-holdings',
      'cross_industry',
    ]);
  });
});
