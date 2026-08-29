// Jurisdiction-expansion spec (2026-08-29): data module shape, tier-based report
// rendering, the honest-null/framework/oneline/grouped card styles, and the
// no-identical-boilerplate fix (legal_exposure derives from WCAG level; the six
// near-identical legal-section cards are now genuinely differentiated per jurisdiction).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { JURISDICTIONS, legalExposureFor } from '../core/scripts/jurisdictions.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = resolve(ROOT, 'core/scripts/generate-report.mjs');

const VALID_TIERS = new Set(['specific-law', 'framework-no-web-specifics', 'no-specific-law']);
const VALID_CARD_STYLES = new Set(['full', 'grouped', 'oneline']);

test('every jurisdiction record has the required shape', () => {
  assert.ok(JURISDICTIONS.length >= 20, `expected >=20 jurisdictions, found ${JURISDICTIONS.length}`);
  const ids = new Set();
  for (const j of JURISDICTIONS) {
    assert.ok(j.id && typeof j.id === 'string', `${JSON.stringify(j.name)} missing a string id`);
    assert.ok(!ids.has(j.id), `duplicate jurisdiction id: ${j.id}`);
    ids.add(j.id);
    assert.ok(j.name?.zh && j.name?.en, `${j.id} missing name.zh/name.en`);
    assert.ok(VALID_TIERS.has(j.tier), `${j.id} has an invalid tier: ${j.tier}`);
    assert.ok(VALID_CARD_STYLES.has(j.cardStyle), `${j.id} has an invalid cardStyle: ${j.cardStyle}`);
    assert.ok(j.scope && typeof j.scope.public === 'boolean' && typeof j.scope.private === 'boolean', `${j.id} missing scope.public/private booleans`);
    assert.ok(j.scope.text?.zh && j.scope.text?.en, `${j.id} missing scope.text.zh/en`);
    assert.ok(Array.isArray(j.sources), `${j.id} sources must be an array`);
    assert.ok(typeof j.confidence === 'string' && j.confidence, `${j.id} missing a confidence label`);
    // statute/standard/enforcement are nullable (honest-null jurisdictions), but if
    // present must carry their documented sub-shape.
    if (j.statute) {
      assert.ok(j.statute.name?.original && j.statute.name?.en, `${j.id} statute missing name.original/en`);
    }
    if (j.standard) {
      assert.ok(typeof j.standard.name === 'string', `${j.id} standard missing a name string`);
    }
    assert.ok(j.enforcement && 'mechanism' in j.enforcement && 'realCase' in j.enforcement, `${j.id} missing enforcement.mechanism/realCase`);
  }
});

test('cardStyle is independent of tier: two no-specific-law jurisdictions can render differently', () => {
  const macau = JURISDICTIONS.find(j => j.id === 'mo');
  const venezuela = JURISDICTIONS.find(j => j.id === 've');
  assert.equal(macau.tier, 'no-specific-law');
  assert.equal(venezuela.tier, 'no-specific-law');
  assert.equal(macau.cardStyle, 'full', 'Macau has real research depth -> full card');
  assert.equal(venezuela.cardStyle, 'oneline', 'Venezuela is thin/low-confidence -> oneline');
});

test('Peru is promoted to a full card (verification pass upgraded its private-sector claim to primary-quoted)', () => {
  const peru = JURISDICTIONS.find(j => j.id === 'pe');
  assert.equal(peru.cardStyle, 'full');
  assert.equal(peru.confidence, 'medium');
  assert.match(peru.statute.name.original, /Décima Tercera/);
});

test('the six existing jurisdictions carry the corrected facts (not the old wrong claims)', () => {
  const byId = Object.fromEntries(JURISDICTIONS.map(j => [j.id, j]));
  // US: Robles is a cert denial, not a Supreme Court merits ruling.
  assert.match(byId.us.enforcement.realCase.outcome, /cert/i);
  assert.doesNotMatch(byId.us.enforcement.realCase.outcome, /Supreme Court ruled/i);
  // Canada: ACA has no binding digital standard yet.
  assert.match(byId.ca.standard.binding, /尚未生效|not yet in force|not in force/i);
  // Taiwan: government/schools only, explicitly not private.
  assert.equal(byId.tw.scope.private, false);
  // Japan: JIS is not itself a private-sector legal mandate.
  assert.match(byId.jp.standard.binding, /not.*mandate|努力|環境の整備/);
  // EU: technical standard is EN 301 549, not bare WCAG.
  assert.match(byId.eu.standard.name, /EN 301 549/);
  // Australia: WCAG is AHRC guidance, not statute; Maguire v SOCOG is the real case.
  assert.equal(byId.au.tier, 'framework-no-web-specifics');
  assert.match(byId.au.enforcement.realCase.name, /Maguire/);
});

// hakuso BLOCK (2026-08-29, verification-changed facts must be locked, not just fixed once).
test('South Korea cites the CURRENT statute (디지털포용법 제19조); the repealed statute name appears only inside explicitly-marked repeal-history text', () => {
  const kr = JURISDICTIONS.find(j => j.id === 'kr');
  assert.match(kr.statute.name.original, /디지털포용법/, 'the active citation must be the current law');
  assert.match(kr.statute.name.en, /Digital Inclusion Act/);

  const src = readFileSync(resolve(ROOT, 'core/scripts/jurisdictions.mjs'), 'utf8');
  const REPEAL_MARKER = /repealed|廢止|deleted|삭제|superseded|supersedes/i;
  const mentions = [...src.matchAll(/.{0,80}지능정보화기본법.{0,80}/g)];
  assert.ok(mentions.length > 0, 'the repealed statute should still be named once, as repeal history');
  for (const m of mentions) {
    assert.match(m[0], REPEAL_MARKER, `bare mention of the repealed statute with no repeal marker nearby: "${m[0]}"`);
  }
});

test('Hong Kong standard targets WCAG 2.2, not the stale 2.0 citation', () => {
  const hk = JURISDICTIONS.find(j => j.id === 'hk');
  assert.match(hk.standard.name, /2\.2/);
  assert.match(hk.standard.version, /2\.2/);
  assert.doesNotMatch(hk.standard.name, /WCAG 2\.0/);
  assert.doesNotMatch(hk.standard.version, /2\.0/);
});

test('legalExposureFor: AAA gets the "no jurisdiction requires AAA" text; A/AA gets a differentiated jurisdiction list', () => {
  const aaa = legalExposureFor('AAA');
  assert.match(aaa.en, /none of the tracked jurisdictions/i);
  assert.match(aaa.zh, /都不要求 AAA/);
  const aa = legalExposureFor('AA');
  assert.match(aa.en, /summary-level technical mapping/i);
  assert.match(aa.en, /United States/);
  assert.doesNotMatch(aa.en, /May affect ADA \/ EAA \/ JIS \/ Taiwan/, 'must not be the old boilerplate string');
});

function writeAudit(dir, extra = {}) {
  const audit = {
    metadata: { date: '2026-01-01', scope: 'test', standard: 'WCAG 2.2 AA' },
    summary: { overall_score: 90, coverage_percent: 40, total_findings: 0, critical: 0, warnings: 0, tips: 0, categories: [] },
    findings: [],
    legal_risk: { jurisdictions: [{ name: 'US ADA' }, { name: 'EU EAA' }, { name: 'Japan JIS' }, { name: 'Taiwan' }, { name: 'Canada ACA' }, { name: 'Australia DDA' }] },
    ...extra,
  };
  const path = join(dir, 'audit.json');
  writeFileSync(path, JSON.stringify(audit));
  return path;
}

test('legal section renders full/framework/honest-null/grouped/oneline cards distinctly, no identical-boilerplate duplication', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-jurisdictions-report-'));
  try {
    const audit = writeAudit(dir);
    const report = join(dir, 'report.html');
    execFileSync('node', [REPORT, audit, '--output', report]);
    const html = readFileSync(report, 'utf8');

    // specific-law full card (Taiwan): statute + scope + standard + enforcement all present.
    assert.match(html, /身心障礙者權益保障法/);
    assert.match(html, /第52條之2/);

    // framework-no-web-specifics full card (Australia): the tier-note renders.
    assert.match(html, /General framework, not web-specific legislation/);
    assert.match(html, /Maguire v\. Sydney Organising Committee/);

    // no-specific-law FULL card (Macau): the honest-null sentence renders.
    assert.match(html, /No specific web-accessibility law was found for this jurisdiction/);
    assert.match(html, /澳門/);

    // grouped south-america comparison table (Chile/Uruguay/Ecuador).
    assert.match(html, /Other South American jurisdictions \(comparison\)/);
    assert.match(html, /智利|Chile/);

    // Peru was promoted out of the grouped table (verification pass 2026-08-29: its
    // private-sector clause is now primary-quoted) -- it must render as a full card.
    assert.match(html, /Décima Tercera/);

    // oneline honest-nulls (Venezuela etc.) render compactly, not as full cards.
    assert.match(html, /Other jurisdictions with no specific law found/);
    assert.match(html, /Venezuela|委內瑞拉/);

    // No-boilerplate-duplication: the old per-card "criteria-map" line (WCAG list repeated
    // once per card) is gone -- it must appear at most in the shared context note, not once
    // per jurisdiction card.
    assert.doesNotMatch(html, /class="criteria-map"/, 'the per-card duplicated criteria-map line must be removed');

    // Distinct content: two full cards must not render identical statute text (the exact
    // "six near-identical risk cards" complaint this spec exists to fix).
    const usStatute = html.match(/Americans with Disabilities Act[^<]*/)?.[0];
    const twStatute = html.match(/身心障礙者權益保障法[^<]*/)?.[0];
    assert.ok(usStatute && twStatute && usStatute !== twStatute, 'jurisdiction cards must carry genuinely different statute text');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('exec-summary jurisdiction chips stay scoped to the audit\'s declared six, not all 20+', () => {
  const dir = mkdtempSync(join(tmpdir(), 'beacon-jurisdictions-chips-'));
  try {
    const audit = writeAudit(dir);
    const report = join(dir, 'report.html');
    execFileSync('node', [REPORT, audit, '--output', report]);
    const html = readFileSync(report, 'utf8');
    const chipSection = html.slice(html.indexOf('class="expose"'), html.indexOf('class="expose"') + 800);
    assert.match(chipSection, /United States/);
    assert.doesNotMatch(chipSection, /Mongolia/, 'the compact exec-summary chip row must not list jurisdictions outside the audit\'s declared six');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
