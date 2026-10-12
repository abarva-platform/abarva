/** Format source metadata; canonical provenance and Claude's text stay intact. */
export function sourceDisplayLabel(label: string): string {
  return label.replace(
    /^(?:H\d+|(?:APP|RISK|SYS|UC|CAP|MET|PLAT|PROG|INIT|VEN|TOOL|FUNC|ORG|PROC|EVID|INT)-\d+)\s*[:·–—]\s*/,
    "",
  );
}
