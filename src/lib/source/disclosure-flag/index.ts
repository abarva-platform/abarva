// Source · Artifact disclosure-classification flag · Wave C1 · surface.
//
// GAP-9 from FIRSTCAPITAL-LOOP-WIRING-GAPS.md: a typed
// disclosure-classification flag on the artifact model so legal-
// privileged content is marked and inherited as the artifact moves
// through the loop. This module is the pure type + logic layer;
// persistence (a `disclosure_classification` column with RLS) is the
// documented follow-up.

export {
  defaultDisclosureFlag,
  disclosureClassificationLabel,
  disclosureHandlingRequirements,
  inheritDisclosureFlag,
  isPrivilegedClassification,
  makeDisclosureFlag,
} from './disclosure-flag';
export {
  DISCLOSURE_CLASSIFICATIONS,
  DISCLOSURE_FLAG_SOURCES,
  PRIVILEGED_CLASSIFICATIONS,
  type ArtifactDisclosureFlag,
  type DisclosureClassification,
  type DisclosureFlagSource,
  type DisclosureHandlingRequirements,
} from './types';
