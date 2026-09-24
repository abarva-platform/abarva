# Remaining Gaps

The smoke pass fixed and shipped the defects listed in `02-defects-and-fixes.md`. These gaps remain after the shipped fixes and should be treated as follow-up work, not as resolved by this report.

| Gap | Severity | Owner/Next Step | Notes |
| --- | -------- | --------------- | ----- |
| Regenerate stale artifacts after readiness guards | P1 | Moves artifact generation lane | #8401 blocks future sign-off for raw render-package payloads, but the already-generated P2 Discovery Report still needs regeneration and rescan. |
| Improve PPTX visual generation quality | P2 | Moves artifact generation lane | #8403 reduces slide-face density, but professional architecture/flow diagrams remain open. Existing PPTX decks should be regenerated after diagram-quality work. |
| Run a fresh upload/parse/write mutation pass | P2 | Moves operating smoke lane | This report read existing evidence and persisted File Cabinet state. It did not upload a new file after the final fixes to prove parser-to-state mapping end to end. |
| Broaden aVa review beyond terminal P5 | P2 | Moves aVa lane | P5 terminal guidance is browser-proven. Earlier phase guidance was not resampled in this final pass. |
| Separate review-ready from client-final everywhere | P2 | Moves UX/content lane | File Cabinet wording now uses review-ready exports. Generated artifacts still carry draft disclaimers and assumption markers until human review/approval. |
