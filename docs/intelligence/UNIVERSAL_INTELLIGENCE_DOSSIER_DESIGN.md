# Universal Intelligence Dossier Design

## Purpose

Intelligence answers the advisory question: what does the loaded enterprise context mean, which patterns apply, what options exist, what tradeoffs matter, and what leadership should consider next.

Home remains the factual explorer. Intelligence is not a generic chatbot and does not ask Claude to reason from raw rows, raw corpus dumps, or every expert pack.

## Flow

User question -> `/api/intelligence/ask` -> intent router -> tenant evidence dossier -> corpus pattern dossier -> expert council dossier -> benchmark/market dossier -> decision options dossier -> risk/caveat dossier -> Claude synthesis -> quality gate -> renderer.

## Principle

Tenant facts prove. Corpus patterns compare. Experts interpret. Benchmarks calibrate. Claude synthesizes. AbarVa verifies, cites, and quality-gates.

## Packet Boundary

The model receives a bounded advisory packet with:

- tenant evidence summary
- corpus patterns with applicability
- selected expert lenses
- benchmark caveats
- decision options and tradeoffs
- missing evidence and cannot-conclude boundary

The model does not receive all tenant rows, all corpus patterns, all experts, or uncited benchmark claims.

## Implementation

The framework lives under `src/lib/intelligence/dossiers/`.

- `intelligence-intent-router.ts`: configuration-driven advisory router
- `build-intelligence-dossier.ts`: tenant/corpus/expert/options/risk assembly
- `build-corpus-pattern-dossier.ts`: compact corpus precedent packet
- `select-expert-council.ts`: capped 3-7 expert lens selection
- `build-decision-options-dossier.ts`: option/tradeoff packet
- `compose-intelligence-answer.ts`: prompt block passed to Claude

## Current Boundary

This release builds and injects the dossier into the existing Intelligence ask path. It does not yet claim signed-in deployed browser proof or completion of the full 30-question crawl matrix.
