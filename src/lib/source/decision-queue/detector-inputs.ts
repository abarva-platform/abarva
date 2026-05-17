// Decision Queue detector inputs — the normalized substrate shapes.
//
// The detectors are pure functions over these typed inputs. A read adapter
// (data-plane seam) projects raw `data_inventory_records` rows into these
// shapes; the detectors never touch the DB. Keeping the input contract here
// (separate from the detectors) lets the cockpit and tests share it.

import type { ContextSourceType } from '@/lib/context-trust/freshness-model';

/**
 * A normalized vendor-contract record — the subset of the `vendor_contracts`
 * segment the Decision Queue and Renewal Cockpit reason over. Every monetary
 * field is USD. Dates are ISO `YYYY-MM-DD`.
 */
export interface VendorContractInput {
  /** Stable contract id — the renewal-cockpit route key. */
  contractId: string;
  vendorName: string;
  /** Product / service the contract covers. */
  product: string;
  /** Capability category — used for overlap detection (e.g. `crm`, `itsm`). */
  category: string;
  /** Annual contract value in USD. `null` when unpriced. */
  annualSpendUsd: number | null;
  /** Contract term-end date (ISO). `null` when unknown. */
  termEndDate: string | null;
  /** Whether the contract auto-renews if no notice is served. */
  autoRenew: boolean;
  /**
   * Notice period in days the buyer must give before `termEndDate` to avoid
   * an auto-renewal. `null` when the contract does not auto-renew or the
   * notice period is unknown.
   */
  noticePeriodDays: number | null;
  /**
   * Adoption / utilization as a fraction 0..1 of entitled seats or capacity
   * actually used. `null` when not measured.
   */
  utilizationRate: number | null;
  /** Business criticality — informs urgency and posture. */
  criticality: 'low' | 'medium' | 'high';
  /** Free-text owner reference (person id or name). */
  ownerRef?: string;
}

/**
 * A normalized IT-financials line — the subset used to cross-check contract
 * spend against the budgeted / benchmarked figure.
 */
export interface FinancialLineInput {
  /** Stable financial-record id. */
  recordId: string;
  /** The capability category this line funds — joins to contract category. */
  category: string;
  /** Annual budgeted or benchmarked spend in USD for this category. */
  annualBudgetUsd: number;
  /**
   * A defensible benchmark unit cost or category benchmark in USD, when the
   * financials carry one. Used by the savings detector. `null` when absent.
   */
  benchmarkUsd: number | null;
}

/**
 * Freshness metadata for a context segment, as the freshness model consumes
 * it. The blocked-evidence detector reads these to decide whether a renewal
 * decision is grounded enough to act on.
 */
export interface SegmentFreshnessInput {
  segment: 'vendor_contracts' | 'it_financials';
  /** ISO date the segment data was last refreshed. `null` => never loaded. */
  lastUpdated: string | null;
  sourceType: ContextSourceType;
}

/** The full detector input bundle for one tenant. */
export interface DecisionQueueInput {
  clientKey: string;
  contracts: VendorContractInput[];
  financials: FinancialLineInput[];
  segmentFreshness: SegmentFreshnessInput[];
  /** Evaluation clock — injected so detectors stay pure & deterministic. */
  asOf: Date;
}
