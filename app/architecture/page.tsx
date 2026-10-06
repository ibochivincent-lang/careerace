'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ConsistentHashRing,
  fnv1a32,
} from '@/lib/consistent_hashing'
import {
  MultiPolicyCache,
  EvictionPolicy,
  CacheEntry,
} from '@/lib/cache_engine'
import {
  SYSTEM_DESIGN_PILLARS,
  SystemDesignPillar,
} from '@/lib/system_design'
import {
  Cpu,
  Layers,
  Database,
  ShieldCheck,
  Server,
  Zap,
  Activity,
  Plus,
  Minus,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Code2,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

export default function SystemArchitecturePage() {
  const [activeMainTab, setActiveMainTab] = useState<'caching' | 'pillars'>('caching')

  // --- TAB 1: CACHING & CONSISTENT HASHING SIMULATOR STATE ---
  const [nodeCount, setNodeCount] = useState<number>(3) // 3 nodes by default (A, B, C)
  const [activePolicy, setActivePolicy] = useState<EvictionPolicy>('LRU')
  const [cacheCapacity, setCacheCapacity] = useState<number>(6)
  const [ttlSeconds, setTtlSeconds] = useState<number>(30)
  const [readRate, setReadRate] = useState<number>(180)
  const [writeRate, setWriteRate] = useState<number>(20)

  // Simulation engine instance
  const cacheInstance = useMemo(() => {
    return new MultiPolicyCache<string>(cacheCapacity, activePolicy, ttlSeconds)
  }, [cacheCapacity, activePolicy, ttlSeconds])

  // Track entries & simulation logs
  const [cacheEntries, setCacheEntries] = useState<Array<CacheEntry<string> & { ttlLeftSeconds: number | null }>>([])
  const [simulationLogs, setSimulationLogs] = useState<Array<{ id: string; time: string; text: string; type: 'hit' | 'miss' | 'evict' | 'write' }>>([])
  const [hitsCount, setHitsCount] = useState(12)
  const [missesCount, setMissesCount] = useState(4)
  const [evictionsCount, setEvictionsCount] = useState(2)

  // Pre-seed sample keys
  useEffect(() => {
    cacheInstance.clear()
    const seedData = [
      { key: 'user:0x4f8_resume', val: 'Captain Dossier v2.1' },
      { key: 'job:stcw_officer_msc', val: 'MSC Fleet Ops Officer' },
      { key: 'ats:benchmark_kw', val: 'Dynamic Positioning (DP2)' },
      { key: 'suins:ibotv.sui', val: 'SuiNS Bound 0x4f891...' },
    ]
    seedData.forEach((item) => cacheInstance.set(item.key, item.val))
    setCacheEntries(cacheInstance.getEntries())
  }, [cacheInstance])

  // Periodic refresh of TTL counters
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheEntries(cacheInstance.getEntries())
    }, 1000)
    return () => clearInterval(interval)
  }, [cacheInstance])

  // Pre-configured cluster nodes
  const availableNodes = ['Cache-A', 'Cache-B', 'Cache-C', 'Cache-D', 'Cache-E']
  const activeNodes = useMemo(() => {
    return availableNodes.slice(0, nodeCount)
  }, [nodeCount])

  // Consistent Hash Ring topology
  const ring = useMemo(() => {
    return new ConsistentHashRing(activeNodes, 40)
  }, [activeNodes])

  // Key sample set for Modulo vs Ring comparison (Video 1)
  const sampleKeys = useMemo(() => {
    return [
      'user:0x1a_cv',
      'user:0x2b_cv',
      'job:maersk_eng',
      'job:cma_cgm_dp',
      'company:vships',
      'ats:maritime_stcw',
      'suins:captain.sui',
      'walrus:blob_9921',
      'license:chief_mate',
      'interview:q42',
      'digest:weekly_01',
      'session:token_88',
    ]
  }, [])

  // Remapping comparison metrics (3 nodes -> 4 nodes)
  const remappingStats = useMemo(() => {
    return ConsistentHashRing.compareRemappings(sampleKeys, 3, 4)
  }, [sampleKeys])

  // Node Colors for visual hash ring
  const nodeColorMap: Record<string, { bg: string; border: string; text: string; fill: string }> = {
    'Cache-A': { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-500', fill: '#3b82f6' },
    'Cache-B': { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-500', fill: '#10b981' },
    'Cache-C': { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-500', fill: '#f59e0b' },
    'Cache-D': { bg: 'bg-purple-500/10', border: 'border-purple-500', text: 'text-purple-500', fill: '#8b5cf6' },
    'Cache-E': { bg: 'bg-rose-500/10', border: 'border-rose-500', text: 'text-rose-500', fill: '#f43f5e' },
  }

  // Trigger single simulated request
  function handleSimulateRequest(forceHit = false) {
    const randomKey = forceHit && cacheEntries.length > 0
      ? cacheEntries[Math.floor(Math.random() * cacheEntries.length)].key
      : sampleKeys[Math.floor(Math.random() * sampleKeys.length)]

    const res = cacheInstance.get(randomKey)
    const timestamp = new Date().toLocaleTimeString().split(' ')[0]

    if (res !== null) {
      setHitsCount((c) => c + 1)
      setSimulationLogs((prev) => [
        { id: `${Date.now()}-${Math.random()}`, time: timestamp, text: `CACHE HIT: "${randomKey}" (Recency promoted)`, type: 'hit' },
        ...prev.slice(0, 19),
      ])
    } else {
      setMissesCount((c) => c + 1)
      const assignedNode = ring.getNode(randomKey) || 'Cache-A'
      const { evictedKey } = cacheInstance.set(randomKey, `Computed Payload (${randomKey})`)
      setSimulationLogs((prev) => {
        const newLogs: Array<{ id: string; time: string; text: string; type: 'hit' | 'miss' | 'evict' | 'write' }> = [
          { id: `${Date.now()}-miss`, time: timestamp, text: `CACHE MISS: "${randomKey}" -> Assigned to [${assignedNode}] & loaded from DB`, type: 'miss' },
        ]
        if (evictedKey) {
          setEvictionsCount((e) => e + 1)
          newLogs.unshift({
            id: `${Date.now()}-evict`,
            time: timestamp,
            text: `EVICTION [${activePolicy}]: Purged "${evictedKey}" to free slot`,
            type: 'evict',
          })
        }
        return [...newLogs, ...prev.slice(0, 18)]
      })
    }
    setCacheEntries(cacheInstance.getEntries())
  }

  function handleBatchSimulation() {
    for (let i = 0; i < 20; i++) {
      handleSimulateRequest(Math.random() > 0.4)
    }
    toast.success('Dispatched 20 concurrent simulated read/write operations!')
  }

  const totalReqs = hitsCount + missesCount
  const hitRate = totalReqs > 0 ? Number(((hitsCount / totalReqs) * 100).toFixed(1)) : 75.0

  // --- TAB 2: SYSTEM DESIGN PILLARS STATE ---
  const [selectedPillarId, setSelectedPillarId] = useState<string>('sql-vs-nosql')
  const activePillar = useMemo(() => {
    return SYSTEM_DESIGN_PILLARS.find((p) => p.id === selectedPillarId) || SYSTEM_DESIGN_PILLARS[0]
  }, [selectedPillarId])

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                System Design &amp; Architecture Lab
              </h1>
              <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30 bg-primary/10">
                Production Simulator
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Interactive demonstrations of Consistent Hashing (Video 1), Multi-Policy Cache Eviction (Video 2), and the 5 Fundamental System Design Trade-offs (Video 3) powering CareerAce.
            </p>
          </div>

          {/* Main Mode Switcher */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeMainTab === 'caching' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMainTab('caching')}
              className="text-xs h-8 gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Caching &amp; Hash Ring</span>
            </Button>
            <Button
              variant={activeMainTab === 'pillars' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMainTab('pillars')}
              className="text-xs h-8 gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>5 System Design Pillars</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DISTRIBUTED CACHE & CONSISTENT HASH RING SIMULATOR (Videos 1 & 2)  */}
        {/* ========================================================================= */}
        {activeMainTab === 'caching' && (
          <div className="space-y-6">
            {/* Top Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3.5 border-primary/20 bg-card/60">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                  <span>HIT RATE</span>
                  <Activity className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground mt-1">{hitRate}%</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {hitsCount} hits / {missesCount} misses
                </div>
              </Card>

              <Card className="p-3.5 border-primary/20 bg-card/60">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                  <span>THROUGHPUT</span>
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {readRate + writeRate} <span className="text-xs font-normal text-muted-foreground">req/s</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {readRate} read / {writeRate} write ops
                </div>
              </Card>

              <Card className="p-3.5 border-primary/20 bg-card/60">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                  <span>DB OPS / SEC</span>
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {Math.round((readRate * (100 - hitRate)) / 100) + writeRate}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  DB spared {Math.round((readRate * hitRate) / 100)} ops/s
                </div>
              </Card>

              <Card className="p-3.5 border-primary/20 bg-card/60">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                  <span>CACHE FILL</span>
                  <Server className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground mt-1">
                  {cacheEntries.length} / {cacheCapacity}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {evictionsCount} total evictions
                </div>
              </Card>
            </div>

            {/* Main Interactive Grid: Hash Ring Visualizer vs Cluster Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Hash Ring & Modulo Comparison (Video 1) */}
              <Card className="lg:col-span-7 p-5 space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-500" />
                      Consistent Hash Ring vs Naive Modulo (% N)
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Scaling a 3-node cluster to 4 nodes: Modulo causes 75% cache loss; Consistent Ring only moves 1 arc (25%).
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Thundering Herd Defense
                  </Badge>
                </div>

                {/* SVG Consistent Hash Ring Visualizer */}
                <div className="relative flex flex-col items-center justify-center p-4 bg-muted/20 rounded-xl border">
                  <svg className="w-64 h-64" viewBox="0 0 260 260">
                    {/* Ring Path */}
                    <circle cx="130" cy="130" r="95" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />

                    {/* Highlighted Arc between B and D when 4 nodes active */}
                    {nodeCount >= 4 && (
                      <circle
                        cx="130"
                        cy="130"
                        r="95"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="7"
                        strokeDasharray="90 500"
                        strokeDashoffset="-160"
                        className="animate-pulse"
                      />
                    )}

                    {/* Center Ring Label */}
                    <text x="130" y="125" textAnchor="middle" className="text-[11px] font-bold fill-foreground">
                      Consistent Hashing Ring
                    </text>
                    <text x="130" y="142" textAnchor="middle" className="text-[9px] fill-muted-foreground">
                      {nodeCount} Nodes &bull; {sampleKeys.length} Keys Placed
                    </text>

                    {/* Nodes positioned along circle */}
                    {activeNodes.map((node, idx) => {
                      const angle = (idx / activeNodes.length) * 2 * Math.PI - Math.PI / 2
                      const cx = 130 + 95 * Math.cos(angle)
                      const cy = 130 + 95 * Math.sin(angle)
                      const color = nodeColorMap[node] || nodeColorMap['Cache-A']

                      return (
                        <g key={node}>
                          <circle cx={cx} cy={cy} r="14" fill={color.fill} className="shadow-sm" />
                          <text x={cx} y={cy + 4} textAnchor="middle" fill="#ffffff" className="text-[9px] font-bold">
                            {node.replace('Cache-', '')}
                          </text>
                        </g>
                      )
                    })}

                    {/* Sample Keys mapped onto ring */}
                    {sampleKeys.slice(0, 10).map((key, idx) => {
                      const hashVal = fnv1a32(key)
                      const angle = (hashVal / 0xffffffff) * 2 * Math.PI - Math.PI / 2
                      const kx = 130 + 78 * Math.cos(angle)
                      const ky = 130 + 78 * Math.sin(angle)
                      const assigned = ring.getNode(key) || 'Cache-A'
                      const color = nodeColorMap[assigned]?.fill || '#3b82f6'

                      return (
                        <circle
                          key={key}
                          cx={kx}
                          cy={ky}
                          r="3.5"
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      )
                    })}
                  </svg>

                  {/* Active Nodes Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {activeNodes.map((node) => {
                      const c = nodeColorMap[node]
                      return (
                        <span
                          key={node}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${c.bg} ${c.border} ${c.text}`}
                        >
                          {node}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Video 1 Head-to-Head Remapping Benchmark */}
                <div className="p-3.5 rounded-lg border bg-card/80 space-y-3">
                  <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Keys Remapped on Adding Server (Scale-Up)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Dataset: {remappingStats.keysTotal} keys</span>
                  </div>

                  {/* Modulo Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono text-destructive font-semibold">hash(key) % N (Naive Modulo)</span>
                      <span className="font-mono text-destructive font-bold">{remappingStats.moduloRemapped} / {remappingStats.keysTotal} ({remappingStats.moduloRemappedPercent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${remappingStats.moduloRemappedPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-destructive leading-tight">
                      &times; 75% of cache invalidated instantly. Database melts down under thundering herd load!
                    </p>
                  </div>

                  {/* Consistent Ring Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Consistent Hash Ring</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{remappingStats.consistentRemapped} / {remappingStats.keysTotal} ({remappingStats.consistentRemappedPercent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${remappingStats.consistentRemappedPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-tight">
                      &check; Only 1 arc moves ({remappingStats.consistentRemappedPercent}%). 75% of existing cache remains hot and valid!
                    </p>
                  </div>
                </div>
              </Card>

              {/* Right Column: Multi-Policy Eviction Controls & Live Slots (Video 2) */}
              <Card className="lg:col-span-5 p-5 space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Cache Eviction Engine
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      LRU (Recency), LFU (Frequency), FIFO (Queue) policy simulation.
                    </p>
                  </div>
                </div>

                {/* Policy Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Eviction Policy</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['LRU', 'LFU', 'FIFO'] as EvictionPolicy[]).map((pol) => (
                      <Button
                        key={pol}
                        variant={activePolicy === pol ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setActivePolicy(pol)
                          cacheInstance.setPolicy(pol)
                          toast.success(`Active cache policy switched to ${pol}`)
                        }}
                        className="text-xs h-8 cursor-pointer font-semibold"
                      >
                        {pol}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Node & Cluster Sizing Controls */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Cluster Nodes: {nodeCount}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={nodeCount <= 2}
                        onClick={() => setNodeCount((c) => Math.max(2, c - 1))}
                        className="h-7 w-7 p-0 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={nodeCount >= 5}
                        onClick={() => setNodeCount((c) => Math.min(5, c + 1))}
                        className="h-7 w-7 p-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <span className="font-mono text-xs ml-1 font-bold text-foreground">
                        {nodeCount} Nodes
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Slot Capacity: {cacheCapacity}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cacheCapacity <= 3}
                        onClick={() => setCacheCapacity((c) => Math.max(3, c - 1))}
                        className="h-7 w-7 p-0 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cacheCapacity >= 12}
                        onClick={() => setCacheCapacity((c) => Math.min(12, c + 1))}
                        className="h-7 w-7 p-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <span className="font-mono text-xs ml-1 font-bold text-foreground">
                        {cacheCapacity} Slots
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleSimulateRequest(true)}
                    className="text-xs h-8 gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cache Hit Op</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSimulateRequest(false)}
                    className="text-xs h-8 gap-1.5 cursor-pointer text-amber-600 dark:text-amber-400 border-amber-500/30"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Cache Miss Op</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchSimulation}
                    className="text-xs h-8 gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run 20 Ops</span>
                  </Button>
                </div>

                {/* Live Cache Slots Visualizer */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                    <span>Cache Memory Slots ({activePolicy})</span>
                    <span className="text-muted-foreground font-normal">{cacheEntries.length} of {cacheCapacity} occupied</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {cacheEntries.map((entry, idx) => (
                      <div
                        key={entry.key}
                        className="p-2 rounded border bg-muted/20 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-4 h-4 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-[11px] text-foreground truncate">{entry.key}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground font-mono">
                          <span>hits: {entry.frequency}</span>
                          {entry.ttlLeftSeconds !== null && (
                            <span className="text-primary">{entry.ttlLeftSeconds}s TTL</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {cacheEntries.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground">Cache is empty.</div>
                    )}
                  </div>
                </div>

                {/* Recent Event Log Stream */}
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Live Event Stream</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[10px]">
                    {simulationLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`px-2 py-1 rounded flex items-center justify-between ${
                          log.type === 'hit'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : log.type === 'miss'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <span className="truncate">{log.text}</span>
                        <span className="text-muted-foreground text-[9px] shrink-0 ml-2">{log.time}</span>
                      </div>
                    ))}
                    {simulationLogs.length === 0 && (
                      <div className="text-muted-foreground text-[10px] italic">No simulation events yet.</div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: THE 5 SYSTEM DESIGN PILLARS COMPARISON (Video 3)                    */}
        {/* ========================================================================= */}
        {activeMainTab === 'pillars' && (
          <div className="space-y-6">
            {/* Pillar Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SYSTEM_DESIGN_PILLARS.map((pillar) => (
                <Button
                  key={pillar.id}
                  variant={selectedPillarId === pillar.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPillarId(pillar.id)}
                  className="text-xs h-9 cursor-pointer truncate font-semibold"
                >
                  {pillar.title.replace(/^\d+\.\s*/, '')}
                </Button>
              ))}
            </div>

            {/* Detailed Head-to-Head Architectural Card */}
            <Card className="p-6 space-y-6">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{activePillar.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fundamental architectural trade-off and concrete production realization in CareerAce.
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Architectural Standard
                </Badge>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Concept A Card */}
                <div className="p-4 rounded-xl border bg-muted/15 space-y-3">
                  <div className="border-b pb-2">
                    <span className="text-sm font-bold text-foreground block">{activePillar.conceptA.name}</span>
                    <span className="text-xs text-primary font-medium">{activePillar.conceptA.tagline}</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Key Attributes:</span>
                    <ul className="text-xs text-foreground space-y-1 list-disc list-inside">
                      {activePillar.conceptA.keyCharacteristics.map((char, i) => (
                        <li key={i} className="leading-relaxed">{char}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded bg-card border text-xs space-y-1">
                    <span className="font-semibold text-foreground block">CareerAce Production Implementation:</span>
                    <span className="text-muted-foreground block">{activePillar.conceptA.careerAceUsage}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Code2 className="w-3 h-3" /> Code Example
                    </span>
                    <pre className="p-2.5 rounded bg-zinc-950 text-zinc-100 text-[10px] font-mono overflow-x-auto leading-relaxed">
                      {activePillar.conceptA.codeSnippet}
                    </pre>
                  </div>
                </div>

                {/* Concept B Card */}
                <div className="p-4 rounded-xl border bg-muted/15 space-y-3">
                  <div className="border-b pb-2">
                    <span className="text-sm font-bold text-foreground block">{activePillar.conceptB.name}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{activePillar.conceptB.tagline}</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Key Attributes:</span>
                    <ul className="text-xs text-foreground space-y-1 list-disc list-inside">
                      {activePillar.conceptB.keyCharacteristics.map((char, i) => (
                        <li key={i} className="leading-relaxed">{char}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded bg-card border text-xs space-y-1">
                    <span className="font-semibold text-foreground block">CareerAce Production Implementation:</span>
                    <span className="text-muted-foreground block">{activePillar.conceptB.careerAceUsage}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Code2 className="w-3 h-3" /> Code Example
                    </span>
                    <pre className="p-2.5 rounded bg-zinc-950 text-zinc-100 text-[10px] font-mono overflow-x-auto leading-relaxed">
                      {activePillar.conceptB.codeSnippet}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Decision Rubric Banner */}
              <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">Architectural Decision Rule:</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activePillar.decisionRubric}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
