// Shared start-tag attribute lookup for Beacon's regex-based Tier-1 detectors.
//
// Fourth appearance of the same bug class (2026-08): a detector checks for an
// attribute by testing whether a NAME SUBSTRING appears anywhere in the tag,
// so it false-matches a DIFFERENT attribute that merely contains the target
// name (data-reactid contains "id=", an attribute containing "onclick",
// data-title matching /title=/, and — the instance that forced this file —
// jsonld-missing assuming type="application/ld+json" is the LAST attribute on
// the tag, so a trailing data-gatsby-head="true" hid it). One tokenizer,
// exact attribute-name lookup, order irrelevant, quoting agnostic.

const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`/]*)))?/g;

// Parses a start tag (e.g. `<script type="application/ld+json" data-x="y">`)
// into a Map<lowercase attribute name, string value>. Boolean attributes
// (present, no `=`) and explicitly empty values (`title=""`, `title=''`) both
// map to '' — callers distinguish "absent" from "present-empty" via has().
// The tag name itself (first token) is dropped.
export function parseStartTag(startTag) {
  const body = String(startTag)
    .replace(/^<\s*[^\s"'>/=]+/, '')   // strip "<tagname"
    .replace(/\/?>\s*$/, '');          // strip trailing "/>" or ">"
  const attrs = new Map();
  for (const m of body.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    if (!name) continue;
    attrs.set(name, m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

// Reports whether `name` is absent, present with an empty value (boolean
// attribute or explicit ""/''), or present with a real value — an EXACT
// tokenized attribute-name match, never a substring match.
export function attrState(startTag, name) {
  const attrs = parseStartTag(startTag);
  const lc = String(name).toLowerCase();
  if (!attrs.has(lc)) return { state: 'absent' };
  const value = attrs.get(lc);
  return value === '' ? { state: 'present-empty', value: '' } : { state: 'present-value', value };
}
