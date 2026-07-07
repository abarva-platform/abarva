/**
 * Surfaces where the model-authored visible prose should pass through without
 * extra text rewriting in the universal chat route.
 *
 * Financial redaction and tenant guards still run upstream/downstream where
 * applicable; this only prevents renderer-style prose optimization from
 * changing the answer text on surfaces that own their own display contract.
 */
export function isDirectClaudeSurface(surface: string | null | undefined): boolean {
  const normalized = (surface ?? '').trim().toLowerCase();
  return normalized === 'intelligence' || normalized === '/intelligence';
}
