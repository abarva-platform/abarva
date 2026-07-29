# Manifest Gap Report

The 3A.2 artifacts inspected by this builder provide dedicated tenant/server/storage/process boundaries but do not provide enough exact Azure network/control-plane naming to safely apply infrastructure.

| Missing value                           | Required for                                                              | Stop rule                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource_group`                        | all Azure plans and applies                                               | Do not infer a resource group name from naming conventions.                                                                                 |
| `virtual_network_name`                  | private Postgres, private storage, ACA job integration                    | Do not attach to a shared VNet unless explicitly approved.                                                                                  |
| `subnet_names`                          | Container Apps environment, private endpoints, database/storage isolation | Do not create public database or storage access as a workaround.                                                                            |
| `container_apps_environment`            | ACA job placement                                                         | Do not use an existing shared app environment without explicit approval.                                                                    |
| `log_analytics_workspace`               | job execution ledger and operations evidence                              | Do not run unobservable mutation jobs.                                                                                                      |
| `job_topology_resolved_in_current_plan` | complete 14-process orchestration                                         | Current plan reserves dedicated jobs through metric parity; do not collapse these into another job without explicit orchestration decision. |
