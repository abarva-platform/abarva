// Claim & Citation Validation · public surface (PR-4).
export * from './types';
export { detectClaims, hasAssumptionMarker, splitSentences } from './detect';
export {
  detectTenantLeakage,
  validateClaimsAndCitations,
  validatePatternNamespaces,
} from './validate';
