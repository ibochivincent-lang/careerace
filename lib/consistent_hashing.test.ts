import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ConsistentHashRing,
  fnv1a32,
} from './consistent_hashing.ts'

test('Consistent Hashing: fnv1a32 generates deterministic 32-bit unsigned hashes', () => {
  const h1 = fnv1a32('cache-node-1')
  const h2 = fnv1a32('cache-node-1')
  const h3 = fnv1a32('cache-node-2')

  assert.equal(h1, h2)
  assert.notEqual(h1, h3)
  assert.ok(h1 >= 0 && h1 <= 0xffffffff)
})

test('Consistent Hashing: routes keys deterministically to nodes', () => {
  const ring = new ConsistentHashRing(['Cache-A', 'Cache-B', 'Cache-C'], 30)

  const node1 = ring.getNode('user:0x123')
  const node2 = ring.getNode('user:0x123')
  assert.equal(node1, node2)
  assert.ok(['Cache-A', 'Cache-B', 'Cache-C'].includes(node1!))
})

test('Consistent Hashing: adding node redistributes only a fraction of keys (vs Modulo)', () => {
  const keys = [
    'key_alpha',
    'key_beta',
    'key_gamma',
    'key_delta',
    'key_epsilon',
    'key_zeta',
    'key_eta',
    'key_theta',
    'key_iota',
    'key_kappa',
    'key_lambda',
    'key_mu',
  ]

  const stats = ConsistentHashRing.compareRemappings(keys, 3, 4)

  // Modulo hashing remaps the vast majority of keys (~75%)
  assert.ok(stats.moduloRemappedPercent >= 60)

  // Consistent hashing remaps significantly fewer keys (~25-35%)
  assert.ok(stats.consistentRemappedPercent <= 45)
  assert.ok(stats.consistentRemapped < stats.moduloRemapped)
})

test('Consistent Hashing: handles node removal gracefully', () => {
  const ring = new ConsistentHashRing(['Cache-A', 'Cache-B'], 20)
  ring.removeNode('Cache-A')

  assert.deepEqual(ring.getNodes(), ['Cache-B'])
  assert.equal(ring.getNode('any_key'), 'Cache-B')
})
