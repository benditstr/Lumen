import { useCallback, useEffect, useRef, useState } from 'react'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum
} from 'd3-force'
import type { GraphNode, VaultGraph } from '../types'

interface SimNode extends SimulationNodeDatum, GraphNode {}
type SimLink = SimulationLinkDatum<SimNode>

interface Props {
  onOpenNode: (node: GraphNode) => void
  activePath?: string | null
}

const ACCENT = '#a78bfa'
const NODE = '#9c9c98'
const GHOST = '#4f4f4b'
const EDGE = '#2e2e2e'
const LABEL = '#888884'
const LABEL_HI = '#e8e8e6'

const radius = (n: SimNode): number => 4 + Math.min(8, Math.sqrt(n.linkCount) * 1.6)

export default function GraphView({ onOpenNode, activePath }: Props): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null)
  const nodesRef = useRef<SimNode[]>([])
  const linksRef = useRef<SimLink[]>([])
  const neighborsRef = useRef<Map<string, Set<string>>>(new Map())
  const transformRef = useRef({ x: 0, y: 0, k: 1 }) // screen = world * k + (x, y)
  const hoverRef = useRef<SimNode | null>(null)
  const activePathRef = useRef<string | null>(null)
  const dragRef = useRef<{
    mode: 'node' | 'pan'
    node: SimNode | null
    lastX: number
    lastY: number
    moved: boolean
  } | null>(null)
  const [noteCount, setNoteCount] = useState<number | null>(null)

  const draw = useCallback((): void => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const { x, y, k } = transformRef.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    ctx.translate(x, y)
    ctx.scale(k, k)

    const hover = hoverRef.current
    const neighbors = hover ? neighborsRef.current.get(hover.id) : undefined

    for (const l of linksRef.current) {
      const s = l.source as SimNode
      const t = l.target as SimNode
      if (s.x == null || s.y == null || t.x == null || t.y == null) continue
      const hi = hover != null && (s === hover || t === hover)
      ctx.globalAlpha = hover && !hi ? 0.15 : 1
      ctx.strokeStyle = hi ? ACCENT : EDGE
      ctx.lineWidth = (hi ? 1.6 : 1) / k
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(t.x, t.y)
      ctx.stroke()
    }

    for (const n of nodesRef.current) {
      if (n.x == null || n.y == null) continue
      const r = radius(n)
      const isHover = n === hover
      const isNeighbor = neighbors?.has(n.id) ?? false
      ctx.globalAlpha = hover && !isHover && !isNeighbor ? 0.25 : 1
      ctx.fillStyle = isHover || isNeighbor ? ACCENT : n.exists ? NODE : GHOST
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fill()

      if (n.id === activePathRef.current) {
        ctx.strokeStyle = ACCENT
        ctx.lineWidth = 1.6 / k
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 3 / k, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (k > 0.7 || isHover || isNeighbor) {
        ctx.font = `${11 / k}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillStyle = isHover ? LABEL_HI : LABEL
        ctx.fillText(n.name, n.x, n.y + r + 13 / k)
      }
    }
    ctx.globalAlpha = 1
  }, [])

  // Highlight the note that is open in the editor next to the graph.
  useEffect(() => {
    activePathRef.current = activePath ?? null
    draw()
  }, [activePath, draw])

  // Load the graph (and reload on any vault change), preserving node positions.
  useEffect(() => {
    let disposed = false

    const start = (g: VaultGraph): void => {
      const prev = new Map(nodesRef.current.map((n) => [n.id, n]))
      const nodes: SimNode[] = g.nodes.map((n) => ({ ...n, x: prev.get(n.id)?.x, y: prev.get(n.id)?.y }))
      const links: SimLink[] = g.edges.map((e) => ({ source: e.source, target: e.target }))

      const neighbors = new Map<string, Set<string>>()
      for (const e of g.edges) {
        if (!neighbors.has(e.source)) neighbors.set(e.source, new Set())
        if (!neighbors.has(e.target)) neighbors.set(e.target, new Set())
        neighbors.get(e.source)!.add(e.target)
        neighbors.get(e.target)!.add(e.source)
      }

      nodesRef.current = nodes
      linksRef.current = links
      neighborsRef.current = neighbors
      hoverRef.current = null
      setNoteCount(nodes.length)

      simRef.current?.stop()
      simRef.current = forceSimulation<SimNode>(nodes)
        .force(
          'link',
          forceLink<SimNode, SimLink>(links)
            .id((d) => d.id)
            .distance(70)
            .strength(0.5)
        )
        .force('charge', forceManyBody().strength(-180))
        .force('center', forceCenter(0, 0))
        .force('collide', forceCollide(20))
        .on('tick', draw)
    }

    const load = (): void => {
      window.lumen.getGraph().then((g) => {
        if (!disposed) start(g)
      })
    }
    load()
    const off = window.lumen.onVaultChanged(load)
    return () => {
      disposed = true
      off()
      simRef.current?.stop()
    }
  }, [draw])

  // Keep the canvas backing store in sync with its CSS size; center once.
  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    let centered = false
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = wrap.clientWidth * dpr
      canvas.height = wrap.clientHeight * dpr
      if (!centered && wrap.clientWidth > 0) {
        transformRef.current.x = wrap.clientWidth / 2
        transformRef.current.y = wrap.clientHeight / 2
        centered = true
      }
      draw()
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [draw])

  const toWorld = (e: React.PointerEvent | React.WheelEvent): { wx: number; wy: number; mx: number; my: number } => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { x, y, k } = transformRef.current
    return { wx: (mx - x) / k, wy: (my - y) / k, mx, my }
  }

  const hitTest = (wx: number, wy: number): SimNode | null => {
    const k = transformRef.current.k
    // Iterate back-to-front so the topmost-drawn node wins.
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i]
      if (n.x == null || n.y == null) continue
      const r = Math.max(radius(n), 6 / k) + 2 / k
      if ((n.x - wx) ** 2 + (n.y - wy) ** 2 <= r * r) return n
    }
    return null
  }

  const onPointerDown = (e: React.PointerEvent): void => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const { wx, wy } = toWorld(e)
    const node = hitTest(wx, wy)
    dragRef.current = { mode: node ? 'node' : 'pan', node, lastX: e.clientX, lastY: e.clientY, moved: false }
    if (node) {
      node.fx = node.x
      node.fy = node.y
      simRef.current?.alphaTarget(0.3).restart()
    }
  }

  const onPointerMove = (e: React.PointerEvent): void => {
    const drag = dragRef.current
    if (drag) {
      const dx = e.clientX - drag.lastX
      const dy = e.clientY - drag.lastY
      if (Math.abs(dx) + Math.abs(dy) > 0) drag.moved = true
      drag.lastX = e.clientX
      drag.lastY = e.clientY
      if (drag.mode === 'node' && drag.node) {
        const { wx, wy } = toWorld(e)
        drag.node.fx = wx
        drag.node.fy = wy
      } else {
        transformRef.current.x += dx
        transformRef.current.y += dy
        draw()
      }
      return
    }
    const { wx, wy } = toWorld(e)
    const hit = hitTest(wx, wy)
    if (hit !== hoverRef.current) {
      hoverRef.current = hit
      canvasRef.current!.style.cursor = hit ? 'pointer' : 'grab'
      draw()
    }
  }

  const onPointerUp = (e: React.PointerEvent): void => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    if (drag.mode === 'node' && drag.node) {
      drag.node.fx = null
      drag.node.fy = null
      simRef.current?.alphaTarget(0)
      if (!drag.moved) onOpenNode(drag.node)
    }
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const onWheel = (e: React.WheelEvent): void => {
    const { mx, my } = toWorld(e)
    const t = transformRef.current
    const factor = Math.exp(-e.deltaY * 0.002)
    const k = Math.min(4, Math.max(0.15, t.k * factor))
    // Zoom toward the cursor: keep the world point under it fixed.
    t.x = mx - ((mx - t.x) / t.k) * k
    t.y = my - ((my - t.y) / t.k) * k
    t.k = k
    draw()
  }

  return (
    <main ref={wrapRef} className="relative min-w-0 flex-1 overflow-hidden bg-editor">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
      {noteCount === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-secondary">
          No notes yet — create one and connect it with [[wikilinks]]
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-text-secondary">
        scroll to zoom · drag to pan · click a node to open it
      </div>
    </main>
  )
}
