// Moves Expert Kernel — forecast-to-outcome calibration.
//
// This closes the outcome-calibration gap without pretending we have pilot
// actuals yet. When Tower actuals arrive, this module compares forecast versus
// realized value, emits a privacy-safe calibration event, and recommends how
// future expert priors should be adjusted.

import { round2, type Range } from './types';

export interface ForecastOutcomeInput {
  tenantKey: string;
  moveId: string;
  archetype: string;
  forecastNetValue: Range;
  realizedNetValue: number | null;
  realizedAt: string | null;
  evidenceConfidence: 'verified' | 'sourced' | 'inferred' | 'missing';
}

export interface AnonymizedOutcomeCalibration {
  archetype: string;
  forecastBand: 'under_1m' | '1m_to_5m' | '5m_to_20m' | 'over_20m';
  realizationRatioBand: 'not_measured' | 'under_50pct' | '50_to_80pct' | '80_to_120pct' | 'over_120pct';
  evidenceConfidence: ForecastOutcomeInput['evidenceConfidence'];
}

export interface OutcomeCalibrationResult {
  measured: boolean;
  realizationRatio: number | null;
  adjustment: 'no_actuals' | 'discount_future_priors' | 'hold_priors' | 'increase_cautiously';
  message: string;
  anonymized: AnonymizedOutcomeCalibration;
}

function valueBand(point: number): AnonymizedOutcomeCalibration['forecastBand'] {
  if (point < 1_000_000) return 'under_1m';
  if (point < 5_000_000) return '1m_to_5m';
  if (point < 20_000_000) return '5m_to_20m';
  return 'over_20m';
}

function ratioBand(ratio: number | null): AnonymizedOutcomeCalibration['realizationRatioBand'] {
  if (ratio === null) return 'not_measured';
  if (ratio < 0.5) return 'under_50pct';
  if (ratio < 0.8) return '50_to_80pct';
  if (ratio <= 1.2) return '80_to_120pct';
  return 'over_120pct';
}

export function calibrateOutcomeAgainstForecast(
  input: ForecastOutcomeInput,
): OutcomeCalibrationResult {
  const ratio =
    input.realizedNetValue === null || input.forecastNetValue.point <= 0
      ? null
      : round2(input.realizedNetValue / input.forecastNetValue.point);

  let adjustment: OutcomeCalibrationResult['adjustment'] = 'no_actuals';
  let message = 'No Tower actuals yet; keep the forecast as an expert prior.';
  if (ratio !== null) {
    if (ratio < 0.8) {
      adjustment = 'discount_future_priors';
      message = 'Realized value under-ran forecast; discount future priors for this archetype.';
    } else if (ratio <= 1.2) {
      adjustment = 'hold_priors';
      message = 'Realized value landed within the forecast band; hold priors.';
    } else {
      adjustment = 'increase_cautiously';
      message = 'Realized value exceeded forecast; increase priors only with verified evidence.';
    }
  }

  return {
    measured: ratio !== null,
    realizationRatio: ratio,
    adjustment,
    message,
    anonymized: {
      archetype: input.archetype,
      forecastBand: valueBand(input.forecastNetValue.point),
      realizationRatioBand: ratioBand(ratio),
      evidenceConfidence: input.evidenceConfidence,
    },
  };
}
