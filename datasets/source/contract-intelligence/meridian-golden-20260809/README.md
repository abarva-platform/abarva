# Meridian Golden Contract Evidence Package

Synthetic, PHI-free, PII-free evidence package for two Meridian contract families.

The package is designed to prove that Source Contract 360 and Door 1 optimization are tenant-agnostic. It uses the same shared source.golden_contract_* CSV tables, doc.* PDF extraction tables, and Tower value-claim path as the SkyHarbor canary.

The important QA rule: four-ledger totals in reconciliation/golden_contract_reconciliation.csv are mechanically derived from the line-level files in synthetic/.
