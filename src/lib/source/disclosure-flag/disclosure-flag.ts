// Source · Artifact disclosure-classification flag · Wave C1 · logic.
//
// Pure constructors and transforms for the artifact disclosure flag.
// The flag marks legal-privileged content and — critically — carries
// (`inherit…`) from an upstream artifact to a derived one so the
// "legal-privileged handling flagged for every downstream artifact"
// guarantee in the First Capital scenario holds as the artifact moves
// Intelligence → Move → Source → Tower.
//
// No I/O, no DB, no clock.

import {
  PRIVILEGED_CLASSIFICATIONS,
  type ArtifactDisclosureFlag,
  type DisclosureClassification,
  type DisclosureFlagSource,
  type DisclosureHandlingRequirements,
} from './types';

/** Whether a classification asserts legal privilege. */
export function isPrivilegedClassification(
  classification: DisclosureClassification,
): boolean {
  return PRIVILEGED_CLASSIFICATIONS.includes(classification);
}

/** The default, non-privileged disclosure flag. */
export function defaultDisclosureFlag(): ArtifactDisclosureFlag {
  return {
    classification: 'none',
    privileged: false,
    setBy: 'default',
    privilegeHolder: '',
    basis: '',
    inheritedFromArtifactId: null,
  };
}

/**
 * Construct a disclosure flag explicitly. `privileged` is always derived
 * from the classification so the two cannot disagree. A privileged flag
 * requires a `privilegeHolder`; passing an empty holder for a privileged
 * classification throws — privilege with no named holder is not a valid
 * assertion.
 */
export function makeDisclosureFlag(args: {
  classification: DisclosureClassification;
  setBy?: DisclosureFlagSource;
  privilegeHolder?: string;
  basis?: string;
}): ArtifactDisclosureFlag {
  const { classification } = args;
  const privileged = isPrivilegedClassification(classification);
  const privilegeHolder = (args.privilegeHolder ?? '').trim();

  if (privileged && !privilegeHolder) {
    throw new Error(
      `[disclosure-flag] classification "${classification}" asserts privilege and requires a privilegeHolder`,
    );
  }

  return {
    classification,
    privileged,
    setBy: args.setBy ?? (classification === 'none' ? 'default' : 'explicit'),
    privilegeHolder: privileged ? privilegeHolder : '',
    basis: (args.basis ?? '').trim(),
    inheritedFromArtifactId: null,
  };
}

/**
 * Derive the disclosure flag a *derived* artifact must carry, given its
 * upstream parent's flag. This is the propagation rule that makes the
 * privileged marking travel the loop: a privileged parent forces the
 * child to inherit the same classification, marked `inherited` and
 * pointing back at the parent. A non-privileged parent imposes nothing —
 * the child keeps whatever flag it already has (or the default).
 *
 * @param parentFlag the upstream artifact's disclosure flag.
 * @param parentArtifactId the upstream artifact's id (for the audit link).
 * @param childCurrentFlag the child's existing flag, if any.
 */
export function inheritDisclosureFlag(args: {
  parentFlag: ArtifactDisclosureFlag;
  parentArtifactId: string;
  childCurrentFlag?: ArtifactDisclosureFlag;
}): ArtifactDisclosureFlag {
  const { parentFlag, parentArtifactId } = args;
  const childCurrentFlag = args.childCurrentFlag ?? defaultDisclosureFlag();

  if (!parentArtifactId) {
    throw new Error('[disclosure-flag] parentArtifactId is required to inherit');
  }

  // A non-privileged parent does not downgrade or override the child.
  if (!parentFlag.privileged) {
    return childCurrentFlag;
  }

  // The child already carries an equal-or-stronger privileged flag —
  // keep it; do not weaken an explicit marking by inheritance.
  if (
    childCurrentFlag.privileged &&
    childCurrentFlag.classification === parentFlag.classification
  ) {
    return childCurrentFlag;
  }

  return {
    classification: parentFlag.classification,
    privileged: true,
    setBy: 'inherited',
    privilegeHolder: parentFlag.privilegeHolder,
    basis: parentFlag.basis
      ? `Inherited from upstream artifact: ${parentFlag.basis}`
      : 'Inherited privileged classification from an upstream artifact.',
    inheritedFromArtifactId: parentArtifactId,
  };
}

/** Human-readable label for a disclosure classification. */
export function disclosureClassificationLabel(
  classification: DisclosureClassification,
): string {
  switch (classification) {
    case 'attorney_client':
      return 'Attorney-Client Privileged';
    case 'work_product':
      return 'Attorney Work Product';
    case 'privileged_and_confidential':
      return 'Privileged & Confidential';
    case 'regulator_restricted':
      return 'Regulator-Restricted';
    default:
      return 'No special disclosure handling';
  }
}

/**
 * Derive the downstream handling obligations a flag imposes. A
 * privileged flag requires a visible legend, restricted export, and
 * propagation to derived artifacts; `regulator_restricted` requires a
 * legend and restricted export but is not itself privilege; `none`
 * imposes nothing.
 */
export function disclosureHandlingRequirements(
  flag: ArtifactDisclosureFlag,
): DisclosureHandlingRequirements {
  if (flag.classification === 'none') {
    return {
      requiresLegend: false,
      legendText: '',
      restrictExport: false,
      propagatesToDerivedArtifacts: false,
      summary: 'No special disclosure handling required.',
    };
  }

  const label = disclosureClassificationLabel(flag.classification);

  if (flag.classification === 'regulator_restricted') {
    return {
      requiresLegend: true,
      legendText: `${label.toUpperCase()} — prepared for supervisory use; do not distribute outside the regulator channel.`,
      restrictExport: true,
      propagatesToDerivedArtifacts: true,
      summary: `${label}: legend required, export restricted to the regulator channel, derived artifacts inherit the marking.`,
    };
  }

  // Privileged classifications.
  const holder = flag.privilegeHolder || 'Counsel';
  return {
    requiresLegend: true,
    legendText: `${label.toUpperCase()} — prepared at the direction of ${holder}. Do not disclose; privilege is asserted.`,
    restrictExport: true,
    propagatesToDerivedArtifacts: true,
    summary: `${label}: legend required, export restricted to counsel-controlled channels, every derived artifact must inherit this classification.`,
  };
}
