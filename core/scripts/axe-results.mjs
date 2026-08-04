const AXE_RULE_CATEGORY = {
  'aria-allowed-attr': 'screenreader',
  'aria-allowed-role': 'screenreader',
  'aria-command-name': 'keyboard',
  'aria-dialog-name': 'screenreader',
  'aria-hidden-body': 'screenreader',
  'aria-hidden-focus': 'keyboard',
  'aria-input-field-name': 'forms',
  'aria-required-attr': 'screenreader',
  'aria-required-children': 'screenreader',
  'aria-required-parent': 'screenreader',
  'aria-roles': 'screenreader',
  'aria-toggle-field-name': 'forms',
  'aria-valid-attr': 'screenreader',
  'aria-valid-attr-value': 'screenreader',
  'button-name': 'keyboard',
  bypass: 'keyboard',
  'color-contrast': 'contrast',
  'document-title': 'screenreader',
  'duplicate-id': 'screenreader',
  'empty-heading': 'screenreader',
  'form-field-multiple-labels': 'forms',
  'frame-title': 'screenreader',
  'heading-order': 'screenreader',
  'html-has-lang': 'screenreader',
  'html-lang-valid': 'screenreader',
  'image-alt': 'screenreader',
  label: 'forms',
  'label-content-name-mismatch': 'forms',
  'landmark-one-main': 'screenreader',
  'landmark-unique': 'screenreader',
  'link-in-text-block': 'cognitive',
  'link-name': 'screenreader',
  list: 'screenreader',
  listitem: 'screenreader',
  'meta-viewport': 'responsive',
  'meta-viewport-large': 'responsive',
  'nested-interactive': 'keyboard',
  'page-has-heading-one': 'screenreader',
  region: 'screenreader',
  'scrollable-region-focusable': 'keyboard',
  'target-size': 'touch',
  'video-caption': 'media',
};

const WCAG_TITLES = {
  '1.1.1': 'Non-text Content',
  '1.3.1': 'Info and Relationships',
  '1.3.2': 'Meaningful Sequence',
  '1.4.1': 'Use of Color',
  '1.4.3': 'Contrast (Minimum)',
  '1.4.4': 'Resize Text',
  '1.4.10': 'Reflow',
  '1.4.11': 'Non-text Contrast',
  '2.1.1': 'Keyboard',
  '2.1.2': 'No Keyboard Trap',
  '2.2.2': 'Pause, Stop, Hide',
  '2.4.1': 'Bypass Blocks',
  '2.4.2': 'Page Titled',
  '2.4.4': 'Link Purpose (In Context)',
  '2.4.6': 'Headings and Labels',
  '2.4.7': 'Focus Visible',
  '2.5.3': 'Label in Name',
  '2.5.8': 'Target Size (Minimum)',
  '3.1.1': 'Language of Page',
  '3.3.1': 'Error Identification',
  '3.3.2': 'Labels or Instructions',
  '4.1.2': 'Name, Role, Value',
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function requireResultArray(raw, field) {
  if (!Array.isArray(raw?.[field])) {
    throw new TypeError(`axe results field "${field}" must be an array`);
  }
  return raw[field];
}

export function normalizeAxeResults(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TypeError('axe results must be a JSON object');
  }
  const violations = requireResultArray(raw, 'violations');
  const passes = requireResultArray(raw, 'passes');
  const incomplete = requireResultArray(raw, 'incomplete');
  const inapplicable = requireResultArray(raw, 'inapplicable');
  const engine = raw.testEngine?.name || raw.engine || 'axe-core';
  const version = raw.testEngine?.version || raw.version || '';

  return {
    engine,
    version,
    source: version ? `${engine}@${version}` : engine,
    runner: raw.testRunner || null,
    environment: raw.testEnvironment || null,
    url: raw.url || raw.testUrl || '',
    timestamp: raw.timestamp || '',
    violations,
    passes,
    incomplete,
    inapplicable,
    counts: {
      violations: violations.length,
      violation_nodes: violations.reduce((total, rule) => total + asArray(rule?.nodes).length, 0),
      passes: passes.length,
      incomplete: incomplete.length,
      inapplicable: inapplicable.length,
    },
  };
}

export function criterionIdsFromTags(tags = []) {
  const ids = new Set();
  for (const tag of tags) {
    const match = String(tag).match(/^wcag(\d)(\d)(\d+)$/i);
    if (match) ids.add(`${match[1]}.${match[2]}.${match[3]}`);
  }
  return [...ids];
}

function criterionIdsFromText(text = '') {
  const ids = new Set();
  for (const match of String(text).matchAll(/\b([1-4]\.\d\.\d{1,2})\b/g)) ids.add(match[1]);
  return [...ids];
}

export function criteriaFromFinding(finding) {
  return [
    ...new Set([
      ...criterionIdsFromText(finding?.wcag || ''),
      ...criterionIdsFromTags(finding?.tags || []),
    ]),
  ];
}

function criteriaLabel(ids) {
  return ids.map(id => WCAG_TITLES[id] ? `${id} ${WCAG_TITLES[id]}` : id).join('; ');
}

function wcagFromAxeRule(rule) {
  const ids = criterionIdsFromTags(rule.tags);
  if (!ids.length) return rule.tags?.includes('best-practice') ? 'Best Practice' : 'axe-core rule';
  return `WCAG 2.2: ${criteriaLabel(ids)}`;
}

function levelFromAxeRule(rule) {
  const tags = asArray(rule.tags);
  if (tags.some(tag => /^wcag(?:2|21|22)aaa$/i.test(tag))) return 'AAA';
  if (tags.some(tag => /^wcag(?:2|21|22)aa$/i.test(tag))) return 'AA';
  if (tags.some(tag => /^wcag(?:2|21|22)a$/i.test(tag))) return 'A';
  return tags.includes('best-practice') ? 'Best Practice' : 'Review';
}

function severityFromAxeRule(rule) {
  if (rule.id === 'color-contrast') return 'warning';
  if (rule.impact === 'critical' || rule.impact === 'serious') return 'critical';
  if (rule.impact === 'moderate') return 'warning';
  return 'tip';
}

function categoryFromAxeRule(rule) {
  if (AXE_RULE_CATEGORY[rule.id]) return AXE_RULE_CATEGORY[rule.id];
  const tags = asArray(rule.tags);
  if (tags.includes('cat.color')) return 'contrast';
  if (tags.includes('cat.forms')) return 'forms';
  if (tags.includes('cat.keyboard')) return 'keyboard';
  if (tags.includes('cat.time-and-media')) return 'media';
  if (tags.some(tag => ['cat.text-alternatives', 'cat.name-role-value', 'cat.aria', 'cat.parsing', 'cat.semantics'].includes(tag))) return 'screenreader';
  if (/viewport|reflow|zoom/i.test(rule.id || '')) return 'responsive';
  if (/target|touch|pointer/i.test(rule.id || '')) return 'touch';
  return 'screenreader';
}

function normalizeAxeTarget(target) {
  if (Array.isArray(target)) return target.join(', ');
  if (target && typeof target === 'object') return JSON.stringify(target);
  return target || '';
}

function normalizeAxeNode(node) {
  const nested = node?.node || {};
  return {
    selector: normalizeAxeTarget(node?.target || node?.selector || nested.selector || nested.path),
    html: node?.html || node?.snippet || nested.snippet || '',
    reason: node?.failureSummary || node?.explanation || nested.explanation || '',
  };
}

export function axeViolationToFinding(rule, { index = 0, version = '' } = {}) {
  const nodes = asArray(rule?.nodes);
  const criteria = criterionIdsFromTags(rule?.tags);
  return {
    id: `axe-${rule?.id || index}`,
    key: rule?.id || undefined,
    source: version ? `axe-core@${version}` : 'axe-core',
    axe_rule_id: rule?.id || undefined,
    category: categoryFromAxeRule(rule || {}),
    severity: severityFromAxeRule(rule || {}),
    check: 'fail',
    wcag: wcagFromAxeRule(rule || {}),
    level: levelFromAxeRule(rule || {}),
    title: rule?.help || rule?.description || rule?.id || 'axe-core finding',
    affected_users: 'Users of assistive technology, keyboard navigation, low-vision settings, or other access adaptations depending on the failed rule.',
    location: nodes.length ? `${nodes.length} affected DOM element(s)` : 'Runtime DOM',
    description: rule?.description || rule?.help || `axe-core rule ${rule?.id || index} failed.`,
    fix: rule?.help ? `Resolve the axe-core rule "${rule.help}" for every listed DOM element.` : 'Review and remediate every listed DOM element.',
    legal_exposure: criteria.length
      ? `Technical mapping: ${criteriaLabel(criteria)}. This is not a legal conclusion.`
      : 'Technical accessibility finding. Legal exposure depends on site context and jurisdiction.',
    helpUrl: rule?.helpUrl,
    tags: asArray(rule?.tags),
    axe_node_count: nodes.length,
    instances: nodes.map(normalizeAxeNode),
    code_before: nodes[0]?.html || nodes[0]?.snippet || '',
  };
}

// Bug 4 (HIGH, 2026-08 axe-integration audit): a pre-refactor artifact may carry only
// `axe.violations` (or field-name variants from before this contract existed), with no
// passes/incomplete/inapplicable arrays at all. normalizeAxeResults() requires all four —
// correct for the strict CLI --axe-results boundary, wrong here, where treating a missing
// group as "axe never ran" silently drops real findings and renders a false "not included"
// notice. Missing groups default to empty instead of disqualifying the whole candidate.
function coerceLegacyAxeShape(candidate) {
  const violations = Array.isArray(candidate.violations) ? candidate.violations
    : Array.isArray(candidate.details) ? candidate.details : null;
  const passes = Array.isArray(candidate.passes) ? candidate.passes
    : Array.isArray(candidate.pass) ? candidate.pass : null;
  const inapplicable = Array.isArray(candidate.inapplicable) ? candidate.inapplicable
    : Array.isArray(candidate.not_applicable) ? candidate.not_applicable
      : Array.isArray(candidate.notApplicable) ? candidate.notApplicable : null;
  const incomplete = Array.isArray(candidate.incomplete) ? candidate.incomplete
    : Array.isArray(candidate.review) ? candidate.review : null;
  if (!violations && !passes && !inapplicable && !incomplete) return null;
  return {
    ...candidate,
    violations: violations || [],
    passes: passes || [],
    inapplicable: inapplicable || [],
    incomplete: incomplete || [],
  };
}

export function getAxeResults(audit) {
  const candidates = [
    audit?.axe,
    audit?.axe_results,
    audit?.axeResults,
    audit?.tier2_axe,
    audit?.tier2?.axe,
    audit?.live_audit?.axe,
    audit?.metadata?.axe_results,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (typeof candidate !== 'object') continue;
    const hasAllFour = ['violations', 'passes', 'incomplete', 'inapplicable'].every(field => Array.isArray(candidate[field]));
    const shaped = hasAllFour ? candidate : coerceLegacyAxeShape(candidate);
    if (!shaped) continue;
    const normalized = normalizeAxeResults(shaped);
    return {
      ...candidate,
      ...normalized,
      counts: { ...normalized.counts, ...candidate.counts },
    };
  }
  return null;
}
