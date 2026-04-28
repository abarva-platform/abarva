# Intelligence Wave Roadmap

| Wave | Title | Status | Catalog entries | Dependency | Notes |
|---|---|---|---|---|---|
| I0 | Audit + roadmap + skeleton plans | in-progress | docs only | none | Session 1 deliverable on branch `spec/session1-prog-set-int-i0-vercel-orch` |
| I1 | Library foundation | planned | INT-IDX-DEFAULT, INT-IDX-FILTERED-M, INT-IDX-FILTERED-T1, INT-IDX-FILTERED-T3, INT-IDX-FILTERED-INREVIEW | I0 | converge current library surfaces into one canonical index |
| I2 | Pattern detail + provenance | planned | INT-DTL-VALIDATED, INT-DTL-INREVIEW, INT-DTL-CANDIDATE, INT-DTL-DEPRECATED | I1 | strongest current base; provenance ribbon still missing |
| I3 | Signal stream + signal detail | planned | INT-IDX-SIGNALS, INT-DTL-SIGNAL | I2, Setup W3 | requires first live ingestion source to be meaningful |
| I4 | Graph browser | planned | INT-IDX-GRAPH | I2 | graph data is partially ready; browser UI is not |
| I5 | Solutions + contradictions | planned | INT-IDX-SOLUTIONS, INT-DTL-SOLUTION, INT-DTL-CONTRADICTION | I2 | solutions ahead of contradictions in current code |
| I6 | Synthesis + authoring | planned | INT-FLW-SYNTHESIZE, INT-FLW-AUTHOR, INT-MOD-SUBMIT | I3, I5 | converges legacy ask stack into canonical surfaces |
| I7 | Quality lens + cross-surface | planned | INT-LNS-QUALITY + auto-surfacing hooks | I3-I6 | closes the module and formalizes quality metrics |
