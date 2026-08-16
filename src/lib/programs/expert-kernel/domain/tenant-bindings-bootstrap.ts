// Tenant-bindings bootstrap — load every tenant module so its registry
// registration runs.
//
// The generic function-aware Intelligence builders
// (`buildVbcDecisionHome`, `buildVbcBetSelection`) consult the tenant-binding
// registry (`tenant-binding-registry.ts`) to find an `(industryKey,
// functionKey)`-specific substrate and grounded-blocks builder. Each tenant
// module (Meridian × VBC, Apex × customer care, First Capital × fraud)
// registers itself eagerly on module load by calling
// `registerDecisionHomeBinding` / `registerBetSelectionBinding` at the top
// level.
//
// For those registrations to fire, the tenant modules must be IMPORTED
// somewhere in the dependency graph reachable from the route. This bootstrap
// file is the canonical place — the route imports it once, the imports cascade
// into every tenant module, and every binding ends up registered before the
// generic builder is called.
//
// Pure side-effect imports: this file has no exports of its own.

// Note: importing the binding modules below is what triggers their
// registration calls. The `as unknown as` casts keep the imports honest about
// being for side-effect even though each module does export real shapes.

// Meridian × VBC — the reference binding. The decision-home file also exports
// the generic `buildVbcDecisionHome`, so importing it ensures Meridian
// registers and the generic builder is available to the route. The bet-
// selection module mirrors this for the Intelligence surface.
import './meridian-vbc-decision-home';
import './meridian-vbc-bet-selection';

// The Apex Retail × customer care and First Capital × fraud bindings were removed with those
// tenants in the 2026-08-16 sunset.

/**
 * Marker export — exists so a TypeScript consumer can `import { bootstrapped }`
 * to make the side-effect import literal in their code, rather than relying on
 * a bare `import './tenant-bindings-bootstrap'` that a linter might flag.
 */
export const tenantBindingsBootstrapped = true;
