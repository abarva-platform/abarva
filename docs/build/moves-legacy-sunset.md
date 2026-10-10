# Moves legacy surface sunset ledger

The step-page registry is the replacement contract. A phase changes its default
only after every declared step has an implemented page. Until then, missing
steps open their own legacy capture section. The unlinked `?legacy=1` hatch
keeps the old flow available after a phase switches; a separate removal PR
deletes it after a signed-in walk records parity and the phase flag is default
for the enrolled synthetic demo tenant.

| Surface (file and symbol) | Phase | Replacement step page | Status | Removal criteria |
| --- | --- | --- | --- | --- |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` opening and capture slots | P0 | P0.1–P0.4 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` gate and approve slots | P0 | P0.5 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; origination evidence and approval parity |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` opening and capture slots | P1 | P1.1–P1.4 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` gate and approve slots | P1 | P1.5 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; charter sign-off parity |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` opening and capture slots | P2 | P2.1–P2.4 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` gate and approve slots | P2 | P2.5 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` opening and capture slots | P3 | P3.1–P3.4 | hatch-only | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` gate and approve slots | P3 | P3.5 | hatch-only | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` opening and capture slots | P4 | P4.1–P4.4 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` gate and approve slots | P4 | P4.5 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; value/readiness gate parity |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` opening and capture slots | P5 | P5.1–P5.3 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant |
| `MovesCaptureFlow.tsx` `MovesCaptureFlow` gate and approve slots | P5 | P5.4 | live-default | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; terminal handoff parity |
| `MovesPhaseStandaloneClient.tsx` `PhaseBody` and gate panel | P0–P5 | Phase step pages and `GateReadinessStep` | parallel | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; verify no non-demo reachability before deletion |
| `MovesPhaseStandaloneClient.tsx` P0 finder-columns canvas | P0 | P0.1–P0.5 | parallel | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; verify other-tenant fallback before deletion |
| `MovesPhaseStandaloneClient.tsx` `.mxw-progress-card` | P0–P5 | `MovesStepPage` phase/step chrome | parallel | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; verify no non-demo reachability before deletion |
| `MovesPhaseStandaloneClient.tsx` `phaseProgressHeaderState` | P0–P5 | `MovesStepPage` phase/step chrome | parallel | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; verify no non-demo reachability before deletion |
| `SolutionOptionChooser.tsx` `SolutionOptionChooser` | P3 | P3.2 Architecture options | hatch-only | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; route-choice parity |
| `MovesPhaseStandaloneClient.tsx` P2 capture fields superseded by root causes | P2 | P2.3 Root causes | parallel | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; saved register parity |
| `CurrentStateReadinessPanel.tsx` `EvidenceReviewEditor` | P2 | P2.3 Root causes canonical step form | parallel | Signed-in walk recorded; phase flag default for the enrolled synthetic demo tenant; evidence review authority parity |
| `MovesPhaseStandaloneClient.tsx` `CostEffortWizard` tab | P4 | P4.2 approved ROM basis | parallel | Signed-in walk recorded; estimate basis parity; verify flag reachability before deletion |

`live-default` means the old surface still receives the phase address. `parallel`
means a step-page replacement exists but the old surface remains reachable.
When a full phase switches, mark its old rows `hatch-only`. Mark rows `removed`
only in the deletion PR, with the signed-in proof linked there.
