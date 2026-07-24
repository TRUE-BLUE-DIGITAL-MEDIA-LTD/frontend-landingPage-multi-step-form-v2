// pick-language.test.ts
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { pickLanguage } from './pick-language';

const supported = ['en', 'es', 'fr', 'th'] as const;

describe('pickLanguage', () => {
  it('picks the first acceptable supported language', () => {
    assert.equal(pickLanguage('es-ES,es;q=0.9,en;q=0.8', supported, 'en'), 'es');
  });

  it('strips region tags when only the base lang is supported', () => {
    assert.equal(pickLanguage('es-MX', supported, 'en'), 'es');
  });

  it('respects q-value ordering', () => {
    assert.equal(pickLanguage('de;q=0.5,fr;q=0.9', supported, 'en'), 'fr');
  });

  it('falls back to the default when nothing matches', () => {
    assert.equal(pickLanguage('jp,zh', supported, 'en'), 'en');
  });

  it('falls back to default when header is missing', () => {
    assert.equal(pickLanguage(undefined, supported, 'th'), 'th');
    assert.equal(pickLanguage('', supported, 'th'), 'th');
  });

  it('returns the default when supportedLanguages is empty', () => {
    assert.equal(pickLanguage('en', [], 'en'), 'en');
  });
});
