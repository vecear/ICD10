import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {createStore} = require('../src/state.js');

test('個人常用順序可調整，無效索引不改動資料', () => {
  const store = createStore();
  store.toggleFav('I10'); store.toggleFav('E11.9');
  assert.equal(store.moveFavorite('I10', -1), true);
  assert.deepEqual(store.getState().favs, ['I10', 'E11.9']);
  assert.equal(store.moveFavorite('I10', -1), false);
  assert.equal(store.moveFavorite('missing', 1), false);
  assert.equal(store.moveFavorite('I10', 0.5), false);
  assert.deepEqual(store.getState().favs, ['I10', 'E11.9']);
});
