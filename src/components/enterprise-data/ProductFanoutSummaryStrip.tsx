import type { ProductFanoutTotal } from "@/lib/enterprise-data/product-fanout-summary";

const PRODUCT_LABELS: Readonly<Record<string, string>> = {
  home: "Home",
  source: "Source",
  tower: "Tower",
  moves: "Moves",
  intelligence: "Intelligence",
};

function formatDate(value: string | null): string {
  if (!value) return "pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function ProductFanoutSummaryStrip({
  rows,
  activeProduct,
}: {
  rows: readonly ProductFanoutTotal[];
  activeProduct: "home" | "source" | "tower" | "moves" | "intelligence";
}) {
  if (rows.length === 0) return null;
  const build = rows[0];
  return (
    <section className="rounded-md border border-[#d9ddd2] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[#667085]">
            Layer 4 fanout
          </p>
          <h2 className="text-base font-semibold text-[#111827]">
            Current canonical build routed to product projections
          </h2>
          <p className="mt-1 text-xs text-[#667085]">
            {build.buildVersion} · {formatDate(build.buildFinishedAt)}
          </p>
        </div>
        <p className="text-xs text-[#667085]">
          Source: consumption.enterprise_l4_product_fanout_totals_v1
        </p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {rows.map((row) => {
          const isActive = row.productKey === activeProduct;
          return (
            <div
              key={row.productKey}
              className={`rounded-md border p-3 ${
                isActive
                  ? "border-[#2563eb] bg-[#eff6ff]"
                  : "border-[#e5e7eb] bg-[#fafafa]"
              }`}
            >
              <div className="text-xs font-semibold uppercase text-[#667085]">
                {PRODUCT_LABELS[row.productKey] ?? row.productKey}
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#111827]">
                {row.recordCount.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-[#667085]">
                {row.objectTypeCount.toLocaleString()} object types
                {row.blockedFactCount > 0
                  ? ` · ${row.blockedFactCount.toLocaleString()} blocked facts`
                  : ""}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
