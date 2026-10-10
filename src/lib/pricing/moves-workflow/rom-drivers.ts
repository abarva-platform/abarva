/**
 * The ROM component drivers, on their own so a client surface can name them
 * without importing the ROM service (whose rate resolver reaches the data
 * plane). `rom-service.ts` re-exports these; this file is the one source.
 */

/** The component drivers a ROM use case is counted by, in display order. */
export const ROM_DRIVERS = [
  "data_source_count",
  "source_table_count",
  "standard_data_entity_count",
  "dashboard_view_count",
  "design_row_count",
  "validation_row_count",
] as const;
export type RomDriver = (typeof ROM_DRIVERS)[number];

export const ROM_DRIVER_LABELS: Readonly<Record<RomDriver, string>> = {
  data_source_count: "Data sources",
  source_table_count: "Source tables",
  standard_data_entity_count: "Standard data entities",
  dashboard_view_count: "Dashboard views",
  design_row_count: "Design rows",
  validation_row_count: "Validation rows",
};
