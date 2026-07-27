# Partial Data and Empty-State Contract

Missing data is a normal operating condition. Consumers must preserve the difference between unavailable, withheld, not measured, candidate and accepted data.

## Allowed availability states

- `available`
- `not_loaded`
- `not_measured`
- `withheld`
- `conflicting`
- `stale`
- `candidate`
- `accepted`
- `superseded`
- `not_applicable`

## Non-negotiable conversions

- `missing` must not become `0`.
- `withheld` must not become `0`.
- `not_measured` must not become `0`.
- `candidate` must not become `accepted`.
- `target_state` must not become `current_state`.

For metrics with unavailable source data, return `value: null`, `availability_state: not_measured` and a human explanation. Home should say the underlying source has not been provided or confirmed.
