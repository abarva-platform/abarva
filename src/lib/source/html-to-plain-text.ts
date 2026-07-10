/** True when `value` looks like a full HTML document (starts with a doctype or
 *  an <html> tag), as opposed to markdown or another plain-text format. */
export function isFullHtmlDocument(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\s*(<!doctype html|<html[\s>])/i.test(value)
  );
}

/** Best-effort plain-text rendering of an HTML document, for summary blurbs
 *  where the full document is rendered separately (e.g. in a sandboxed
 *  iframe) elsewhere on the page.
 *
 * Callers MUST run this over the FULL document before truncating to a
 * preview length. Truncating first can cut an unclosed <style>/<script>
 * block's closing tag out of the slice, which leaves raw CSS/JS text
 * exposed — the stripping regexes below require a matching closing tag to
 * fire. Always strip-then-slice, never slice-then-strip.
 */
export function htmlToPlainText(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
