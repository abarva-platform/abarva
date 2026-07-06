import { isDirectClaudeSurface } from '../display-text';

describe('isDirectClaudeSurface', () => {
  it('keeps Intelligence on the direct visible-prose path', () => {
    expect(isDirectClaudeSurface('intelligence')).toBe(true);
    expect(isDirectClaudeSurface('/intelligence')).toBe(true);
  });

  it('leaves other universal chat surfaces on the existing sanitizer path', () => {
    expect(isDirectClaudeSurface('home')).toBe(false);
    expect(isDirectClaudeSurface('/tower')).toBe(false);
    expect(isDirectClaudeSurface(undefined)).toBe(false);
  });
});
