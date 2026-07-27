# Airline Hidden Truth Design

Hidden truth is the evaluator-only answer key used to score reconstruction quality. It is not parser-visible evidence and must never be mounted for Source, Home, Intelligence, Moves, Tower, aVa or normal application identities.

## Storage reservation

- Restricted evaluator storage: `stabairdnevallab001`
- Containers: `hidden-truth`, `source-to-truth-crosswalk`, `expected-reconstruction`, `evaluation-results`
- Allowed identity: evaluator-only managed identity
- Denied identities: parser, Claude execution path, Source, Home, aVa, normal web/worker jobs

## Hidden truth object families

- enterprise truth: canonical enterprise, regions, functions and operating model
- technology truth: applications, integrations, cloud/infrastructure, data and AI estate
- commercial truth: vendors, contracts, rate cards, invoices, proposal economics and value baselines
- operational truth: service volumes, incidents, SLAs, transition commitments and KPI observations
- relationship truth: canonical nodes and edges with expected reconstruction evidence

## Rule

Parser-visible files may contain source-native IDs, business names, document sections and evidence. Hidden truth contains canonical answer keys and scoring crosswalks. The two are connected only through the restricted crosswalk.

