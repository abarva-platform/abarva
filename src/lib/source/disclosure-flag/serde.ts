// Source · Artifact disclosure-classification flag · GAP-9 · serde.
//
// Wave C1 kept the disclosure flag app-tier. GAP-9 adds the
// `source_artifacts.disclosure_classification` JSONB column. These pure
// helpers convert the typed `ArtifactDisclosureFlag` value object to and
// from the JSON shape stored in that column so the flag round-trips
// through the artifact registry read/write path.
//
// `null` round-trips as "no flag attached" — never persist a default flag
// as a non-null row value, so an unmarked artifact reads back as
// `disclosureFlag: undefined` exactly as it did before persistence.
//
// No I/O, no DB, no clock.

import { defaultDisclosureFlag, isPrivilegedClassification } from './disclosure-flag';
import {
  DISCLOSURE_CLASSIFICATIONS,
  DISCLOSURE_FLAG_SOURCES,
  type ArtifactDisclosureFlag,
  type DisclosureClassification,
  type DisclosureFlagSource,
} from './types';

/** The JSON shape persisted in `source_artifacts.disclosure_classification`. */
export interface DisclosureFlagJson extends Record<string, unknown> {
  classification: string;
  privileged: boolean;
  setBy: string;
  privilegeHolder: string;
  basis: string;
  inheritedFromArtifactId: string | null;
}

function isDisclosureClassification(v: unknown): v is DisclosureClassification {
  return (
    typeof v === 'string' &&
    (DISCLOSURE_CLASSIFICATIONS as readonly string[]).includes(v)
  );
}

function isDisclosureFlagSource(v: unknown): v is DisclosureFlagSource {
  return (
    typeof v === 'string' &&
    (DISCLOSURE_FLAG_SOURCES as readonly string[]).includes(v)
  );
}

/**
 * Serialize a disclosure flag for persistence. Returns `null` for the
 * default (unmarked) flag so the column stays NULL for unmarked artifacts.
 */
export function serializeDisclosureFlag(
  flag: ArtifactDisclosureFlag | undefined,
): DisclosureFlagJson | null {
  if (!flag) return null;
  if (
    flag.classification === 'none' &&
    flag.setBy === 'default' &&
    !flag.privilegeHolder &&
    !flag.basis &&
    flag.inheritedFromArtifactId === null
  ) {
    return null;
  }
  return {
    classification: flag.classification,
    privileged: flag.privileged,
    setBy: flag.setBy,
    privilegeHolder: flag.privilegeHolder,
    basis: flag.basis,
    inheritedFromArtifactId: flag.inheritedFromArtifactId,
  };
}

/**
 * Parse a persisted disclosure flag back into the typed value object.
 * Returns `undefined` for `null` / malformed input so an unmarked artifact
 * reads back with no `disclosureFlag`. `privileged` is always re-derived
 * from the classification so a tampered row cannot disagree with itself.
 */
export function parseDisclosureFlag(
  raw: unknown,
): ArtifactDisclosureFlag | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;

  if (!isDisclosureClassification(r.classification)) return undefined;
  const classification = r.classification;
  const setBy = isDisclosureFlagSource(r.setBy) ? r.setBy : 'default';
  const privileged = isPrivilegedClassification(classification);
  const privilegeHolder =
    typeof r.privilegeHolder === 'string' ? r.privilegeHolder : '';
  const basis = typeof r.basis === 'string' ? r.basis : '';
  const inheritedFromArtifactId =
    typeof r.inheritedFromArtifactId === 'string'
      ? r.inheritedFromArtifactId
      : null;

  // A persisted default flag — treat as no flag, matching serialize().
  if (
    classification === 'none' &&
    setBy === 'default' &&
    !privilegeHolder &&
    !basis &&
    inheritedFromArtifactId === null
  ) {
    return undefined;
  }

  return {
    classification,
    privileged,
    setBy,
    privilegeHolder: privileged ? privilegeHolder : '',
    basis,
    inheritedFromArtifactId,
  };
}

/** Re-export so callers can build the default without a second import. */
export { defaultDisclosureFlag };
