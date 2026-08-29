/**
 * Markdown check:  node --test scripts/markdown.test.ts
 *
 * The parser only has to cover what a chat answer uses, so the cases here are
 * the ones a model actually produces — and the traps that make a naive
 * implementation look broken: a bullet list read as italics, a nested marker
 * eaten by the wrong rule, markup inside a code span.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inline, parse, type Span } from '../src/lib/markdown.ts';

const kinds = (spans: Span[]) => spans.map((s) => `${s.kind}:${'text' in s ? s.text : ''}`);

test('bold, italic and both together', () => {
  assert.deepEqual(kinds(inline('**bold**')), ['bold:bold']);
  assert.deepEqual(kinds(inline('*italic*')), ['italic:italic']);
  assert.deepEqual(kinds(inline('***both***')), ['boldItalic:both']);
  assert.deepEqual(kinds(inline('__bold__')), ['bold:bold']);
  assert.deepEqual(kinds(inline('_italic_')), ['italic:italic']);
  assert.deepEqual(kinds(inline('~~gone~~')), ['strike:gone']);
});

test('markers mixed into a sentence keep the text around them', () => {
  assert.deepEqual(kinds(inline('a **b** c *d* e')), [
    'text:a ', 'bold:b', 'text: c ', 'italic:d', 'text: e',
  ]);
});

test('nothing inside a code span is markup', () => {
  // The classic failure: `**` inside backticks rendered as bold, mangling code.
  assert.deepEqual(kinds(inline('use `a ** b` here')), ['text:use ', 'code:a ** b', 'text: here']);
  assert.deepEqual(kinds(inline('`*not italic*`')), ['code:*not italic*']);
});

test('underscores inside identifiers are left alone', () => {
  // snake_case_name would otherwise come out as snake<em>case</em>name.
  assert.deepEqual(kinds(inline('snake_case_name')), ['text:snake_case_name']);
});

test('a lone asterisk is not an emphasis', () => {
  assert.deepEqual(kinds(inline('2 * 3 * 4')), ['text:2 * 3 * 4']);
});

test('links keep their text and href separate', () => {
  const spans = inline('see [docs](https://example.com/x) now');
  assert.deepEqual(kinds(spans), ['text:see ', 'link:docs', 'text: now']);
  assert.equal(spans[1].kind === 'link' && spans[1].href, 'https://example.com/x');
});

test('only http links are linkified', () => {
  // javascript: and data: URLs must never become an href.
  assert.deepEqual(kinds(inline('[x](javascript:alert(1))')), ['text:[x](javascript:alert(1))']);
  assert.deepEqual(kinds(inline('[x](data:text/html,hi)')), ['text:[x](data:text/html,hi)']);
});

test('headings, quotes and rules', () => {
  const blocks = parse('# Title\n\n> quoted\n\n---');
  assert.deepEqual(blocks.map((b) => b.kind), ['heading', 'quote', 'rule']);
  assert.equal(blocks[0].kind === 'heading' && blocks[0].level, 1);
});

test('a bullet run is one list, not one block per line', () => {
  const blocks = parse('- one\n- two\n- three');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind === 'list' && blocks[0].items.length, 3);
  assert.equal(blocks[0].kind === 'list' && blocks[0].ordered, false);
});

test('numbered lists are ordered and keep their content', () => {
  const blocks = parse('1. first\n2. second');
  assert.equal(blocks[0].kind === 'list' && blocks[0].ordered, true);
  assert.deepEqual(
    blocks[0].kind === 'list' ? blocks[0].items.map(kinds) : [],
    [['text:first'], ['text:second']],
  );
});

test('fenced code is taken verbatim, language and all', () => {
  const blocks = parse('before\n\n```ts\nconst a = **1**;\n```\n\nafter');
  assert.deepEqual(blocks.map((b) => b.kind), ['paragraph', 'code', 'paragraph']);
  assert.equal(blocks[1].kind === 'code' && blocks[1].language, 'ts');
  assert.equal(blocks[1].kind === 'code' && blocks[1].text, 'const a = **1**;');
});

test('an unclosed fence still renders as code', () => {
  // This is every streaming answer mid-flight; reflowing it as prose would look
  // like the parser breaking rather than the reply still arriving.
  const blocks = parse('```\nhalf a block');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind, 'code');
  assert.equal(blocks[0].kind === 'code' && blocks[0].text, 'half a block');
});

test('wrapped lines join into one paragraph, blank lines split them', () => {
  const blocks = parse('one\ntwo\n\nthree');
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks[0].kind === 'paragraph' ? kinds(blocks[0].spans) : [], ['text:one two']);
});

test('plain text survives untouched', () => {
  const blocks = parse('Just a sentence.');
  assert.deepEqual(blocks[0].kind === 'paragraph' ? kinds(blocks[0].spans) : [], ['text:Just a sentence.']);
});
