# Meridian vNext Loader Checklist

Use Setup/Admin loader only. Do not insert these records directly into the database.

1. Upload all 15 CSV or XLSX files as a single Meridian vNext package.
2. Confirm row counts match `manifest.json`.
3. Confirm unresolved references remain 0 in `validation-report.json`.
4. Confirm loader ledger records source basis, source owner, validation date, confidence, and evidence usability.
5. Confirm Admin shows all 15 dimensions loaded for Meridian.
6. Confirm chunks, graph nodes, graph edges, and quality issues are visible in the loader run report.
7. If a field is dropped, enhance the loader rather than simplifying this package.
