import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { applyI18nSubstitution } from './substitute-i18n';

const translations = {
  en: { strings: { k0: 'Buy now', k1: 'Limited offer' }, title: '', description: '' },
  es: { strings: { k0: 'Compra ahora', k1: 'Oferta limitada' }, title: '', description: '' },
  fr: { strings: { k0: 'Acheter' /* k1 missing */ }, title: '', description: '' },
};

describe('applyI18nSubstitution', () => {
  it('replaces text content using the target language', () => {
    const dom = new JSDOM('<h1 data-i18n="k0">Buy now</h1>');
    applyI18nSubstitution(dom.window.document, translations, 'es', 'en');
    assert.equal(dom.window.document.querySelector('h1')?.textContent, 'Compra ahora');
  });

  it('falls back to the primary language when a key is missing in target', () => {
    const dom = new JSDOM('<h1 data-i18n="k1">Limited offer</h1>');
    applyI18nSubstitution(dom.window.document, translations, 'fr', 'en');
    assert.equal(dom.window.document.querySelector('h1')?.textContent, 'Limited offer');
  });

  it('leaves text unchanged when neither target nor primary has the key', () => {
    const dom = new JSDOM('<h1 data-i18n="k99">Untouched</h1>');
    applyI18nSubstitution(dom.window.document, translations, 'es', 'en');
    assert.equal(dom.window.document.querySelector('h1')?.textContent, 'Untouched');
  });

  it('is a no-op when translations is null', () => {
    const dom = new JSDOM('<h1 data-i18n="k0">Buy now</h1>');
    applyI18nSubstitution(dom.window.document, null, 'es', 'en');
    assert.equal(dom.window.document.querySelector('h1')?.textContent, 'Buy now');
  });

  it('is a no-op when target language has no entry and primary also lacks it', () => {
    const dom = new JSDOM('<h1 data-i18n="k0">Buy now</h1>');
    applyI18nSubstitution(
      dom.window.document,
      { es: { strings: {}, title: '', description: '' } } as any,
      'es',
      'jp' as any,
    );
    assert.equal(dom.window.document.querySelector('h1')?.textContent, 'Buy now');
  });

  it('does not touch <script> contents even if they have data-i18n', () => {
    const dom = new JSDOM('<script data-i18n="k0">window.foo = 1;</script>');
    applyI18nSubstitution(dom.window.document, translations, 'es', 'en');
    assert.equal(dom.window.document.querySelector('script')?.textContent, 'window.foo = 1;');
  });
});
