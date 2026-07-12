# SkyHarbor Module Readiness Summary

The modules below are evaluated against candidate proof metadata only. None reads candidate
data by default in PR10.

<!-- prettier-ignore -->
| Module | Evidence | Fact plan | Graph plan | Derived plan | Runtime reads candidate | Next proof needed |
| --- | --- | --- | --- | --- | --- | --- |
| home | true | true | false | true | false | Persist and promote the candidate version, then prove Home reads the promoted active tenant slice. |
| intelligence | true | true | false | true | false | Run signed-in answer retrieval with citations from the promoted active tenant slice. |
| moves | true | true | false | true | false | Run a phase workspace proof that consumes promoted facts, evidence, graph context, and derived readiness. |
| source | true | true | false | false | false | Run a sourcing workflow proof that consumes promoted vendor, contract, evidence, and value context. |
| tower | true | true | false | false | false | Run an outcome-ledger proof before any realized value or ROI claim. |
