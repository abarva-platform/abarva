import type {
  CmdbCiRow,
  CmdbCriticality,
  CmdbDependencyRow,
  CmdbDependencyType,
  CmdbLifecycleState,
} from './schema';

/**
 * Synthetic Northwind Retail CMDB. Used by:
 *   - the sample-filled template under public/templates/tower/servicenow-cmdb/sample.xlsx
 *   - the test suite (deterministic shape: 207 CIs, 412 edges)
 *
 * NOT a real customer extract. The banner sheet in sample.xlsx makes that
 * explicit. Tier-1 retail-archetype CIs only — checkout / inventory / order /
 * fulfillment / loyalty / pricing — so Atlas synthesis demos make sense.
 *
 * Deterministic: the same inputs produce the same outputs, every time. No
 * Math.random(); no Date.now(). Tests rely on this.
 */

interface AppSeed {
  slug: string;
  name: string;
  businessService: string;
  ownerTeam: string;
  criticality: CmdbCriticality;
  lifecycleState?: CmdbLifecycleState; // default 'production'
  /** Slugs of databases / queues / LB this app depends on. */
  databases?: string[];
  queues?: string[];
  loadBalancers?: string[];
  /** Slugs of other apps this app calls. */
  callsApps?: string[];
}

const APP_SEEDS: AppSeed[] = [
  // Storefront
  { slug: 'pos-checkout-api', name: 'POS Checkout API', businessService: 'Point of Sale', ownerTeam: 'Store Systems', criticality: 'tier_1', databases: ['db-checkout'], queues: ['mq-order-events'], loadBalancers: ['lb-storefront'], callsApps: ['pricing-engine', 'tax-service', 'inventory-availability-api', 'loyalty-redemption-api', 'fraud-screening-api'] },
  { slug: 'pos-receipt-printer', name: 'POS Receipt Printer Service', businessService: 'Point of Sale', ownerTeam: 'Store Systems', criticality: 'tier_2', callsApps: ['pos-checkout-api'] },
  { slug: 'storefront-web', name: 'northwind.com Storefront Web', businessService: 'eCommerce Storefront', ownerTeam: 'Digital Channels', criticality: 'tier_1', loadBalancers: ['lb-storefront-public'], callsApps: ['product-catalog-api', 'cart-service', 'pricing-engine', 'recommendations-api', 'session-service'] },
  { slug: 'storefront-mobile-bff', name: 'Storefront Mobile BFF', businessService: 'eCommerce Storefront', ownerTeam: 'Digital Channels', criticality: 'tier_1', callsApps: ['product-catalog-api', 'cart-service', 'pricing-engine', 'recommendations-api'] },
  { slug: 'cart-service', name: 'Cart Service', businessService: 'eCommerce Storefront', ownerTeam: 'Digital Channels', criticality: 'tier_1', databases: ['db-cart-redis'] },
  { slug: 'product-catalog-api', name: 'Product Catalog API', businessService: 'Merchandising', ownerTeam: 'Catalog Engineering', criticality: 'tier_1', databases: ['db-catalog'], queues: ['mq-catalog-updates'] },
  { slug: 'pricing-engine', name: 'Pricing Engine', businessService: 'Merchandising', ownerTeam: 'Pricing Platform', criticality: 'tier_1', databases: ['db-pricing'], callsApps: ['promotion-service'] },
  { slug: 'promotion-service', name: 'Promotion Service', businessService: 'Merchandising', ownerTeam: 'Pricing Platform', criticality: 'tier_2', databases: ['db-promotions'] },
  { slug: 'recommendations-api', name: 'Recommendations API', businessService: 'Merchandising', ownerTeam: 'Personalization Platform', criticality: 'tier_3', callsApps: ['ml-feature-store'] },

  // Order + fulfillment
  { slug: 'order-orchestrator', name: 'Order Orchestrator', businessService: 'Order Management', ownerTeam: 'Order Platform', criticality: 'tier_1', databases: ['db-orders'], queues: ['mq-order-events', 'mq-fulfillment'], callsApps: ['inventory-allocation', 'payment-gateway', 'fraud-screening-api', 'tax-service', 'notification-service'] },
  { slug: 'order-history-api', name: 'Order History API', businessService: 'Order Management', ownerTeam: 'Order Platform', criticality: 'tier_2', databases: ['db-orders'] },
  { slug: 'returns-portal', name: 'Returns Portal', businessService: 'Order Management', ownerTeam: 'Order Platform', criticality: 'tier_2', callsApps: ['order-history-api', 'inventory-allocation', 'refund-service'] },
  { slug: 'refund-service', name: 'Refund Service', businessService: 'Order Management', ownerTeam: 'Order Platform', criticality: 'tier_2', databases: ['db-orders'], callsApps: ['payment-gateway'] },
  { slug: 'fulfillment-router', name: 'Fulfillment Router', businessService: 'Fulfillment', ownerTeam: 'Fulfillment Engineering', criticality: 'tier_1', queues: ['mq-fulfillment'], callsApps: ['wms-adapter', '3pl-router', 'store-fulfillment-api'] },
  { slug: 'wms-adapter', name: 'WMS Adapter', businessService: 'Fulfillment', ownerTeam: 'Fulfillment Engineering', criticality: 'tier_1', databases: ['db-wms'] },
  { slug: '3pl-router', name: '3PL Router', businessService: 'Fulfillment', ownerTeam: 'Fulfillment Engineering', criticality: 'tier_2' },
  { slug: 'store-fulfillment-api', name: 'Store Fulfillment API', businessService: 'Fulfillment', ownerTeam: 'Store Systems', criticality: 'tier_2', databases: ['db-store-ops'] },
  { slug: 'shipping-label-service', name: 'Shipping Label Service', businessService: 'Fulfillment', ownerTeam: 'Fulfillment Engineering', criticality: 'tier_2' },
  { slug: 'parcel-tracking-aggregator', name: 'Parcel Tracking Aggregator', businessService: 'Fulfillment', ownerTeam: 'Fulfillment Engineering', criticality: 'tier_3', databases: ['db-tracking'] },

  // Inventory
  { slug: 'inventory-availability-api', name: 'Inventory Availability API', businessService: 'Inventory', ownerTeam: 'Inventory Platform', criticality: 'tier_1', databases: ['db-inventory'], queues: ['mq-inventory-events'] },
  { slug: 'inventory-allocation', name: 'Inventory Allocation Service', businessService: 'Inventory', ownerTeam: 'Inventory Platform', criticality: 'tier_1', databases: ['db-inventory'], queues: ['mq-inventory-events'] },
  { slug: 'replenishment-planner', name: 'Replenishment Planner', businessService: 'Inventory', ownerTeam: 'Inventory Platform', criticality: 'tier_2', databases: ['db-inventory', 'db-forecast'] },
  { slug: 'demand-forecaster', name: 'Demand Forecaster', businessService: 'Inventory', ownerTeam: 'Data Science Platform', criticality: 'tier_3', databases: ['db-forecast'], callsApps: ['ml-feature-store'] },
  { slug: 'cycle-count-mobile', name: 'Cycle Count Mobile Service', businessService: 'Inventory', ownerTeam: 'Store Systems', criticality: 'tier_3' },

  // Payments + risk
  { slug: 'payment-gateway', name: 'Payment Gateway', businessService: 'Payments', ownerTeam: 'Payments Platform', criticality: 'tier_1', databases: ['db-payments-vault'], callsApps: ['fraud-screening-api', 'tokenization-service'] },
  { slug: 'tokenization-service', name: 'PCI Tokenization Service', businessService: 'Payments', ownerTeam: 'Payments Platform', criticality: 'tier_1', databases: ['db-token-vault'] },
  { slug: 'fraud-screening-api', name: 'Fraud Screening API', businessService: 'Risk', ownerTeam: 'Risk Platform', criticality: 'tier_2', callsApps: ['ml-feature-store'] },
  { slug: 'tax-service', name: 'Tax Service', businessService: 'Payments', ownerTeam: 'Payments Platform', criticality: 'tier_2', databases: ['db-tax'] },

  // Loyalty + identity
  { slug: 'loyalty-account-api', name: 'Loyalty Account API', businessService: 'Loyalty', ownerTeam: 'Loyalty Platform', criticality: 'tier_2', databases: ['db-loyalty'] },
  { slug: 'loyalty-redemption-api', name: 'Loyalty Redemption API', businessService: 'Loyalty', ownerTeam: 'Loyalty Platform', criticality: 'tier_2', databases: ['db-loyalty'], callsApps: ['loyalty-account-api'] },
  { slug: 'session-service', name: 'Session Service', businessService: 'Identity', ownerTeam: 'Identity Platform', criticality: 'tier_1', databases: ['db-session-redis'] },
  { slug: 'customer-identity-api', name: 'Customer Identity API', businessService: 'Identity', ownerTeam: 'Identity Platform', criticality: 'tier_1', databases: ['db-customer'] },
  { slug: 'cdp-profile-store', name: 'CDP Profile Store', businessService: 'Customer Data Platform', ownerTeam: 'Data Platform', criticality: 'tier_2', databases: ['db-cdp'] },

  // Notification + comms
  { slug: 'notification-service', name: 'Notification Service', businessService: 'Customer Communications', ownerTeam: 'Comms Platform', criticality: 'tier_2', queues: ['mq-notifications'] },
  { slug: 'email-sender', name: 'Transactional Email Sender', businessService: 'Customer Communications', ownerTeam: 'Comms Platform', criticality: 'tier_3', queues: ['mq-notifications'] },
  { slug: 'sms-sender', name: 'Transactional SMS Sender', businessService: 'Customer Communications', ownerTeam: 'Comms Platform', criticality: 'tier_3', queues: ['mq-notifications'] },

  // Data + ML
  { slug: 'ml-feature-store', name: 'ML Feature Store', businessService: 'Data Platform', ownerTeam: 'Data Science Platform', criticality: 'tier_3', databases: ['db-feature-store'] },
  { slug: 'datalake-ingest-router', name: 'Datalake Ingest Router', businessService: 'Data Platform', ownerTeam: 'Data Platform', criticality: 'tier_3', queues: ['mq-ingest-bus'] },
  { slug: 'reporting-warehouse-loader', name: 'Reporting Warehouse Loader', businessService: 'Analytics', ownerTeam: 'Data Platform', criticality: 'tier_3', databases: ['db-warehouse'] },
  { slug: 'reporting-bi-portal', name: 'BI Portal', businessService: 'Analytics', ownerTeam: 'Data Platform', criticality: 'tier_4', databases: ['db-warehouse'] },

  // Back office
  { slug: 'employee-portal', name: 'Employee Portal', businessService: 'Workforce', ownerTeam: 'Workforce Tech', criticality: 'tier_3', callsApps: ['workforce-scheduling-api'] },
  { slug: 'workforce-scheduling-api', name: 'Workforce Scheduling API', businessService: 'Workforce', ownerTeam: 'Workforce Tech', criticality: 'tier_3', databases: ['db-workforce'] },
  { slug: 'hris-adapter', name: 'HRIS Adapter (Workday)', businessService: 'Workforce', ownerTeam: 'Workforce Tech', criticality: 'tier_3' },
  { slug: 'gl-posting-service', name: 'GL Posting Service', businessService: 'Finance', ownerTeam: 'Finance Platform', criticality: 'tier_3', databases: ['db-gl-staging'] },
  { slug: 'erp-adapter', name: 'ERP Adapter (SAP)', businessService: 'Finance', ownerTeam: 'Finance Platform', criticality: 'tier_3' },

  // Retiring / dev systems (to exercise lifecycle_state variety)
  { slug: 'legacy-promo-engine', name: 'Legacy Promo Engine (sunset)', businessService: 'Merchandising', ownerTeam: 'Pricing Platform', criticality: 'tier_4', lifecycleState: 'retired' },
  { slug: 'storefront-experiments', name: 'Storefront Experiments (dev)', businessService: 'eCommerce Storefront', ownerTeam: 'Digital Channels', criticality: 'tier_4', lifecycleState: 'dev' },
  { slug: 'next-gen-checkout', name: 'Next-Gen Checkout (pilot)', businessService: 'Point of Sale', ownerTeam: 'Store Systems', criticality: 'tier_4', lifecycleState: 'pre_production' },
];

interface InfraSeed {
  slug: string;
  name: string;
  ciType: 'database' | 'queue' | 'load_balancer';
  ciClass: string;
  businessService: string;
  ownerTeam: string;
  criticality: CmdbCriticality;
  environment?: string;
}

const INFRA_SEEDS: InfraSeed[] = [
  // Databases
  { slug: 'db-checkout', name: 'db-checkout · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Point of Sale', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-catalog', name: 'db-catalog · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Merchandising', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-pricing', name: 'db-pricing · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Merchandising', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-promotions', name: 'db-promotions · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Merchandising', ownerTeam: 'DBA Platform', criticality: 'tier_2' },
  { slug: 'db-cart-redis', name: 'db-cart · Redis cluster', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'eCommerce Storefront', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-session-redis', name: 'db-session · Redis cluster', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Identity', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-orders', name: 'db-orders · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Order Management', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-inventory', name: 'db-inventory · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Inventory', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-forecast', name: 'db-forecast · Postgres analytics', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Inventory', ownerTeam: 'DBA Platform', criticality: 'tier_3' },
  { slug: 'db-payments-vault', name: 'db-payments-vault · Postgres prod (PCI)', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Payments', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-token-vault', name: 'db-token-vault · Postgres prod (PCI)', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Payments', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-tax', name: 'db-tax · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Payments', ownerTeam: 'DBA Platform', criticality: 'tier_2' },
  { slug: 'db-loyalty', name: 'db-loyalty · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Loyalty', ownerTeam: 'DBA Platform', criticality: 'tier_2' },
  { slug: 'db-customer', name: 'db-customer · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Identity', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-cdp', name: 'db-cdp · BigQuery', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Customer Data Platform', ownerTeam: 'Data Platform', criticality: 'tier_2' },
  { slug: 'db-wms', name: 'db-wms · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Fulfillment', ownerTeam: 'DBA Platform', criticality: 'tier_1' },
  { slug: 'db-store-ops', name: 'db-store-ops · Postgres regional', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Store Operations', ownerTeam: 'DBA Platform', criticality: 'tier_2' },
  { slug: 'db-tracking', name: 'db-tracking · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Fulfillment', ownerTeam: 'DBA Platform', criticality: 'tier_3' },
  { slug: 'db-feature-store', name: 'db-feature-store · Postgres ML', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Data Platform', ownerTeam: 'DBA Platform', criticality: 'tier_3' },
  { slug: 'db-warehouse', name: 'db-warehouse · Snowflake', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Analytics', ownerTeam: 'Data Platform', criticality: 'tier_3' },
  { slug: 'db-workforce', name: 'db-workforce · Postgres prod', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Workforce', ownerTeam: 'DBA Platform', criticality: 'tier_3' },
  { slug: 'db-gl-staging', name: 'db-gl-staging · Postgres', ciType: 'database', ciClass: 'cmdb_ci_db_instance', businessService: 'Finance', ownerTeam: 'DBA Platform', criticality: 'tier_3' },

  // Queues
  { slug: 'mq-order-events', name: 'mq-order-events · Kafka topic', ciType: 'queue', ciClass: 'cmdb_ci_msg_queue', businessService: 'Order Management', ownerTeam: 'Streaming Platform', criticality: 'tier_1' },
  { slug: 'mq-fulfillment', name: 'mq-fulfillment · Kafka topic', ciType: 'queue', ciClass: 'cmdb_ci_msg_queue', businessService: 'Fulfillment', ownerTeam: 'Streaming Platform', criticality: 'tier_1' },
  { slug: 'mq-inventory-events', name: 'mq-inventory-events · Kafka topic', ciType: 'queue', ciClass: 'cmdb_ci_msg_queue', businessService: 'Inventory', ownerTeam: 'Streaming Platform', criticality: 'tier_1' },
  { slug: 'mq-catalog-updates', name: 'mq-catalog-updates · Kafka topic', ciType: 'queue', ciClass: 'cmdb_ci_msg_queue', businessService: 'Merchandising', ownerTeam: 'Streaming Platform', criticality: 'tier_2' },
  { slug: 'mq-notifications', name: 'mq-notifications · SQS', ciType: 'queue', ciClass: 'cmdb_ci_msg_queue', businessService: 'Customer Communications', ownerTeam: 'Streaming Platform', criticality: 'tier_2' },
  { slug: 'mq-ingest-bus', name: 'mq-ingest-bus · Kafka topic', ciType: 'queue', ciClass: 'cmdb_ci_msg_queue', businessService: 'Data Platform', ownerTeam: 'Streaming Platform', criticality: 'tier_3' },

  // Load balancers
  { slug: 'lb-storefront', name: 'lb-storefront · F5 VIP', ciType: 'load_balancer', ciClass: 'cmdb_ci_lb', businessService: 'Point of Sale', ownerTeam: 'Network Engineering', criticality: 'tier_1' },
  { slug: 'lb-storefront-public', name: 'lb-storefront-public · F5 VIP', ciType: 'load_balancer', ciClass: 'cmdb_ci_lb', businessService: 'eCommerce Storefront', ownerTeam: 'Network Engineering', criticality: 'tier_1' },
];

interface ServerSeed {
  slug: string;
  name: string;
  ownerTeam: string;
  region: string;
  /** Slugs of apps / dbs that "run on" this server. */
  hosts: string[];
}

/**
 * A small fleet of physical / VM hosts so we can exercise the `runs_on`
 * dependency type. ~120 servers spread across three regions; we map each
 * app/db onto a host deterministically below.
 */
function buildServerSeeds(): ServerSeed[] {
  const regions = ['us-east-1', 'us-west-2', 'eu-west-1'] as const;
  const roles = [
    'app',
    'app',
    'app',
    'db',
    'db',
    'cache',
    'kafka',
    'edge',
  ] as const;
  const servers: ServerSeed[] = [];
  for (const region of regions) {
    for (let i = 0; i < 48; i += 1) {
      const role = roles[i % roles.length];
      servers.push({
        slug: `host-${region}-${role}-${String(i + 1).padStart(3, '0')}`,
        name: `nwr-${region}-${role}-${String(i + 1).padStart(3, '0')}.northwind.internal`,
        ownerTeam:
          role === 'db' || role === 'cache'
            ? 'DBA Platform'
            : role === 'kafka'
              ? 'Streaming Platform'
              : role === 'edge'
                ? 'Network Engineering'
                : 'Platform Engineering',
        region,
        hosts: [], // populated by mapHostsToWorkloads
      });
    }
  }
  return servers;
}

/**
 * Deterministic 32-char-hex sys_id from a stable slug. Real ServiceNow
 * sys_ids look like 32 lowercase hex characters; we mimic the shape so a
 * customer reviewing the workbook recognises the format without
 * confusing the demo data for a real export.
 */
function syntheticSysId(prefix: string, slug: string): string {
  // Two independent FNV-1a hash streams seeded differently, then
  // expanded with an LCG. This keeps the function pure and
  // deterministic, but spreads inputs across the 32-hex output space
  // tightly enough that ~230 inputs don't collide in practice.
  const input = `${prefix}:${slug}`;
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < input.length; i += 1) {
    h1 = ((h1 ^ input.charCodeAt(i)) * 0x01000193) >>> 0;
    h2 = ((h2 ^ (input.charCodeAt(i) * 31 + i)) * 0x01000193) >>> 0;
  }
  const bytes: number[] = [];
  let state1 = h1 >>> 0;
  let state2 = h2 >>> 0;
  for (let i = 0; i < 16; i += 1) {
    state1 = (state1 * 1664525 + 1013904223) >>> 0;
    state2 = (state2 * 22695477 + 12345) >>> 0;
    bytes.push((state1 ^ state2) & 0xff);
  }
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SyntheticCmdb {
  cis: CmdbCiRow[];
  dependencies: CmdbDependencyRow[];
}

function pickHostFor(
  servers: ServerSeed[],
  role: 'app' | 'db' | 'cache' | 'kafka' | 'edge',
  slugHash: number,
): ServerSeed {
  const candidates = servers.filter((s) => s.slug.includes(`-${role}-`));
  return candidates[Math.abs(slugHash) % candidates.length]!;
}

function slugHash(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i += 1) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Build the synthetic Northwind Retail CMDB. Pure function — deterministic
 * given identical inputs (which it has none of). Returns ~200 CIs and ~400
 * dependency edges.
 */
export function buildSyntheticNorthwindCmdb(): SyntheticCmdb {
  const cis: CmdbCiRow[] = [];
  const dependencies: CmdbDependencyRow[] = [];

  const sysIdBySlug = new Map<string, string>();

  // Apps -----------------------------------------------------------------
  for (const app of APP_SEEDS) {
    const sysId = syntheticSysId('app', app.slug);
    sysIdBySlug.set(app.slug, sysId);
    cis.push({
      ciSysId: sysId,
      ciName: app.name,
      ciType: 'application',
      ciClass: 'cmdb_ci_appl',
      lifecycleState: app.lifecycleState ?? 'production',
      ownerTeam: app.ownerTeam,
      businessService: app.businessService,
      criticality: app.criticality,
      environment:
        app.lifecycleState === 'dev'
          ? 'dev'
          : app.lifecycleState === 'pre_production'
            ? 'stage'
            : app.lifecycleState === 'retired'
              ? 'prod'
              : 'prod',
    });
  }

  // Infra (db / queue / lb) ---------------------------------------------
  for (const infra of INFRA_SEEDS) {
    const sysId = syntheticSysId(infra.ciType, infra.slug);
    sysIdBySlug.set(infra.slug, sysId);
    cis.push({
      ciSysId: sysId,
      ciName: infra.name,
      ciType: infra.ciType,
      ciClass: infra.ciClass,
      lifecycleState: 'production',
      ownerTeam: infra.ownerTeam,
      businessService: infra.businessService,
      criticality: infra.criticality,
      environment: infra.environment ?? 'prod',
    });
  }

  // Servers --------------------------------------------------------------
  const servers = buildServerSeeds();
  for (const server of servers) {
    const sysId = syntheticSysId('server', server.slug);
    sysIdBySlug.set(server.slug, sysId);
    cis.push({
      ciSysId: sysId,
      ciName: server.name,
      ciType: 'server',
      ciClass: 'cmdb_ci_linux_server',
      lifecycleState: 'production',
      ownerTeam: server.ownerTeam,
      businessService: 'Platform Infrastructure',
      criticality: 'tier_3',
      environment: 'prod',
    });
  }

  // -- Dependency edges --------------------------------------------------
  const seenEdgeKey = new Set<string>();
  const pushEdge = (
    sourceSlug: string,
    targetSlug: string,
    dependencyType: CmdbDependencyType,
  ): void => {
    const source = sysIdBySlug.get(sourceSlug);
    const target = sysIdBySlug.get(targetSlug);
    if (!source || !target || source === target) return;
    const key = `${source}::${target}::${dependencyType}`;
    if (seenEdgeKey.has(key)) return;
    seenEdgeKey.add(key);
    dependencies.push({
      sourceCiSysId: source,
      targetCiSysId: target,
      dependencyType,
    });
  };

  // (a) App → infra (depends_on)
  for (const app of APP_SEEDS) {
    for (const dbSlug of app.databases ?? []) pushEdge(app.slug, dbSlug, 'depends_on');
    for (const qSlug of app.queues ?? []) pushEdge(app.slug, qSlug, 'connects_to');
    for (const lbSlug of app.loadBalancers ?? []) pushEdge(lbSlug, app.slug, 'connects_to');
  }

  // (b) App → app (depends_on)
  for (const app of APP_SEEDS) {
    for (const callee of app.callsApps ?? []) pushEdge(app.slug, callee, 'depends_on');
  }

  // (c) Real-world apps run on multiple servers (active/active + DR). Each
  //     non-retired app gets primary+secondary host edges per region.
  for (const app of APP_SEEDS) {
    if (app.lifecycleState === 'retired') continue;
    const seed = slugHash(app.slug);
    // primary in the slug's region; one secondary in another region for DR
    // Tier-1 apps fan out further (active/active across 3 regions + replicas).
    const fanout = app.criticality === 'tier_1' ? 5 : 3;
    for (let n = 0; n < fanout; n += 1) {
      pushEdge(app.slug, pickHostFor(servers, 'app', seed + n * 17).slug, 'runs_on');
    }
  }
  for (const infra of INFRA_SEEDS) {
    const seed = slugHash(infra.slug);
    if (infra.ciType === 'load_balancer') {
      pushEdge(infra.slug, pickHostFor(servers, 'edge', seed).slug, 'runs_on');
      pushEdge(infra.slug, pickHostFor(servers, 'edge', seed + 13).slug, 'runs_on');
      continue;
    }
    if (infra.ciType === 'queue') {
      pushEdge(infra.slug, pickHostFor(servers, 'kafka', seed).slug, 'runs_on');
      pushEdge(infra.slug, pickHostFor(servers, 'kafka', seed + 13).slug, 'runs_on');
      pushEdge(infra.slug, pickHostFor(servers, 'kafka', seed + 29).slug, 'runs_on');
      continue;
    }
    if (infra.slug.includes('redis')) {
      pushEdge(infra.slug, pickHostFor(servers, 'cache', seed).slug, 'runs_on');
      pushEdge(infra.slug, pickHostFor(servers, 'cache', seed + 13).slug, 'runs_on');
      continue;
    }
    // Databases: primary + replica
    pushEdge(infra.slug, pickHostFor(servers, 'db', seed).slug, 'runs_on');
    pushEdge(infra.slug, pickHostFor(servers, 'db', seed + 13).slug, 'runs_on');
  }

  // (d) Cross-service "connects_to" edges that emerge in real CMDBs even
  //     without being explicit "depends_on" calls — observability,
  //     identity, comms. These thicken the graph the way Atlas synthesis
  //     needs to see blast-radius.
  const observabilityFanouts = [
    'pos-checkout-api',
    'storefront-web',
    'storefront-mobile-bff',
    'cart-service',
    'product-catalog-api',
    'order-orchestrator',
    'inventory-availability-api',
    'inventory-allocation',
    'payment-gateway',
    'fraud-screening-api',
    'fulfillment-router',
    'wms-adapter',
    'notification-service',
  ];
  for (const slug of observabilityFanouts) {
    pushEdge(slug, 'datalake-ingest-router', 'connects_to');
  }
  const identityFanouts = [
    'pos-checkout-api',
    'storefront-web',
    'storefront-mobile-bff',
    'order-orchestrator',
    'returns-portal',
    'loyalty-account-api',
    'loyalty-redemption-api',
    'employee-portal',
  ];
  for (const slug of identityFanouts) {
    pushEdge(slug, 'customer-identity-api', 'connects_to');
  }
  const notificationFanouts = [
    'order-orchestrator',
    'fulfillment-router',
    'returns-portal',
    'refund-service',
    'loyalty-redemption-api',
    'parcel-tracking-aggregator',
  ];
  for (const slug of notificationFanouts) {
    pushEdge(slug, 'notification-service', 'connects_to');
  }

  // (e) Analytics fan-in: warehouse loader connects to many sources.
  const warehouseSources = [
    'db-orders',
    'db-inventory',
    'db-customer',
    'db-loyalty',
    'db-pricing',
    'db-promotions',
    'db-payments-vault',
    'db-tracking',
    'db-wms',
    'db-cdp',
    'db-feature-store',
    'db-tax',
    'db-workforce',
  ];
  for (const slug of warehouseSources) {
    pushEdge('reporting-warehouse-loader', slug, 'depends_on');
  }
  pushEdge('reporting-bi-portal', 'reporting-warehouse-loader', 'depends_on');

  // (f) Back-office adapter graph.
  pushEdge('gl-posting-service', 'erp-adapter', 'depends_on');
  pushEdge('gl-posting-service', 'db-gl-staging', 'depends_on');
  pushEdge('erp-adapter', 'db-orders', 'connects_to');
  pushEdge('employee-portal', 'hris-adapter', 'depends_on');
  pushEdge('workforce-scheduling-api', 'hris-adapter', 'connects_to');

  // (g) Cache-tier connects_to edges that follow from session/cart.
  pushEdge('storefront-web', 'session-service', 'connects_to');
  pushEdge('storefront-mobile-bff', 'session-service', 'connects_to');
  pushEdge('returns-portal', 'session-service', 'connects_to');
  pushEdge('employee-portal', 'session-service', 'connects_to');

  return { cis, dependencies };
}
