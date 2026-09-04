/**
 * Serialize a schema.org object for a JSON-LD <script> tag.
 *
 * JSON.stringify alone leaves one injection vector open: a string containing
 * "</script>" terminates the tag early and whatever follows runs as HTML/JS.
 * Escaping `<` as < is valid JSON, so parsers see the original text while
 * the browser's HTML tokenizer never sees a tag. Every JSON-LD component must
 * go through this — listing fields are user-submitted at /submit.
 */
export function toJsonLd(schema: object): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
