"use client";

import { useGSAP } from "@gsap/react";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { COLLECTION_LIST, COLLECTIONS, entryHref, type CollectionId } from "@/lib/collections";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type MapEntry = { ref: string; collection: CollectionId; slug: string; title: string; description: string };

type GNode = SimulationNodeDatum & {
  id: string;
  hub: boolean;
  collection: CollectionId;
  title: string;
  description: string;
  href: string;
  r: number;
  count: number; // 허브: 컬렉션 기록 수
  linked: boolean; // 기록: 연관 연결이 하나라도 있는지
  phase: number; // 떠다니는 움직임의 위상
  appear: number; // 등장 0→1 (GSAP이 조절)
};
type GLink = SimulationLinkDatum<GNode> & { related: boolean };

const HEIGHT = 520;
const POINTER_RADIUS = 80;
const BLUE = "#3182f6";
const GREY = "#c5ccd3";

/**
 * 연결 지도: 컬렉션 허브(이모지) + 기록 점 + 연관 연결선.
 * 연관 연결이 있는 기록은 파랑, 아직 없는 기록은 회색 — 어디를 더 이어야 할지 보이도록.
 * 위치는 d3-force가 매 프레임 계산하고, React는 구조만 그린다(좌표는 ref로 직접 갱신).
 */
export function KnowledgeMap(props: { entries: MapEntry[]; links: [string, string][] }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<GNode, GLink> | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  hoveredRef.current = hovered;

  const { nodes, links, neighbors, linkedCount } = useMemo(() => {
    const degree = new Map<string, number>();
    for (const [a, b] of props.links) {
      degree.set(a, (degree.get(a) ?? 0) + 1);
      degree.set(b, (degree.get(b) ?? 0) + 1);
    }
    const hubs: GNode[] = COLLECTION_LIST.map((c, i) => ({
      id: `hub:${c.id}`,
      hub: true,
      collection: c.id,
      title: c.label,
      description: c.intro,
      href: `/${c.id}`,
      r: 26,
      count: props.entries.filter((e) => e.collection === c.id).length,
      linked: true,
      phase: i * 1.7,
      appear: 0,
    }));
    const items: GNode[] = props.entries.map((e, i) => ({
      id: e.ref,
      hub: false,
      collection: e.collection,
      title: e.title,
      description: e.description,
      href: entryHref(e.collection, e.slug),
      r: 6 + Math.min(degree.get(e.ref) ?? 0, 4) * 1.4,
      count: 0,
      linked: (degree.get(e.ref) ?? 0) > 0,
      phase: (i * 2.399) % (Math.PI * 2),
      appear: 0,
    }));
    const links: GLink[] = [
      ...items.map((n) => ({ source: n.id, target: `hub:${n.collection}`, related: false })),
      ...props.links.map(([a, b]) => ({ source: a, target: b, related: true })),
    ];
    const neighbors = new Map<string, Set<string>>();
    for (const l of links) {
      const a = l.source as string;
      const b = l.target as string;
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      if (!neighbors.has(b)) neighbors.set(b, new Set());
      neighbors.get(a)!.add(b);
      neighbors.get(b)!.add(a);
    }
    return { nodes: [...hubs, ...items], links, neighbors, linkedCount: items.filter((n) => n.linked).length };
  }, [props.entries, props.links]);

  // 시뮬레이션 + 매 프레임 그리기
  useEffect(() => {
    const wrap = wrapRef.current!;
    const svg = svgRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = wrap.clientWidth;

    // 허브는 가로로 넓게 퍼져서, 기록은 자기 허브 근처에서 출발
    const hubPos = (i: number) => ({
      x: width * (0.14 + (i / (COLLECTION_LIST.length - 1)) * 0.72),
      y: HEIGHT / 2 + (i % 2 === 0 ? -1 : 1) * HEIGHT * 0.12,
    });
    nodes.forEach((n) => {
      const i = COLLECTION_LIST.findIndex((c) => c.id === n.collection);
      const p = hubPos(i);
      n.x ??= p.x + (n.hub ? 0 : (Math.random() - 0.5) * 90);
      n.y ??= p.y + (n.hub ? 0 : (Math.random() - 0.5) * 90);
      if (reduced) n.appear = 1;
    });

    let t = 0;
    const sim = forceSimulation<GNode>(nodes)
      .force(
        "link",
        forceLink<GNode, GLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.related ? 110 : 78))
          .strength((l) => (l.related ? 0.3 : 0.5)),
      )
      .force("charge", forceManyBody<GNode>().strength((d) => (d.hub ? -700 : -90)))
      .force("collide", forceCollide<GNode>((d) => d.r + (d.hub ? 22 : 5)))
      // 허브는 자기 자리(가로로 펼친 위치) 쪽으로 당겨서 지도가 한쪽으로 뭉치지 않게
      .force(
        "x",
        forceX<GNode>((d) => hubPos(COLLECTION_LIST.findIndex((c) => c.id === d.collection)).x).strength((d) =>
          d.hub ? 0.12 : 0.02,
        ),
      )
      .force("y", forceY<GNode>(HEIGHT / 2).strength(0.045))
      // 커서 주변의 "다른" 점들만 살짝 자리를 비켜 준다.
      // 가리키려는 점(커서 바로 아래, 고정된 점)은 밀지 않는다 — 밀면 점이 도망가서 누를 수가 없다
      .force("pointer", () => {
        const p = pointer.current;
        if (!p) return;
        for (const n of nodes) {
          if (n.fx != null) continue;
          const dx = n.x! - p.x;
          const dy = n.y! - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < n.r + 18) continue;
          if (dist < POINTER_RADIUS) {
            const push = ((POINTER_RADIUS - dist) / POINTER_RADIUS) * (n.hub ? 0.08 : 0.3);
            n.vx! += (dx / dist) * push;
            n.vy! += (dy / dist) * push;
          }
        }
      })
      // 가만히 멈춰 있지 않고 천천히 떠다니도록
      .force("drift", () => {
        if (reduced) return;
        t += 0.012;
        for (const n of nodes) {
          n.vx! += Math.sin(t + n.phase) * 0.016;
          n.vy! += Math.cos(t * 0.8 + n.phase) * 0.016;
        }
      })
      .velocityDecay(0.32)
      .alphaTarget(reduced ? 0 : 0.02);
    simRef.current = sim;

    const groups = svg.querySelectorAll<SVGGElement>("[data-node]");
    const lines = svg.querySelectorAll<SVGLineElement>("[data-link]");

    sim.on("tick", () => {
      for (const n of nodes) {
        n.x = Math.max(n.r + 6, Math.min(width - n.r - 6, n.x!));
        n.y = Math.max(n.r + 6, Math.min(HEIGHT - n.r - (n.hub ? 30 : 6), n.y!));
      }
      groups.forEach((g, i) => {
        const n = nodes[i];
        g.setAttribute("transform", `translate(${n.x!.toFixed(1)},${n.y!.toFixed(1)}) scale(${n.appear.toFixed(3)})`);
      });
      lines.forEach((line, i) => {
        const l = links[i];
        const s = l.source as GNode;
        const d = l.target as GNode;
        line.setAttribute("x1", s.x!.toFixed(1));
        line.setAttribute("y1", s.y!.toFixed(1));
        line.setAttribute("x2", d.x!.toFixed(1));
        line.setAttribute("y2", d.y!.toFixed(1));
        line.style.opacity = String(Math.min(s.appear, d.appear));
      });
      const hov = hoveredRef.current && nodes.find((n) => n.id === hoveredRef.current);
      if (hov && tipRef.current) {
        const left = Math.min(Math.max(hov.x! + 18, 8), width - 278);
        tipRef.current.style.transform = `translate(${left}px, ${Math.max(hov.y! - 24, 8)}px)`;
      }
    });

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? sim.restart() : sim.stop()));
    io.observe(wrap);
    const ro = new ResizeObserver(() => {
      width = wrap.clientWidth;
      sim.alpha(0.3).restart();
    });
    ro.observe(wrap);

    return () => {
      sim.stop();
      io.disconnect();
      ro.disconnect();
    };
  }, [nodes, links]);

  // 스크롤해서 지도가 보이면: 허브가 톡 튀어나오고, 기록 점이 흩뿌려지듯 나타난다
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const hubs = nodes.filter((n) => n.hub);
        const items = nodes.filter((n) => !n.hub);
        gsap
          .timeline({ scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true } })
          .to(hubs, { appear: 1, duration: 0.7, ease: "back.out(2.2)", stagger: 0.1 })
          .to(items, { appear: 1, duration: 0.5, ease: "back.out(2)", stagger: { each: 0.015, from: "random" } }, "-=0.35");
      });
    },
    { scope: sectionRef, dependencies: [nodes] },
  );

  const drag = useRef<{ node: GNode; sx: number; sy: number; moved: boolean } | null>(null);

  // 올려 둔 점은 그 자리에 고정한다(툴팁을 읽고 누를 수 있게). 떼면 다시 떠다닌다
  useEffect(() => {
    const n = hovered ? nodes.find((x) => x.id === hovered) : null;
    if (!n) return;
    n.fx = n.x;
    n.fy = n.y;
    return () => {
      if (drag.current?.node !== n) {
        n.fx = null;
        n.fy = null;
      }
    };
  }, [hovered, nodes]);

  function local(e: React.PointerEvent) {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function hit(p: { x: number; y: number }) {
    let best: GNode | null = null;
    let bestDist = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.x! - p.x, n.y! - p.y);
      if (d < n.r + 8 && d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  }

  const lit = (id: string) => !hovered || id === hovered || neighbors.get(hovered)?.has(id);
  const hoveredNode = hovered ? nodes.find((n) => n.id === hovered) : null;
  const unlinked = props.entries.length - linkedCount;

  return (
    <section ref={sectionRef}>
      <div className="mb-4 flex items-end justify-between px-1">
        <h2 className="text-[20px] font-bold tracking-[-0.03em]">연결 지도</h2>
        <p className="flex items-center gap-4 text-[13px] font-medium text-text-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: BLUE }} />
            연결됨 <b className="font-semibold text-text-2 tabular-nums">{linkedCount}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: GREY }} />
            연결 없음 <b className="font-semibold text-text-2 tabular-nums">{unlinked}</b>
          </span>
          <span>
            연관 연결 <b className="font-semibold text-text-2 tabular-nums">{props.links.length}</b>
          </span>
        </p>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full touch-none overflow-hidden rounded-[28px] bg-surface select-none"
        style={{ height: HEIGHT, cursor: hovered ? "pointer" : "default" }}
        onPointerMove={(e) => {
          const p = local(e);
          const d = drag.current;
          if (d) {
            if (Math.hypot(p.x - d.sx, p.y - d.sy) > 4) d.moved = true;
            d.node.fx = p.x;
            d.node.fy = p.y;
            return;
          }
          pointer.current = p;
          const h = hit(p);
          if ((h?.id ?? null) !== hovered) setHovered(h?.id ?? null);
        }}
        onPointerLeave={() => {
          pointer.current = null;
          setHovered(null);
        }}
        onPointerDown={(e) => {
          const p = local(e);
          const n = hit(p);
          if (!n) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { node: n, sx: p.x, sy: p.y, moved: false };
          simRef.current?.alphaTarget(0.25).restart();
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          d.node.fx = null;
          d.node.fy = null;
          simRef.current?.alphaTarget(0.02);
          if (!d.moved) router.push(d.node.href);
        }}
      >
        {/* 모눈 점 배경 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(#e5e8eb 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <svg ref={svgRef} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {links.map((l, i) => {
            const s = typeof l.source === "object" ? l.source.id : (l.source as string);
            const d = typeof l.target === "object" ? l.target.id : (l.target as string);
            const on = !hovered || s === hovered || d === hovered;
            return (
              <line
                key={i}
                data-link
                stroke={l.related ? (hovered && on ? BLUE : "#90c2ff") : "#e5e8eb"}
                strokeWidth={l.related ? 1.8 : 1}
                strokeDasharray={l.related ? undefined : "3 4"}
                strokeOpacity={on ? 1 : 0.2}
                className="transition-[stroke,stroke-opacity] duration-200"
              />
            );
          })}
          {nodes.map((n) => (
            <g key={n.id} data-node className="transition-opacity duration-200" style={{ opacity: lit(n.id) ? 1 : 0.2 }}>
              {n.hub ? (
                <>
                  <circle r={n.r} fill="#fff" stroke="#e5e8eb" strokeWidth={1.5} />
                  <text textAnchor="middle" dy="0.36em" className="tossface text-[24px]">
                    {COLLECTIONS[n.collection].emoji}
                  </text>
                  <text textAnchor="middle" y={n.r + 20} className="fill-text-2 text-[13px] font-semibold">
                    {COLLECTIONS[n.collection].shortLabel}
                    <tspan className="fill-text-3 font-medium"> {n.count}</tspan>
                  </text>
                </>
              ) : (
                <circle
                  r={n.id === hovered ? n.r + 2.5 : n.r}
                  fill={n.linked ? BLUE : GREY}
                  stroke="#fff"
                  strokeWidth={2}
                  className="transition-[r] duration-150"
                />
              )}
            </g>
          ))}
        </svg>

        {/* 올려 둔 점의 정보 */}
        <div
          ref={tipRef}
          className={`pointer-events-none absolute top-0 left-0 w-[270px] rounded-2xl bg-surface p-3.5 shadow-[0_8px_30px_rgba(0,23,51,0.14)] transition-opacity duration-150 ${
            hoveredNode ? "opacity-100" : "opacity-0"
          }`}
        >
          {hoveredNode && (
            <>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-text-3">
                <span className="tossface text-[14px]">{COLLECTIONS[hoveredNode.collection].emoji}</span>
                {hoveredNode.hub
                  ? `${hoveredNode.count}개`
                  : `${COLLECTIONS[hoveredNode.collection].label} · 연결 ${neighbors.get(hoveredNode.id)!.size - 1}개`}
              </p>
              <p
                className={`mt-1 text-[15px] leading-snug font-bold ${
                  hoveredNode.collection === "git" && !hoveredNode.hub ? "font-mono" : ""
                }`}
              >
                {hoveredNode.title}
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-text-3">{hoveredNode.description}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
