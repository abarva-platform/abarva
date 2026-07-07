# Intelligence Crawl Results

## Status

Not run in this framework PR.

## Why

This release adds the tenant-agnostic dossier framework and local regression coverage. Signed-in deployed browser proof must run after the PR merges, the approved Azure Container Apps main deploy completes, and the active revision is verified.

## Required Crawl

Run the SkyHarbor and Lakeshore 30-question matrix plus tenant fence checks against `https://app.abarva.ai/intelligence`.

Minimum report fields:

- signed-in tenant
- visible tenant
- endpoint audit proving `/api/intelligence/ask`
- no `/api/home/know/ask` use for Intelligence answers
- tenant evidence score
- corpus pattern score
- expert council score
- options/tradeoff score
- missing evidence score
- tenant fence score
- screenshots and transcripts
