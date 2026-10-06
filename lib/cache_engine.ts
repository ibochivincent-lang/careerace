/**
 * Multi-Policy Cache Engine
 * Implements the core Cache Eviction Policies highlighted in Video 2:
 * 1. LRU (Least Recently Used) - Evicts keys based on recency of access.
 * 2. LFU (Least Frequently Used) - Evicts keys with the lowest hit frequency.
 * 3. FIFO (First In, First Out) - Evicts the oldest entered key regardless of hits.
 * 
 * Supports TTL (Time to Live) and real-time hit/miss/eviction telemetry.
 */

export type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO'

export interface CacheEntry<T> {
  key: string
  value: T
  frequency: number
  insertedAt: number
  lastAccessedAt: number
  expiresAt: number | null
}

export interface CacheTelemetry {
  policy: EvictionPolicy
  capacity: number
  size: number
  hits: number
  misses: number
  evictions: number
  hitRatePercent: number
  totalRequests: number
}

// Doubly Linked List Node for O(1) LRU
interface DNode<T> {
  key: string
  value: CacheEntry<T>
  prev: DNode<T> | null
  next: DNode<T> | null
}

export class MultiPolicyCache<T = any> {
  private capacity: number
  private policy: EvictionPolicy
  private ttlMs: number | null

  // Fast key-value storage
  private store: Map<string, CacheEntry<T>> = new Map()

  // For LRU: Doubly linked list (head = most recent, tail = least recent)
  private lruMap: Map<string, DNode<T>> = new Map()
  private lruHead: DNode<T> | null = null
  private lruTail: DNode<T> | null = null

  // For FIFO: Insertion queue
  private fifoQueue: string[] = []

  // Telemetry metrics
  private hits: number = 0
  private misses: number = 0
  private evictions: number = 0

  constructor(capacity: number = 10, policy: EvictionPolicy = 'LRU', ttlSeconds?: number) {
    this.capacity = Math.max(1, capacity)
    this.policy = policy
    this.ttlMs = ttlSeconds ? ttlSeconds * 1000 : null
  }

  public getPolicy(): EvictionPolicy {
    return this.policy
  }

  public setPolicy(policy: EvictionPolicy): void {
    if (this.policy === policy) return
    this.policy = policy
    // Re-synchronize tracking structures
    this.rebuildAuxiliaryStructures()
  }

  public getCapacity(): number {
    return this.capacity
  }

  public setCapacity(newCapacity: number): void {
    this.capacity = Math.max(1, newCapacity)
    while (this.store.size > this.capacity) {
      this.evictOne()
    }
  }

  /**
   * Reads a key from cache, handling TTL expiration and policy updates.
   */
  public get(key: string): T | null {
    const entry = this.store.get(key)

    if (!entry) {
      this.misses++
      return null
    }

    // Check TTL expiration
    const now = Date.now()
    if (entry.expiresAt && now > entry.expiresAt) {
      this.delete(key)
      this.misses++
      return null
    }

    this.hits++
    entry.frequency += 1
    entry.lastAccessedAt = now

    // Policy Promotion:
    if (this.policy === 'LRU') {
      const node = this.lruMap.get(key)
      if (node) {
        this.detachLruNode(node)
        this.attachLruHead(node)
      }
    }

    return entry.value
  }

  /**
   * Writes a key-value pair to cache, triggering eviction if capacity is full.
   */
  public set(key: string, value: T, ttlSeconds?: number): { evictedKey: string | null } {
    const now = Date.now()
    const expiresAt = ttlSeconds ? now + ttlSeconds * 1000 : this.ttlMs ? now + this.ttlMs : null

    let evictedKey: string | null = null

    if (this.store.has(key)) {
      // Update existing entry
      const existing = this.store.get(key)!
      existing.value = value
      existing.frequency += 1
      existing.lastAccessedAt = now
      existing.expiresAt = expiresAt

      if (this.policy === 'LRU') {
        const node = this.lruMap.get(key)
        if (node) {
          node.value = existing
          this.detachLruNode(node)
          this.attachLruHead(node)
        }
      }

      return { evictedKey: null }
    }

    // Capacity check: evict if full
    if (this.store.size >= this.capacity) {
      evictedKey = this.evictOne()
    }

    const newEntry: CacheEntry<T> = {
      key,
      value,
      frequency: 1,
      insertedAt: now,
      lastAccessedAt: now,
      expiresAt,
    }

    this.store.set(key, newEntry)

    // Register in policy structures
    if (this.policy === 'LRU') {
      const node: DNode<T> = { key, value: newEntry, prev: null, next: null }
      this.lruMap.set(key, node)
      this.attachLruHead(node)
    } else if (this.policy === 'FIFO') {
      this.fifoQueue.push(key)
    }

    return { evictedKey }
  }

  /**
   * Evicts a single item according to active policy.
   */
  private evictOne(): string | null {
    if (this.store.size === 0) return null
    let keyToEvict: string | null = null

    if (this.policy === 'LRU') {
      // Evict tail of LRU list (least recently used)
      if (this.lruTail) {
        keyToEvict = this.lruTail.key
      }
    } else if (this.policy === 'LFU') {
      // Evict item with lowest frequency (tie breaker: oldest lastAccessedAt)
      let minFreq = Infinity
      let oldestAccess = Infinity

      for (const [k, entry] of this.store.entries()) {
        if (
          entry.frequency < minFreq ||
          (entry.frequency === minFreq && entry.lastAccessedAt < oldestAccess)
        ) {
          minFreq = entry.frequency
          oldestAccess = entry.lastAccessedAt
          keyToEvict = k
        }
      }
    } else if (this.policy === 'FIFO') {
      // Evict oldest inserted item
      while (this.fifoQueue.length > 0) {
        const candidate = this.fifoQueue.shift()!
        if (this.store.has(candidate)) {
          keyToEvict = candidate
          break
        }
      }
    }

    // Fallback if structure was desynced
    if (!keyToEvict) {
      keyToEvict = this.store.keys().next().value ?? null
    }

    if (keyToEvict) {
      this.delete(keyToEvict)
      this.evictions++
    }

    return keyToEvict
  }

  public delete(key: string): boolean {
    if (!this.store.has(key)) return false
    this.store.delete(key)

    const lruNode = this.lruMap.get(key)
    if (lruNode) {
      this.detachLruNode(lruNode)
      this.lruMap.delete(key)
    }

    return true
  }

  public clear(): void {
    this.store.clear()
    this.lruMap.clear()
    this.lruHead = null
    this.lruTail = null
    this.fifoQueue = []
  }

  /**
   * Returns list of currently stored entries sorted by recency/frequency for UI rendering.
   */
  public getEntries(): Array<CacheEntry<T> & { ttlLeftSeconds: number | null }> {
    const now = Date.now()
    const entries: Array<CacheEntry<T> & { ttlLeftSeconds: number | null }> = []

    for (const entry of this.store.values()) {
      let ttlLeft: number | null = null
      if (entry.expiresAt) {
        ttlLeft = Math.max(0, Math.ceil((entry.expiresAt - now) / 1000))
      }
      entries.push({
        ...entry,
        ttlLeftSeconds: ttlLeft,
      })
    }

    if (this.policy === 'LRU') {
      // Sorted by lastAccessedAt descending
      return entries.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
    } else if (this.policy === 'LFU') {
      // Sorted by frequency descending
      return entries.sort((a, b) => b.frequency - a.frequency)
    } else {
      // FIFO: sorted by insertedAt ascending
      return entries.sort((a, b) => a.insertedAt - b.insertedAt)
    }
  }

  public getTelemetry(): CacheTelemetry {
    const totalRequests = this.hits + this.misses
    const hitRatePercent = totalRequests > 0 ? Number(((this.hits / totalRequests) * 100).toFixed(1)) : 0
    return {
      policy: this.policy,
      capacity: this.capacity,
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRatePercent,
      totalRequests,
    }
  }

  // LRU Doubly Linked List Helpers
  private attachLruHead(node: DNode<T>): void {
    node.prev = null
    node.next = this.lruHead
    if (this.lruHead) {
      this.lruHead.prev = node
    }
    this.lruHead = node
    if (!this.lruTail) {
      this.lruTail = node
    }
  }

  private detachLruNode(node: DNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.lruHead = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.lruTail = node.prev
    }

    node.prev = null
    node.next = null
  }

  private rebuildAuxiliaryStructures(): void {
    this.lruMap.clear()
    this.lruHead = null
    this.lruTail = null
    this.fifoQueue = []

    for (const [k, entry] of this.store.entries()) {
      if (this.policy === 'LRU') {
        const node: DNode<T> = { key: k, value: entry, prev: null, next: null }
        this.lruMap.set(k, node)
        this.attachLruHead(node)
      } else if (this.policy === 'FIFO') {
        this.fifoQueue.push(k)
      }
    }
  }
}
