/**
 * Production Consistent Hashing Ring with Virtual Nodes
 * Solves the Database Meltdown / Cache Stampede problem (Video 1):
 * - Naive modulo hashing (hash(key) % N) causes ~75%+ of keys to remap on scale-up/scale-down.
 * - Consistent Hashing maps nodes and keys onto a 32-bit ring (0 to 2^32 - 1).
 * - Adding or removing a node only moves keys in a single arc (1/N of keys),
 *   keeping remaining cache valid and preventing thundering herds.
 */

// 32-bit FNV-1a Hash Algorithm
export function fnv1a32(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0 // Unsigned 32-bit integer [0, 4294967295]
}

export interface VirtualNode {
  hash: number
  nodeId: string
  vnodeIndex: number
}

export class ConsistentHashRing {
  private vnodesPerNode: number
  private ring: VirtualNode[] = []
  private nodes: Set<string> = new Set()

  constructor(nodes: string[] = [], vnodesPerNode: number = 50) {
    this.vnodesPerNode = Math.max(1, vnodesPerNode)
    for (const node of nodes) {
      this.addNode(node)
    }
  }

  /**
   * Adds a physical server node to the ring, populating its virtual nodes.
   */
  public addNode(nodeId: string): void {
    if (this.nodes.has(nodeId)) return
    this.nodes.add(nodeId)

    for (let i = 0; i < this.vnodesPerNode; i++) {
      const vnodeKey = `${nodeId}#vn${i}`
      const hash = fnv1a32(vnodeKey)
      this.ring.push({ hash, nodeId, vnodeIndex: i })
    }

    // Sort ring in ascending clockwise order
    this.ring.sort((a, b) => a.hash - b.hash)
  }

  /**
   * Removes a physical server node and all its virtual nodes from the ring.
   */
  public removeNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) return
    this.nodes.delete(nodeId)
    this.ring = this.ring.filter((vn) => vn.nodeId !== nodeId)
  }

  /**
   * Returns all active physical nodes in the cluster.
   */
  public getNodes(): string[] {
    return Array.from(this.nodes)
  }

  /**
   * Finds the server node responsible for a given key by traversing clockwise.
   */
  public getNode(key: string): string | null {
    if (this.ring.length === 0) return null

    const keyHash = fnv1a32(key)

    // Binary search for the first virtual node with hash >= keyHash
    let low = 0
    let high = this.ring.length - 1
    let targetIndex = 0

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (this.ring[mid].hash >= keyHash) {
        targetIndex = mid
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    // Wrap around to 0 if keyHash is greater than all nodes on the ring
    if (low >= this.ring.length) {
      targetIndex = 0
    }

    return this.ring[targetIndex].nodeId
  }

  /**
   * Returns ring topology data with normalized angles [0, 360] for visual UI diagrams.
   */
  public getTopology(): {
    vnodes: Array<{ nodeId: string; angleDeg: number; hash: number }>
    nodes: string[]
  } {
    const maxUint32 = 0xffffffff
    return {
      nodes: this.getNodes(),
      vnodes: this.ring.map((vn) => ({
        nodeId: vn.nodeId,
        hash: vn.hash,
        angleDeg: Number(((vn.hash / maxUint32) * 360).toFixed(2)),
      })),
    }
  }

  /**
   * Head-to-Head Benchmark:
   * Compares key remappings when scaling a cluster using:
   * 1. Naive Modulo Hashing (hash(key) % N)
   * 2. Consistent Hashing Ring
   */
  public static compareRemappings(
    keys: string[],
    initialNodeCount: number = 3,
    newNodeCount: number = 4
  ): {
    keysTotal: number
    moduloRemapped: number
    moduloRemappedPercent: number
    consistentRemapped: number
    consistentRemappedPercent: number
  } {
    const initialNodes = Array.from({ length: initialNodeCount }, (_, i) => `Cache-${String.fromCharCode(65 + i)}`)
    const updatedNodes = Array.from({ length: newNodeCount }, (_, i) => `Cache-${String.fromCharCode(65 + i)}`)

    // 1. Modulo Hashing Simulation
    let moduloDiffCount = 0
    for (const key of keys) {
      const h = fnv1a32(key)
      const oldNode = initialNodes[h % initialNodeCount]
      const newNode = updatedNodes[h % newNodeCount]
      if (oldNode !== newNode) {
        moduloDiffCount++
      }
    }

    // 2. Consistent Hashing Simulation
    const ringOld = new ConsistentHashRing(initialNodes, 40)
    const ringNew = new ConsistentHashRing(updatedNodes, 40)

    let consistentDiffCount = 0
    for (const key of keys) {
      const oldNode = ringOld.getNode(key)
      const newNode = ringNew.getNode(key)
      if (oldNode !== newNode) {
        consistentDiffCount++
      }
    }

    return {
      keysTotal: keys.length,
      moduloRemapped: moduloDiffCount,
      moduloRemappedPercent: Number(((moduloDiffCount / keys.length) * 100).toFixed(1)),
      consistentRemapped: consistentDiffCount,
      consistentRemappedPercent: Number(((consistentDiffCount / keys.length) * 100).toFixed(1)),
    }
  }
}
