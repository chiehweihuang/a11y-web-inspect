// Beacon · shared start-tag attribute tokenizer (core/scripts/attr-scan.mjs).
// Locks the fourth appearance of one bug class: a detector checking for an
// attribute by NAME SUBSTRING (data-reactid contains id=, an attribute
// containing onclick, data-title matching title, type= as a non-final
// attribute). attrState must do exact tokenized lookup, never substring.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attrState, parseStartTag } from '../core/scripts/attr-scan.mjs';

test('attrState: data-title does not count as title (substring bug class, case 1)', () => {
  assert.equal(attrState('<button data-title="Save">', 'title').state, 'absent');
});

test('attrState: data-reactid does not count as id (substring bug class, case 2)', () => {
  assert.equal(attrState('<div data-reactid="123">', 'id').state, 'absent');
});

test('attrState: an attribute name CONTAINING "onclick" does not count as onclick (case 3)', () => {
  assert.equal(attrState('<div data-onclick-label="track">', 'onclick').state, 'absent');
  assert.equal(attrState('<div paginationclickable="true">', 'onclick').state, 'absent');
});

test('attrState: type= as a NON-FINAL attribute is still found (case 4, the jsonld-missing bug)', () => {
  const tag = '<script type="application/ld+json" data-gatsby-head="true">';
  const t = attrState(tag, 'type');
  assert.equal(t.state, 'present-value');
  assert.equal(t.value, 'application/ld+json');
});

test('attrState: title="" is present-empty, which must NOT count as a name', () => {
  const t = attrState('<button title="">', 'title');
  assert.equal(t.state, 'present-empty');
  assert.notEqual(t.state, 'present-value');
});
test('attrState: title=\'\' (single-quoted empty) is also present-empty', () => {
  assert.equal(attrState("<button title=''>", 'title').state, 'present-empty');
});

test('attrState: unquoted values are parsed', () => {
  const tag = '<input type=text id=foo>';
  assert.deepEqual(attrState(tag, 'type'), { state: 'present-value', value: 'text' });
  assert.deepEqual(attrState(tag, 'id'), { state: 'present-value', value: 'foo' });
});

test('attrState: uppercase tag AND attribute names are matched case-insensitively', () => {
  const t = attrState('<SCRIPT TYPE="application/ld+json">', 'type');
  assert.equal(t.state, 'present-value');
  assert.equal(t.value, 'application/ld+json');
});

test('attrState: boolean attributes (present, no =) are present-empty; absent stays absent', () => {
  const tag = '<input required>';
  assert.equal(attrState(tag, 'required').state, 'present-empty');
  assert.equal(attrState(tag, 'disabled').state, 'absent');
});

test('attrState: attribute order is irrelevant', () => {
  assert.equal(attrState('<input id="x" type="hidden">', 'type').value, 'hidden');
  assert.equal(attrState('<input type="hidden" id="x">', 'type').value, 'hidden');
});

test('parseStartTag: returns a Map of every real attribute, excluding the tag name', () => {
  const attrs = parseStartTag('<div id="a" data-x="y" required>');
  assert.equal(attrs.has('div'), false);
  assert.equal(attrs.get('id'), 'a');
  assert.equal(attrs.get('data-x'), 'y');
  assert.equal(attrs.get('required'), '');
  assert.equal(attrs.size, 3);
});
