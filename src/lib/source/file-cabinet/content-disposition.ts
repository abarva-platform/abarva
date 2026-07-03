function asciiFilenameFallback(filename: string): string {
  const fallback = filename
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\\r\n]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return fallback || "artifact";
}

export function artifactContentDisposition(
  disposition: "attachment" | "inline",
  filename: string,
): string {
  const fallback = asciiFilenameFallback(filename);
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
