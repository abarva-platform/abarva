# Dossier Fixes Applied

- Added the Home KNOW dossier route adapter and source loader.
- Added a session cache keyed by tenant, normalized question, and source signature.
- Added a quality gate for false refusals, row-count language, raw IDs, route names, debug paths, `Read`, and `Evidence` labels.
- Wired Home ask UI to call `/api/home/know/ask`.
- Added the 54-question crawl runner.
- Improved composer wording so internal `packet` language does not appear in user-facing prose.
- Fixed client-facing tenant labels and possessive wording.
