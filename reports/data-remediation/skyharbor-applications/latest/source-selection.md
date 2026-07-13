# DATA-PR32 Source Selection

| Source | Role | Rows | Location | Reason |
| --- | --- | ---: | --- | --- |
| 900-row older app/system estate | selected_authoritative | 900 | repo_dataset_path | Selected because it has unique application/system names, IDs, owners, business functions, deployment, lifecycle, criticality, run cost, data class, and integration counts. It is the cleanest application/system inventory for this one-domain remediation. |
| 412-app portfolio CSV from Downloads | supporting | 412 | local_downloads_path | Supporting source only. It is a useful in-scope application subset, but it has fewer rows and currently lives outside the canonical repo/blob landing path. |
| 956-row transformed app/system template | excluded | 956 | repo_dataset_path | Excluded as authoritative because 900 rows carry placeholder system_name values. It remains evidence of a transformation defect and is reported as a conflict, not silently merged. |
| 13-row current upgrade candidate app/system file | excluded | 13 | repo_dataset_path | Excluded because it is the thin candidate path DATA-PR31 found to be incomplete for applications/systems coverage. |

Conflicting or weak sources are reported, not silently merged.
