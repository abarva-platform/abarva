# Programs Wave Roadmap

| Wave | Title | Status | Catalog entries | Dependency | Notes |
|---|---|---|---|---|---|
| P0 | Audit + roadmap + skeleton plans | in-progress | docs only | none | establishes execution ledger after Session 1 spec merge |
| P1 | Route family convergence | planned | canonical routes + legacy wrappers | P0 | `Opus`-class because deletion and redirect decisions are architectural |
| P2 | Portfolio index refresh | planned | PRG-IDX-DEFAULT, PRG-IDX-LINKED, index states | P1 | converges portfolio states under canonical family |
| P3 | Flagship detail stabilization | planned | PRG-DTL-P1 through PRG-DTL-P4 | P1 | locks `P-SMOKE-CDP` on canonical detail path |
| P4 | Origination + future-phase expansion | planned | PRG-FLW-ORIGINATE, PRG-DTL-P5, PRG-DTL-P6 | P3 | formalizes shipped origination and future-phase builders |
| P5 | Gate + evidence convergence | planned | PRG-STA-GATE-PENDING, PRG-MOD-GATE-APPROVE, evidence surfaces | P3 | governance-first cleanup |
| P6 | Interaction state normalization | planned | overlays, transitions, custom actions | P3, P5 | aligns interaction language and runtime posture |
| P7 | Cross-surface integration + legacy retirement | planned | linked Source/Tower/Intelligence states | P1-P6 | likely held for human review if route removal occurs |
