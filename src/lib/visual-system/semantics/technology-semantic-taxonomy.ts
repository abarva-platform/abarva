/**
 * Governed technology semantic taxonomy.
 *
 * WHY THIS EXISTS, and why it is not a source-data column.
 *
 * No recorded field carries technology semantic class cleanly. The audit
 * (docs/architecture/CURRENT_STATE_FLOW_SEMANTIC_AUDIT.md) measured all of them:
 *
 *   platformOrDatabase   mixes interface engines, ETL tools, a data warehouse, a reporting
 *                        database, a database platform, a BI extract format, and the string
 *                        "Direct point-to-point" -- which is the ABSENCE of a platform
 *   systemCategory       mixes technology class ("SSIS ETL package", "SQL Server database/mart")
 *                        with business domain ("Imaging / PACS", "Airport Operations Control")
 *   systemType           two values for one tenant (COTS, Custom-built)
 *
 * A field that mixes categories cannot define a tier, and asserting one from it produced a
 * diagram that called Epic Caboodle an integration component -- discreditable in three seconds by
 * anyone who works in the domain.
 *
 * The classification also must NOT move into the source files. With a real client we do not
 * control their extract, and requiring them to declare that Caboodle is a warehouse asks the
 * client to perform the analysis they engaged us for. Knowing what a vendor product IS travels
 * with the product, not with the tenant -- so it belongs here, reviewed once, applied everywhere.
 *
 * RULES
 *  - Exact, reviewed aliases only. No broad substring guessing: "SQL Server" appears inside
 *    "Epic Clarity (SQL Server)" and inside "SQL Server database/mart", which are a reporting
 *    database and a data mart respectively, not the same thing.
 *  - Unknown stays unknown. An unrecognised product is surfaced as "to validate", never placed in
 *    whichever lane is visually convenient.
 *  - No tenant branches. One taxonomy; tenant records flow through it.
 *  - The raw recorded value is always preserved alongside the classification.
 */

export type TechnologySemanticType =
  | "operational_source"
  | "core_transaction_system"
  | "integration_engine"
  | "etl_elt_platform"
  | "etl_pipeline_artifact"
  | "api_esb_platform"
  | "event_streaming_platform"
  | "b2b_edi_gateway"
  | "file_transfer_platform"
  | "operational_reporting_database"
  | "enterprise_data_warehouse"
  | "database_platform"
  | "data_mart"
  | "data_lake"
  | "lakehouse"
  | "bi_extract"
  | "analytics_bi_platform"
  | "consuming_application"
  | "data_governance_catalog"
  | "data_quality_tool"
  | "no_intermediary"
  | "unknown";

export type DataMovementMechanism =
  | "hl7v2"
  | "fhir_api"
  | "rest_api"
  | "soap_api"
  | "edi_x12"
  | "sftp"
  | "batch_file"
  | "etl_pipeline"
  | "database_replication"
  | "database_pull"
  | "cdc"
  | "event_stream"
  | "message_queue"
  | "vendor_extract"
  | "write_back"
  | "unknown";

/**
 * Architecture zones — the durable output of this module.
 *
 * The zone, not the picture, is the asset. Once a system is in the right zone, any surface can
 * render it: a lane diagram, a table, an aVa answer. Get the zone wrong and every one of those is
 * wrong in the same way.
 *
 * Middleware and data integration are separate zones, and warehouses and marts are separate zones,
 * because those are the distinctions a reader uses. An ESB is not an ETL tool; a Teradata warehouse
 * is not a SQL Server mart. Collapsing either pair is what makes a diagram look plausible and read
 * as amateur.
 */
export type ArchitectureZone =
  | "source_systems"
  | "healthcare_interoperability"
  | "api_ipaas_esb"
  | "event_streaming"
  | "b2b_edi"
  | "file_transfer"
  | "etl_tooling"
  | "pipeline_artifacts"
  | "operational_reporting_db"
  | "enterprise_warehouse"
  | "database_platform"
  | "data_marts"
  | "analytics_bi"
  | "governance"
  | "unzoned";

export const ZONE_LABEL: Readonly<Record<ArchitectureZone, string>> = {
  source_systems: "Source systems",
  healthcare_interoperability: "Healthcare interoperability",
  api_ipaas_esb: "API / iPaaS / ESB",
  event_streaming: "Event streaming",
  b2b_edi: "B2B / EDI",
  file_transfer: "Managed file transfer",
  etl_tooling: "ETL / ELT tooling",
  pipeline_artifacts: "Pipelines & jobs",
  operational_reporting_db: "Operational reporting databases",
  enterprise_warehouse: "Enterprise data warehouses",
  database_platform: "Database platforms",
  data_marts: "Data marts & products",
  analytics_bi: "Analytics & BI",
  governance: "Governance & quality",
  unzoned: "Unzoned — to validate",
};

export const ZONE_ORDER: ReadonlyArray<ArchitectureZone> = [
  "source_systems",
  "healthcare_interoperability",
  "api_ipaas_esb",
  "event_streaming",
  "b2b_edi",
  "file_transfer",
  "etl_tooling",
  "pipeline_artifacts",
  "operational_reporting_db",
  "enterprise_warehouse",
  "database_platform",
  "data_marts",
  "analytics_bi",
  "governance",
  "unzoned",
];

/**
 * Executive bands group zones for the landscape view. Zones stay granular underneath -- an
 * executive sees five bands, an architect drills to the zone that actually distinguishes Rhapsody
 * from Kafka. Same model, two altitudes; the band never becomes the classification.
 */
export type ExecutiveBand =
  | "business_operational"
  | "interoperability_movement"
  | "data_platforms_stores"
  | "data_products_marts"
  | "analytics_consumption"
  | "unzoned";

export const BAND_LABEL: Readonly<Record<ExecutiveBand, string>> = {
  business_operational: "Business & operational systems",
  interoperability_movement: "Interoperability & data movement",
  data_platforms_stores: "Data platforms & stores",
  data_products_marts: "Data products & marts",
  analytics_consumption: "Analytics & consumption",
  unzoned: "Unclassified — to validate",
};

export const BAND_ORDER: ReadonlyArray<ExecutiveBand> = [
  "business_operational",
  "interoperability_movement",
  "data_platforms_stores",
  "data_products_marts",
  "analytics_consumption",
  "unzoned",
];

const BAND_FOR_ZONE: Readonly<Record<ArchitectureZone, ExecutiveBand>> = {
  source_systems: "business_operational",
  healthcare_interoperability: "interoperability_movement",
  api_ipaas_esb: "interoperability_movement",
  event_streaming: "interoperability_movement",
  b2b_edi: "interoperability_movement",
  file_transfer: "interoperability_movement",
  etl_tooling: "interoperability_movement",
  pipeline_artifacts: "interoperability_movement",
  operational_reporting_db: "data_platforms_stores",
  enterprise_warehouse: "data_platforms_stores",
  database_platform: "data_platforms_stores",
  data_marts: "data_products_marts",
  analytics_bi: "analytics_consumption",
  governance: "data_platforms_stores",
  unzoned: "unzoned",
};

export function bandFor(zone: ArchitectureZone): ExecutiveBand {
  return BAND_FOR_ZONE[zone] ?? "unzoned";
}

export type ClassificationSource =
  | "explicit_source_field"
  | "governed_reference_taxonomy"
  | "recorded_object_type"
  | "recorded_destination_type"
  | "unclassified";

/**
 * A resolved technology object.
 *
 * An object has an identity AND a host, and flattening them loses whichever is inconvenient.
 * "Radiology Utilization Mart (SQL Server On-Prem)" is a data mart hosted on SQL Server. Flatten it
 * to "SQL Server" and it stops being a mart; flatten it to "integration" because a linked-server
 * pull touches it and it stops being a store at all. Both have happened.
 */
export interface ResolvedTechnologySemantics {
  /** What the business/architecture object IS. */
  entityType: TechnologySemanticType;
  /** What hosts or implements it, when the record names one. */
  platformType?: TechnologySemanticType;
  hostingPlatform?: string;
  classificationStatus: "classified" | "unknown" | "conflict";
  classificationSources: ClassificationSource[];
  rawValue: string;
  rawCategory?: string;
  /** Set when the recorded category and the exact product identity disagree. A conflict is
   * data-quality signal, not something to resolve by precedence and hide. */
  conflictReason?: string;
}

export interface SemanticClassification<T> {
  /** Exactly what the record said. Never discarded. */
  rawValue: string;
  semanticType: T;
  classificationSource: ClassificationSource;
}

/** Human-facing names. Used for lane labels, legends and node detail -- never an internal key. */
export const SEMANTIC_TYPE_LABEL: Readonly<Record<TechnologySemanticType, string>> = {
  operational_source: "Operational system",
  core_transaction_system: "Core transaction system",
  integration_engine: "Integration engine",
  etl_elt_platform: "ETL / ELT platform",
  etl_pipeline_artifact: "ETL pipeline",
  api_esb_platform: "API / ESB platform",
  event_streaming_platform: "Event streaming platform",
  b2b_edi_gateway: "B2B / EDI gateway",
  file_transfer_platform: "Managed file transfer",
  operational_reporting_database: "Operational reporting database",
  enterprise_data_warehouse: "Enterprise data warehouse",
  database_platform: "Database platform",
  data_mart: "Data mart",
  data_lake: "Data lake",
  lakehouse: "Lakehouse",
  bi_extract: "BI extract",
  analytics_bi_platform: "Analytics / BI platform",
  consuming_application: "Consuming application",
  data_governance_catalog: "Data governance / catalog",
  data_quality_tool: "Data quality tool",
  no_intermediary: "No intermediary recorded",
  unknown: "Unclassified — to validate",
};

export const MECHANISM_LABEL: Readonly<Record<DataMovementMechanism, string>> = {
  hl7v2: "HL7 v2 interface",
  fhir_api: "FHIR API",
  rest_api: "REST API",
  soap_api: "SOAP",
  edi_x12: "EDI X12",
  sftp: "File transfer (SFTP)",
  batch_file: "Batch file",
  etl_pipeline: "ETL pipeline",
  database_replication: "Database replication",
  database_pull: "Database pull",
  cdc: "Change data capture",
  event_stream: "Event stream",
  message_queue: "Message queue",
  vendor_extract: "Vendor extract",
  write_back: "Write-back",
  unknown: "Unclassified — to validate",
};

/**
 * Reviewed product aliases, normalised (lowercased, whitespace collapsed) at lookup.
 *
 * Each entry is a specific product or a specific recorded phrase, not a keyword. Adding an entry
 * is a review action: it asserts what a named product IS, and that assertion then applies to every
 * tenant that runs it.
 */
const PRODUCT_ALIASES: ReadonlyArray<readonly [string, TechnologySemanticType]> = [
  // --- source systems: ERP, HCM, finance, service, operational ---
  // These are the systems data comes FROM. Getting them into the source zone is what makes the
  // rest of the picture legible -- an unzoned ERP reads as an unknown.
  ["workday", "core_transaction_system"],
  ["workday core hr", "core_transaction_system"],
  ["workday financials", "core_transaction_system"],
  ["sap s/4hana", "core_transaction_system"],
  ["sap ecc", "core_transaction_system"],
  ["peoplesoft", "core_transaction_system"],
  ["peoplesoft gl", "core_transaction_system"],
  ["oracle e-business suite", "core_transaction_system"],
  ["oracle fusion", "core_transaction_system"],
  ["netsuite", "core_transaction_system"],
  ["infor lawson", "core_transaction_system"],
  ["infor lawson supply chain & finance erp", "core_transaction_system"],
  ["jd edwards", "core_transaction_system"],
  ["servicenow", "operational_source"],
  ["servicenow itsm", "operational_source"],
  ["salesforce", "operational_source"],
  ["adobe experience manager", "operational_source"],
  ["adobe analytics", "operational_source"],
  ["rsa archer grc", "operational_source"],
  ["kronos", "operational_source"],
  ["ukg", "operational_source"],
  ["concur", "operational_source"],
  ["coupa", "operational_source"],

  // Clinical / healthcare source systems
  ["epic hyperspace", "core_transaction_system"],
  ["epic chronicles", "core_transaction_system"],
  ["epic resolute hospital billing", "core_transaction_system"],
  ["epic resolute professional billing", "core_transaction_system"],
  ["epic mychart", "operational_source"],
  ["epic willow", "core_transaction_system"],
  ["epic willow ambulatory", "core_transaction_system"],
  ["epic willow inpatient", "core_transaction_system"],
  ["epic stork", "core_transaction_system"],
  ["epic beaker", "core_transaction_system"],
  ["epic radiant", "core_transaction_system"],
  ["epic cadence", "core_transaction_system"],
  ["epic optime", "core_transaction_system"],
  ["cerner millennium", "core_transaction_system"],
  ["meditech expanse", "core_transaction_system"],

  // Airline / transport operational systems
  ["amadeus altéa inventory", "core_transaction_system"],
  ["amadeus altéa reservations", "core_transaction_system"],
  ["amadeus altéa departure control (dcs)", "core_transaction_system"],
  ["sabre", "core_transaction_system"],
  ["aims crew pairing & rostering", "core_transaction_system"],

  // --- integration engines / interoperability ---
  ["rhapsody integration engine", "integration_engine"],
  ["rhapsody", "integration_engine"],
  ["corepoint integration engine", "integration_engine"],
  ["mirth connect", "integration_engine"],
  ["cloverleaf", "integration_engine"],
  ["epic bridges", "integration_engine"],

  // --- ETL / ELT ---
  // SSIS is Microsoft's ETL TOOL -- SQL Server Integration Services. It belongs with Informatica
  // and DataStage as data-integration tooling. The recorded value "SSIS package (on-prem)" sits in
  // the platform column and is naming that tool, loosely, as what carries the flow.
  ["ssis", "etl_elt_platform"],
  ["sql server integration services", "etl_elt_platform"],
  ["ssis package (on-prem)", "etl_elt_platform"],
  ["ssis package", "etl_elt_platform"],
  ["datastage", "etl_elt_platform"],
  ["ibm datastage", "etl_elt_platform"],
  ["sql server integration services", "etl_elt_platform"],
  ["informatica powercenter etl", "etl_elt_platform"],
  ["informatica powercenter", "etl_elt_platform"],
  ["informatica intelligent cloud services", "etl_elt_platform"],
  ["informatica data quality", "data_quality_tool"],
  ["talend", "etl_elt_platform"],
  ["dbt", "etl_elt_platform"],
  ["azure data factory", "etl_elt_platform"],
  ["aws glue", "etl_elt_platform"],

  // --- API / ESB ---
  ["api gateway / ipaas (mulesoft)", "api_esb_platform"],
  ["mulesoft", "api_esb_platform"],
  ["mulesoft anypoint", "api_esb_platform"],
  ["apigee", "api_esb_platform"],
  ["azure api management", "api_esb_platform"],
  ["ibm websphere esb", "api_esb_platform"],

  // --- event streaming ---
  ["confluent kafka event backbone", "event_streaming_platform"],
  ["confluent kafka", "event_streaming_platform"],
  ["apache kafka", "event_streaming_platform"],
  ["kafka", "event_streaming_platform"],
  ["azure event hubs", "event_streaming_platform"],
  ["amazon kinesis", "event_streaming_platform"],

  // --- B2B / EDI ---
  ["edi / b2b trading partner gateway", "b2b_edi_gateway"],
  ["edi gateway", "b2b_edi_gateway"],
  ["b2b trading partner gateway", "b2b_edi_gateway"],
  ["ibm sterling b2b integrator", "b2b_edi_gateway"],

  // --- managed file transfer ---
  ["mft", "file_transfer_platform"],
  ["managed file transfer", "file_transfer_platform"],
  ["goanywhere mft", "file_transfer_platform"],

  // --- warehouses, reporting databases, database platforms ---
  ["epic caboodle", "enterprise_data_warehouse"],
  ["caboodle", "enterprise_data_warehouse"],
  ["snowflake", "enterprise_data_warehouse"],

  ["teradata", "enterprise_data_warehouse"],
  ["teradata enterprise warehouse", "enterprise_data_warehouse"],
  ["netezza", "enterprise_data_warehouse"],
  ["ibm netezza", "enterprise_data_warehouse"],
  ["ibm netezza enterprise data warehouse", "enterprise_data_warehouse"],
  ["ibm puredata system for analytics", "enterprise_data_warehouse"],
  // Exadata is a database platform/appliance. Warehouses are sometimes hosted on it; that does
  // not make the appliance a warehouse. Product identity does not establish architectural role.
  ["exadata", "database_platform"],
  ["oracle exadata", "database_platform"],
  ["greenplum", "enterprise_data_warehouse"],
  ["vertica", "enterprise_data_warehouse"],
  ["amazon redshift", "enterprise_data_warehouse"],
  ["google bigquery", "enterprise_data_warehouse"],
  ["azure synapse analytics", "enterprise_data_warehouse"],

  ["epic clarity (sql server)", "operational_reporting_database"],
  ["epic clarity", "operational_reporting_database"],
  ["clarity", "operational_reporting_database"],

  ["sql server (on-prem)", "database_platform"],
  ["sql server", "database_platform"],
  ["microsoft sql server", "database_platform"],
  ["oracle database", "database_platform"],
  ["postgresql", "database_platform"],
  ["db2", "database_platform"],

  // --- lake / lakehouse ---
  ["databricks", "lakehouse"],
  ["delta lake", "lakehouse"],
  ["azure data lake storage", "data_lake"],
  ["amazon s3 data lake", "data_lake"],

  // --- BI extracts and platforms ---
  ["tableau extract (.hyper, on-prem)", "bi_extract"],
  ["tableau extract", "bi_extract"],
  [".hyper extract", "bi_extract"],
  ["power bi dataset", "bi_extract"],
  ["ssas olap cube", "bi_extract"],

  ["tableau server", "analytics_bi_platform"],
  ["tableau", "analytics_bi_platform"],
  ["power bi", "analytics_bi_platform"],
  ["microstrategy", "analytics_bi_platform"],
  ["qlik sense", "analytics_bi_platform"],
  ["looker", "analytics_bi_platform"],
  ["tableau enterprise bi", "analytics_bi_platform"],

  // --- governance / catalog: neither a store nor a mover ---
  ["collibra data catalog", "data_governance_catalog"],
  ["collibra", "data_governance_catalog"],
  ["alation", "data_governance_catalog"],

  // --- the recorded absence of an intermediary ---
  // Not a platform. Rendering it as a node would invent a hop the record says does not exist.
  ["direct point-to-point", "no_intermediary"],
  ["point-to-point", "no_intermediary"],
  ["direct", "no_intermediary"],
];

const MECHANISM_ALIASES: ReadonlyArray<readonly [string, DataMovementMechanism]> = [
  ["hl7v2 interface", "hl7v2"],
  ["hl7 v2", "hl7v2"],
  ["hl7v2", "hl7v2"],
  ["fhir api", "fhir_api"],
  ["fhir", "fhir_api"],
  ["rest api", "rest_api"],
  ["real-time api", "rest_api"],
  ["soap", "soap_api"],
  ["edi x12 transaction", "edi_x12"],
  ["edi x12", "edi_x12"],
  ["edi", "edi_x12"],
  ["batch file transfer (sftp)", "sftp"],
  ["batch file transfer", "batch_file"],
  ["sftp", "sftp"],
  ["ssis etl pipeline", "etl_pipeline"],
  ["etl pipeline", "etl_pipeline"],
  ["database replication (cdc)", "cdc"],
  ["database replication", "database_replication"],
  ["cdc", "cdc"],
  ["change data capture", "cdc"],
  ["sql server linked-server pull", "database_pull"],
  ["linked-server pull", "database_pull"],
  ["database pull", "database_pull"],
  ["kafka streaming", "event_stream"],
  ["event stream", "event_stream"],
  ["message queue", "message_queue"],
  ["vendor extract file", "vendor_extract"],
  ["vendor extract", "vendor_extract"],
  ["write-back", "write_back"],
];

/**
 * Recorded `systemCategory` values that ARE a technology class rather than a business domain.
 *
 * The column mixes the two — "SSIS ETL package" and "Imaging / PACS" sit in the same field — so
 * only the technology-class values are listed. A business-domain value simply does not match, and
 * the record falls through to unknown rather than being forced into a class it never claimed.
 *
 * A hit here is stronger provenance than a product alias: the source record said it directly.
 */
const CATEGORY_ALIASES: ReadonlyArray<readonly [string, TechnologySemanticType]> = [
  ["sql server database/mart", "data_mart"],
  // A named job -- "Claims ETL", "Radiology Utilization ETL" -- IS an artifact: a unit of work
  // that runs ON the tool. The tool is SSIS; the package is the job.
  ["ssis etl package", "etl_pipeline_artifact"],
  ["stored procedure", "etl_pipeline_artifact"],
  ["stored procedures", "etl_pipeline_artifact"],
  ["datastage", "etl_elt_platform"],
  ["ibm datastage", "etl_elt_platform"],
  ["ssas olap cube", "bi_extract"],
  ["ssrs report subscription set", "analytics_bi_platform"],
  // NOTE: "Data & Analytics Platform" is deliberately absent. It is a domain label covering
  // catalogs, warehouses, ETL tools and BI alike -- mapping it to one class would repeat the
  // platformOrDatabase error one level down.
  ["epic operational reporting database", "operational_reporting_database"],
  ["epic enterprise data warehouse", "enterprise_data_warehouse"],
  ["enterprise data warehouse (mpp appliance)", "enterprise_data_warehouse"],
  ["epic clinical data repository", "operational_reporting_database"],
  ["epic self-service analytics", "analytics_bi_platform"],
  ["integration engine", "integration_engine"],
  ["interface engine", "integration_engine"],
  ["middleware", "api_esb_platform"],
];

/**
 * Partition suffixes recorded on a product name -- subject areas, domains, regions.
 *
 * "Teradata Enterprise Warehouse — Finance Subject Area" and "— Crew & Ops Subject Area" are two
 * partitions of one warehouse. Exact aliasing alone classified whichever partition happened to be
 * listed and left its siblings to fall through, so the same product appeared as a warehouse in one
 * row and something else in the next. Stripping the partition is safe because it removes a
 * qualifier, never a product identity.
 */
const PARTITION_SUFFIX = /\s+[—-]\s+.+\s+(subject area|domain|region|instance|tenant)\s*$/i;

/** Environment suffixes. A product is the same product in Test as in Production, so classification
 * must strip these before matching -- otherwise every non-Production instance falls to unknown,
 * which is what left an entire estate of named Epic modules sitting in the unzoned lane. */
const ENV_SUFFIX = /\s+[—-]\s+(production|prod|test|training|dev|development|qa|stage|staging|uat|sandbox|dr)\s*$/i;

function stripPartition(value: string): string {
  return value.replace(PARTITION_SUFFIX, "").replace(ENV_SUFFIX, "").trim();
}

function normalise(value: string): string {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Exact-alias lookup. Deliberately not substring matching in either direction: "sql server"
 * is a substring of "epic clarity (sql server)", and treating that as a match would classify a
 * reporting database as a database platform. Longest aliases are checked first only so that a
 * fully-qualified recorded value wins over its own shorter form.
 */
function lookup<T>(value: string, aliases: ReadonlyArray<readonly [string, T]>): T | null {
  const n = normalise(value);
  if (!n) return null;
  const exact = aliases.find(([alias]) => alias === n);
  return exact ? exact[1] : null;
}

/**
 * Matches a reviewed alias that the value STARTS WITH, at a separator boundary.
 *
 * "SAP S/4HANA — Finance (FI)" is the SAP S/4HANA product carrying a module qualifier, and the
 * suffix rules cannot enumerate every module, region and instance naming convention a client uses.
 * A prefix match at a separator is safe where a bare substring match is not: it requires the alias
 * to be the head of the name and to end at a real boundary, so "SQL Server (on-prem)" still
 * matches the database platform while "Epic Clarity (SQL Server)" does not -- its head is
 * "Epic Clarity".
 *
 * Longest alias first, so a specific product beats its own shorter family name.
 */
function lookupPrefix<T>(value: string, aliases: ReadonlyArray<readonly [string, T]>): T | null {
  const n = normalise(value);
  if (!n) return null;
  const ordered = [...aliases].sort((a, b) => b[0].length - a[0].length);
  for (const [alias, out] of ordered) {
    if (!n.startsWith(alias)) continue;
    const next = n.charAt(alias.length);
    if (next === "" || next === " " || next === "—" || next === "-" || next === ":" || next === "(") return out;
  }
  return null;
}

export function classifyTechnology(rawValue: string): SemanticClassification<TechnologySemanticType> {
  const hit = lookup(rawValue, PRODUCT_ALIASES);
  return hit
    ? { rawValue, semanticType: hit, classificationSource: "governed_reference_taxonomy" }
    : { rawValue, semanticType: "unknown", classificationSource: "unclassified" };
}

export function classifyMechanism(rawValue: string): SemanticClassification<DataMovementMechanism> {
  const hit = lookup(rawValue, MECHANISM_ALIASES);
  return hit
    ? { rawValue, semanticType: hit, classificationSource: "governed_reference_taxonomy" }
    : { rawValue, semanticType: "unknown", classificationSource: "unclassified" };
}

/**
 * Classifies an application record, preferring what the record states over what we recognise.
 *
 * Order matters and is the point: a recorded `systemCategory` that names a technology class is the
 * source speaking directly, so it outranks our product list. Only when the record is silent (or
 * names a business domain rather than a technology) do we fall back to the reviewed product
 * aliases, and then to unknown.
 */
/**
 * Recorded categories that are BROAD -- they name a shape, not a technology. An exact product
 * alias is allowed to refine these. A precise category is not refined; disagreement with it is a
 * conflict.
 */
const BROAD_CATEGORIES: ReadonlySet<string> = new Set([
  "application",
  "applications",
  "system",
  "systems",
  "platform",
  "cots",
  "custom",
  "custom-built",
  "saas",
  "data & analytics platform",
  "it service management platform",
]);

/** Parses a trailing "(host)" qualifier: "Revenue Cycle Mart (SQL Server On-Prem)". */
function splitHost(value: string): { name: string; host?: string } {
  const m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(value.trim());
  if (!m) return { name: value.trim() };
  return { name: m[1].trim(), host: m[2].trim() };
}

/**
 * Resolves an object's identity and its host separately, and reports disagreement rather than
 * resolving it by precedence.
 *
 * Order, per the governed contract:
 *   precise recorded category  -> primary identity
 *   broad recorded category    -> exact product alias may refine it
 *   exact product alias        -> identity when no category, else subtype/host context
 *   integrationType            -> never consulted here; it describes movement, not objects
 *   substring inference        -> never
 *   unrecognised               -> unknown
 *   precise category vs product disagreement -> conflict
 */
export function resolveTechnologySemantics(input: {
  systemName?: string;
  systemCategory?: string;
  systemType?: string;
}): ResolvedTechnologySemantics {
  const rawValue = String(input.systemName ?? "").trim();
  const rawCategory = String(input.systemCategory ?? "").trim();
  const sources: ClassificationSource[] = [];

  const { name, host } = splitHost(rawValue);
  const hostCls = host ? lookup(host, PRODUCT_ALIASES) ?? lookupPrefix(host, PRODUCT_ALIASES) : null;

  const categoryPrecise = lookup(rawCategory, CATEGORY_ALIASES);
  const categoryIsBroad = BROAD_CATEGORIES.has(normalise(rawCategory));

  const productHit =
    lookup(name, PRODUCT_ALIASES) ??
    lookup(stripPartition(name), PRODUCT_ALIASES) ??
    lookupPrefix(name, PRODUCT_ALIASES);

  const base = {
    rawValue,
    ...(rawCategory ? { rawCategory } : {}),
    ...(host ? { hostingPlatform: host } : {}),
    ...(hostCls ? { platformType: hostCls } : {}),
  };

  // Precise category and product disagree -> conflict. Reported, not silently ranked.
  if (categoryPrecise && productHit && categoryPrecise !== productHit) {
    return {
      ...base,
      entityType: categoryPrecise,
      classificationStatus: "conflict",
      classificationSources: ["explicit_source_field", "governed_reference_taxonomy"],
      conflictReason: `Recorded category resolves to ${SEMANTIC_TYPE_LABEL[categoryPrecise]} while the product identity resolves to ${SEMANTIC_TYPE_LABEL[productHit]}.`,
    };
  }

  if (categoryPrecise) {
    sources.push("explicit_source_field");
    return { ...base, entityType: categoryPrecise, classificationStatus: "classified", classificationSources: sources };
  }

  if (productHit) {
    sources.push("governed_reference_taxonomy");
    if (categoryIsBroad) sources.push("explicit_source_field");
    return { ...base, entityType: productHit, classificationStatus: "classified", classificationSources: sources };
  }

  // The head did not resolve but the parenthetical did: "API Gateway / iPaaS (MuleSoft)" describes
  // the product in the bracket, not a host. When the head is unrecognised, the bracket IS the
  // product identity -- otherwise a reviewed product disappears into unknown because of how the
  // record happened to phrase it.
  if (hostCls) {
    return {
      rawValue,
      ...(rawCategory ? { rawCategory } : {}),
      entityType: hostCls,
      classificationStatus: "classified",
      classificationSources: ["governed_reference_taxonomy"],
    };
  }

  return { ...base, entityType: "unknown", classificationStatus: "unknown", classificationSources: ["unclassified"] };
}

export function classifyApplication(input: {
  systemName?: string;
  systemCategory?: string;
  systemType?: string;
}): SemanticClassification<TechnologySemanticType> {
  const rawValue = String(input.systemName ?? "").trim();

  const byCategory = lookup(input.systemCategory ?? "", CATEGORY_ALIASES);
  if (byCategory) {
    return { rawValue, semanticType: byCategory, classificationSource: "explicit_source_field" };
  }

  const byProduct =
    lookup(rawValue, PRODUCT_ALIASES) ??
    lookup(stripPartition(rawValue), PRODUCT_ALIASES) ??
    lookupPrefix(rawValue, PRODUCT_ALIASES);
  if (byProduct) {
    return { rawValue, semanticType: byProduct, classificationSource: "governed_reference_taxonomy" };
  }

  // `systemType` is deliberately NOT used as a fallback. Its values ("Data-Platform",
  // "Middleware") are coarse enough that mapping them to a specific class is a guess: a
  // data platform may be a warehouse, a lake or a BI tool, and "Middleware" covers ETL, ESB and
  // streaming alike. Guessing here produced "Informatica Data Quality is an API/ESB platform".
  return { rawValue, semanticType: "unknown", classificationSource: "unclassified" };
}

/** Semantic types that genuinely carry data between systems. Used to decide whether a middle lane
 * is warranted at all -- a tenant whose records name no intermediary tooling should not be given a
 * manufactured one. */
export const MOVEMENT_PLATFORM_TYPES: ReadonlySet<TechnologySemanticType> = new Set([
  "integration_engine",
  "etl_elt_platform",
  // A named ETL job is not a platform, but it does carry data and belongs in the data-integration
  // zone rather than disappearing from the picture.
  "etl_pipeline_artifact",
  "api_esb_platform",
  "event_streaming_platform",
  "b2b_edi_gateway",
  "file_transfer_platform",
]);

/** Semantic types that persist data. */
export const STORE_TYPES: ReadonlySet<TechnologySemanticType> = new Set([
  "operational_reporting_database",
  "enterprise_data_warehouse",
  "database_platform",
  "data_mart",
  "data_lake",
  "lakehouse",
  "bi_extract",
]);

/**
 * Semantic type to zone. One mapping, applied everywhere -- so a system cannot sit in one zone on
 * the diagram and another in a table.
 */
const ZONE_FOR_TYPE: Readonly<Record<TechnologySemanticType, ArchitectureZone>> = {
  operational_source: "source_systems",
  core_transaction_system: "source_systems",
  consuming_application: "source_systems",

  // Each interoperability role keeps its own zone. An interface engine, an API gateway, an event
  // backbone and an EDI gateway are not interchangeable, and a band that shows them as one type
  // tells an architect nothing.
  integration_engine: "healthcare_interoperability",
  api_esb_platform: "api_ipaas_esb",
  event_streaming_platform: "event_streaming",
  b2b_edi_gateway: "b2b_edi",
  file_transfer_platform: "file_transfer",

  etl_elt_platform: "etl_tooling",
  etl_pipeline_artifact: "pipeline_artifacts",

  enterprise_data_warehouse: "enterprise_warehouse",
  lakehouse: "enterprise_warehouse",
  data_lake: "enterprise_warehouse",

  // Epic Clarity is Epic's OPERATIONAL REPORTING DATABASE. It is not a mart, and grouping it with
  // marts was wrong: a mart is a downstream product, Clarity is the reporting store the products
  // are built from.
  operational_reporting_database: "operational_reporting_db",
  database_platform: "database_platform",
  data_mart: "data_marts",

  analytics_bi_platform: "analytics_bi",
  bi_extract: "analytics_bi",

  data_governance_catalog: "governance",
  data_quality_tool: "governance",

  no_intermediary: "unzoned",
  unknown: "unzoned",
};

export function zoneFor(type: TechnologySemanticType): ArchitectureZone {
  return ZONE_FOR_TYPE[type] ?? "unzoned";
}

export function isMovementPlatform(t: TechnologySemanticType): boolean {
  return MOVEMENT_PLATFORM_TYPES.has(t);
}
export function isStore(t: TechnologySemanticType): boolean {
  return STORE_TYPES.has(t);
}
