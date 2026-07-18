// Moves Expert Kernel — Expert Review Console case registry.
//
// The Expert Review Console was first proven on exactly one tenant (Apex). The
// kernel is now anchored on three: Apex Retail, Meridian Health System, and
// FS Demo. This registry is the single switchboard mapping a
// stable case id → the build function, the tenant key, and the Move ref for
// each anchor. The route, the server action, and the data-plane seam all
// resolve a tenant through here — never a re-typed string literal.
//
// Every case id is one of the three canonical short tenant keys the rest of
// the app uses (`apexretail`, `meridian`, `arcturus`). The kernel's internal
// tenant key is the CANONICAL form (`apex-retail`, `meridian-health`,
// `first-capital`) — `canonicalTenantKey` reconciles the two when the
// data-plane adapters scope a query, so persisted `expert_reviews` rows land
// under one key regardless of which alias the URL carried.
//
// Pure module: deterministic, no I/O.

import type {
  BusinessCaseSkeleton,
  FullBusinessCase,
} from "./business-case-compiler";
import type { AdoptionApproach } from "./adoption-approach";
import type { MeasurementHandoff } from "./measurement-handoff";
import type { GoDecisionPack } from "./go-decision-pack";
import type { ValueForecast } from "./value-forecast";
import {
  buildApexContactCenterCase,
  buildApexContactCenterFullCase,
  buildApexContactCenterValueForecast,
  buildApexMobilizeCase,
  APEX_CONTACT_CENTER_MOVE_REF,
  APEX_CONTACT_CENTER_TENANT_KEY,
} from "./apex-contact-center-case";
import {
  buildMeridianAmbientClinicalCase,
  buildMeridianAmbientClinicalFullCase,
  buildMeridianAmbientValueForecast,
  buildMeridianMobilizeCase,
  MERIDIAN_AMBIENT_MOVE_REF,
  MERIDIAN_AMBIENT_TENANT_KEY,
} from "./meridian-ambient-clinical-case";
import {
  buildFirstCapitalFraudDetectionCase,
  buildFirstCapitalFraudDetectionFullCase,
  buildFirstCapitalFraudValueForecast,
  buildFirstCapitalMobilizeCase,
  FIRSTCAPITAL_FRAUD_MOVE_REF,
  FIRSTCAPITAL_FRAUD_TENANT_KEY,
} from "./firstcapital-fraud-detection-case";

/** The stable case ids — one per kernel-anchored tenant. */
export type ExpertReviewCaseId = "apexretail" | "meridian" | "arcturus";

/** One entry in the Expert Review Console case registry. */
export interface ExpertReviewCaseEntry {
  /** Stable case id — the `?case=` selector value. */
  id: ExpertReviewCaseId;
  /** Short tenant label for the switcher UI. */
  tenantLabel: string;
  /** The Move the reviewed case belongs to. */
  moveLabel: string;
  /** Canonical tenant key the kernel and the data plane scope by. */
  tenantKey: string;
  /** Stable opaque Move ref for `expert_reviews` row scoping. */
  moveRef: string;
  /** Runs the kernel and returns the grounded business-case skeleton. */
  buildCase: () => { skeleton: BusinessCaseSkeleton };
  /**
   * Runs the kernel to the Design & Plan depth — the full costed business
   * case (skeleton → roadmap → RACI → three-scenario sensitivity).
   */
  buildFullCase: () => { fullCase: FullBusinessCase };
  /**
   * Runs the kernel to the Mobilize & Handoff depth — adoption approach,
   * Tower measurement handoff, and the go-decision pack.
   */
  buildMobilize: () => {
    adoption: AdoptionApproach;
    measurement: MeasurementHandoff;
    goPack: GoDecisionPack;
  };
  /**
   * The value forecast — gross value plus the six-factor haircut. The
   * skeleton folds this into a Range; the financial-model export needs the
   * full forecast to render the haircut detail.
   */
  buildValueForecast: () => ValueForecast;
}

/** The case registry — three anchors, keyed by case id. */
export const EXPERT_REVIEW_CASES: Readonly<
  Record<ExpertReviewCaseId, ExpertReviewCaseEntry>
> = Object.freeze({
  apexretail: {
    id: "apexretail",
    tenantLabel: "Apex Retail",
    moveLabel: "Contact Center AI Routing",
    tenantKey: APEX_CONTACT_CENTER_TENANT_KEY,
    moveRef: APEX_CONTACT_CENTER_MOVE_REF,
    buildCase: buildApexContactCenterCase,
    buildFullCase: buildApexContactCenterFullCase,
    buildMobilize: buildApexMobilizeCase,
    buildValueForecast: buildApexContactCenterValueForecast,
  },
  meridian: {
    id: "meridian",
    tenantLabel: "Meridian Health System",
    moveLabel: "Ambient Clinical Value Chain Activation",
    tenantKey: MERIDIAN_AMBIENT_TENANT_KEY,
    moveRef: MERIDIAN_AMBIENT_MOVE_REF,
    buildCase: buildMeridianAmbientClinicalCase,
    buildFullCase: buildMeridianAmbientClinicalFullCase,
    buildMobilize: buildMeridianMobilizeCase,
    buildValueForecast: buildMeridianAmbientValueForecast,
  },
  arcturus: {
    id: "arcturus",
    tenantLabel: "FS Demo",
    moveLabel: "Fraud Detection Enhancement",
    tenantKey: FIRSTCAPITAL_FRAUD_TENANT_KEY,
    moveRef: FIRSTCAPITAL_FRAUD_MOVE_REF,
    buildCase: buildFirstCapitalFraudDetectionCase,
    buildFullCase: buildFirstCapitalFraudDetectionFullCase,
    buildMobilize: buildFirstCapitalMobilizeCase,
    buildValueForecast: buildFirstCapitalFraudValueForecast,
  },
});

/** The case ids, in display order — Apex first (the proven default). */
export const EXPERT_REVIEW_CASE_IDS: readonly ExpertReviewCaseId[] = [
  "apexretail",
  "meridian",
  "arcturus",
];

/** The default case — Apex, the first proven anchor. */
export const DEFAULT_EXPERT_REVIEW_CASE_ID: ExpertReviewCaseId = "apexretail";

/** True when `value` is a known case id. */
export function isExpertReviewCaseId(
  value: unknown,
): value is ExpertReviewCaseId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(EXPERT_REVIEW_CASES, value)
  );
}

/**
 * Resolve a case id (e.g. from a `?case=` searchParam) to its registry entry.
 * An unknown or absent id falls back to the default Apex case — the console
 * never fails to render.
 */
export function resolveExpertReviewCase(
  caseId: string | null | undefined,
): ExpertReviewCaseEntry {
  return isExpertReviewCaseId(caseId)
    ? EXPERT_REVIEW_CASES[caseId]
    : EXPERT_REVIEW_CASES[DEFAULT_EXPERT_REVIEW_CASE_ID];
}
