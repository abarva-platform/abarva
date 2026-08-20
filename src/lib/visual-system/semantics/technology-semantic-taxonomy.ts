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

export type ClassificationSource =
  | "explicit_source_field"
  | "governed_reference_taxonomy"
  | "recorded_object_type"
  | "recorded_destination_type"
  | "unclassified";

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
  // --- integration engines / interoperability ---
  ["rhapsody integration engine", "integration_engine"],
  ["rhapsody", "integration_engine"],
  ["corepoint integration engine", "integration_engine"],
  ["mirth connect", "integration_engine"],
  ["cloverleaf", "integration_engine"],
  ["epic bridges", "integration_engine"],

  // --- ETL / ELT ---
  ["ssis package (on-prem)", "etl_elt_platform"],
  ["ssis package", "etl_elt_platform"],
  ["ssis etl package", "etl_elt_platform"],
  ["sql server integration services", "etl_elt_platform"],
  ["informatica powercenter etl", "etl_elt_platform"],
  ["informatica powercenter", "etl_elt_platform"],
  ["informatica intelligent cloud services", "etl_elt_platform"],
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

/** Semantic types that genuinely carry data between systems. Used to decide whether a middle lane
 * is warranted at all -- a tenant whose records name no intermediary tooling should not be given a
 * manufactured one. */
export const MOVEMENT_PLATFORM_TYPES: ReadonlySet<TechnologySemanticType> = new Set([
  "integration_engine",
  "etl_elt_platform",
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

export function isMovementPlatform(t: TechnologySemanticType): boolean {
  return MOVEMENT_PLATFORM_TYPES.has(t);
}
export function isStore(t: TechnologySemanticType): boolean {
  return STORE_TYPES.has(t);
}
