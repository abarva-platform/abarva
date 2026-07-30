export function GraphLegend() {
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-[#5f5e5a]">
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-5 border-t-[1.4px] border-[rgba(10,10,11,0.32)]" />
        Accepted
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-5 border-t-[1.4px] border-dashed border-[rgba(186,117,23,0.7)]" />
        Candidate -- excluded from decisions
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-5 border-t-2 border-dashed border-[rgba(163,45,45,0.6)]" />
        Gap or contradiction
      </li>
    </ul>
  );
}
