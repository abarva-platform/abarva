# Product Dev Subscription Vending Adjustment

Initial command attempted `--workload DevTest` for the Product Dev environment.
Azure rejected it with `InvalidSku`: individual billing accounts cannot create
DevTest Azure plans.

Correction: retry subscription vending with `--workload Production` while keeping
the subscription name, tags, budget, policies, and data boundary as Product Dev.
This changes only the Azure billing workload SKU, not the approved environment
scope.
