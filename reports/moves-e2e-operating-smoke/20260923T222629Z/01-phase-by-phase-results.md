# Phase-by-Phase Results

| Phase | Capture/Persistence | Upload/Parse | Carry-forward | aVa Guidance | Gate Behavior | Artifact Context | Artifact Quality | Office Export | Review Flow | File Cabinet | Phase Guidance | Result |
| ----- | ------------------- | ------------ | ------------- | ------------ | ------------- | ---------------- | ---------------- | ------------- | ----------- | ------------ | -------------- | ------ |
| P0    | Readback only       | Not rerun    | Readback only | Not sampled in this pass | Pass readback | N/A              | N/A              | N/A           | N/A         | N/A          | Pass readback  | Complete status observed |
| P1    | Readback only       | Not rerun    | Readback only | Not sampled in this pass | Pass readback | Artifact present | Review-ready sample inspected | DOCX inspected | Not rerun | Present in File Cabinet | Pass readback | Complete status observed |
| P2    | Readback only       | Not rerun    | Readback only | Not sampled in this pass | Pass readback | Artifacts present | Mixed: Root Cause strong; Discovery Report blocked by raw payload | DOCX inspected | Not rerun | Present in File Cabinet | Pass readback | Complete status observed with artifact defect |
| P3    | Readback only       | Not rerun    | Readback only | Not sampled in this pass | Pass readback | Artifacts present | Mixed: traceability/operating model strong; PPTX quality weak | DOCX/PPTX inspected | Not rerun | Present in File Cabinet | Pass readback | Complete status observed with PPTX quality gap |
| P4    | Readback only       | Not rerun    | Readback only | Not sampled in this pass | Pass readback | Artifacts present | Business case/operating model strong; some stale review markers remain | DOCX/XLSX/PPTX inspected | Not rerun | Present in File Cabinet | Pass readback | Complete status observed |
| P5    | Readback only       | Not rerun    | Pass readback | Pass after fixes | Pass browser-proof | Artifacts present | Review-ready drafts; not client-final | DOCX/XLSX inspected | Not rerun | Pass after fixes | Pass browser-proof | Complete; handed off to Tower |

## P5 Live Read-Only Proof

- Page: `https://app.abarva.ai/strategic-moves/97f4cba8-8a7f-49d3-8eca-f2b082ed68c2/phase/5`
- Raw text: `raw/live-p5-page-text.txt`
- Screenshot: `raw/live-p5-page.png`
- Gate result observed: `4/4 hard gates met`, `2 generated artifacts`, Tower handoff complete.
- Files & Evidence raw text: `raw/live-files-evidence-loaded-text.txt`
- Files & Evidence screenshot: `raw/live-files-evidence-loaded.png`
- File cabinet result observed: `38 current`, `15 deliverables`, `5 session files`, `16 evidence`, `2 approvals`.
- Note: P5 gate artifact count appears phase-specific; File Cabinet count is Move-wide.
- Defect fixed locally: terminal P5 now displays `Open Tower`, `Tower handoff complete`, and `Move handed off to Tower` instead of stale build/open labels after handoff completion.
