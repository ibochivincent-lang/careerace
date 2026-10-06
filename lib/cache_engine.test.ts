import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MultiPolicyCache,
} from './cache_engine.ts'

test('MultiPolicyCache LRU: evicts least recently used item on capacity overflow', () => {
  const cache = new MultiPolicyCache<string>(3, 'LRU')

  cache.set('a', 'alpha')
  cache.set('b', 'beta')
  cache.set('c', 'gamma')

  // Access 'a' to promote it to head of LRU
  assert.equal(cache.get('a'), 'alpha')

  // Adding 'd' should evict 'b' (since 'b' was accessed least recently, 'a' was promoted and 'c' was inserted after)
  const { evictedKey } = cache.set('d', 'delta')
  assert.equal(evictedKey, 'b')

  assert.equal(cache.get('b'), null)
  assert.equal(cache.get('a'), 'alpha')
  assert.equal(cache.get('c'), 'gamma')
  assert.equal(cache.get('d'), 'delta')
})

test('MultiPolicyCache LFU: evicts least frequently used item regardless of insertion order', () => {
  const cache = new MultiPolicyCache<string>(3, 'LFU')

  cache.set('a', 'alpha')
  cache.set('b', 'beta')
  cache.set('c', 'gamma')

  // Hit 'a' 3 times, 'c' 2 times
  cache.get('a')
  cache.get('a')
  cache.get('c')

  // 'b' has frequency = 1, so it should be evicted
  const { evictedKey } = cache.set('d', 'delta')
  assert.equal(evictedKey, 'b')

  assert.equal(cache.get('b'), null)
  assert.equal(cache.get('a'), 'alpha')
  assert.equal(cache.get('c'), 'gamma')
})

test('MultiPolicyCache FIFO: evicts in strict first-in first-out order', () => {
  const cache = new MultiPolicyCache<string>(3, 'FIFO')

  cache.set('first', '1')
  cache.set('second', '2')
  cache.set('third', '3')

  // Even if 'first' is accessed, FIFO still evicts 'first'
  cache.get('first')
  cache.get('first')

  const { evictedKey } = cache.set('fourth', '4')
  assert.equal(evictedKey, 'first')
  assert.equal(cache.get('first'), null)
})

test('MultiPolicyCache: records hit rate and telemetry metrics accurately', () => {
  const cache = new MultiPolicyCache<string>(5, 'LRU')

  cache.set('x', '100')
  cache.get('x') // Hit
  cache.get('y') // Miss

  const telemetry = cache.getTelemetry()
  assert.equal(telemetry.hits, 1)
  assert.equal(telemetry.misses, 1)
  assert.equal(telemetry.hitRatePercent, 50)
  assert.equal(telemetry.size, 1)
})
