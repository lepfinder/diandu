'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  getAllCharacters,
  getAllRelations,
  getGroups,
  getRelationsFor,
} from '@/lib/content';
import type { Character, Relation } from '@/lib/types';
import { toCN } from '@/lib/cn';
import Link from '@/components/Link';
import { palette, observeTheme, type ScenePalette, type ThemeName } from './theme';
import { projectLabels, type LabelItem } from './labels';

const REL_COLOR: Record<Relation['type'], string> = {
  blood: '#8a7f72',
  marriage: '#c4a35a',
  love: '#b5442e',
  friend: '#4a6b5d',
  'master-servant': '#4a6b5d',
  foe: '#d4785f',
  teacher: '#6b5f52',
};

const REL_LABEL: Record<Relation['type'], string> = {
  blood: '血缘',
  marriage: '姻亲',
  love: '情缘',
  friend: '友朋',
  'master-servant': '主仆',
  foe: '冲突',
  teacher: '师友',
};

const REL_TYPES = Object.keys(REL_LABEL) as Relation['type'][];

/** 星等：主角更亮更大 */
function starRank(id: string) {
  if (['baoyu', 'daiyu', 'baochai'].includes(id)) return 3;
  if (['xifeng', 'jiamu', 'xiangyun', 'tanchun', 'miaoyu', 'liulaolao'].includes(id)) return 2;
  return 1;
}

/** 三维环状星座布局（把二维家谱环抬升到球面） */
function layoutStars(chars: Character[]) {
  // 按星等分层：核内长辈 → 主子小姐 → 丫鬟伶人 → 府外
  const rankOf = (id: string) => starRank(id);
  const rings: { ids: string[]; r: number; y: number }[] = [
    { ids: ['jiamu'], r: 0, y: 0.4 },
    { ids: ['jiazheng', 'wangfuren', 'jiashe', 'xingshi', 'linruhai', 'jiamin', 'xueyima', 'jiajing', 'wangteng'], r: 16, y: 0 },
    {
      ids: [
        'baoyu', 'daiyu', 'baochai', 'xifeng', 'jialian', 'xuepan', 'liwan', 'jiazhen', 'youshi',
        'tanchun', 'yingchun', 'xichun', 'yuanchun', 'keqing', 'jiahuan', 'zhaoyiniang',
        'jiajing-daughter', 'jialan', 'qiaojie',
      ],
      r: 30,
      y: 1.5,
    },
    {
      ids: [
        'xiangyun', 'miaoyu', 'xiren', 'qingwen', 'pinger', 'yuanyang', 'zijuan',
        'xiangling', 'liulaolao', 'youerjie', 'yousanjie', 'liuxianglian', 'baoqin', 'xueke',
        'xiuyan', 'liwen', 'lili', 'jiajing-zhen', 'jiayu', 'zhenshiyin', 'beijingwang',
        'jiangyuhan', 'qinzhong', 'jiaqiang',
      ],
      r: 44,
      y: -1,
    },
    {
      ids: [
        'yingér', 'lingguan', 'fangguan', 'sima', 'jinchuan', 'xiaohong', 'shagua', 'ziying',
        'lǐmo', 'jiaxuan', 'wanggour', 'lengzixing', 'jiajing-ma', 'xiajingui', 'jiajing-sun',
        'qiutong', 'jiaoxing',
      ],
      r: 58,
      y: -3,
    },
  ];
  const map = new Map<string, THREE.Vector3>();
  rings.forEach((ring, ri) => {
    const ids = ring.ids.filter((id) => chars.some((c) => c.id === id));
    ids.forEach((id, i) => {
      if (ring.r === 0) {
        map.set(id, new THREE.Vector3(0, ring.y, 0));
        return;
      }
      const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2 + ri * 0.35;
      const elev = Math.sin(a * 2 + ri) * 6 + ring.y;
      map.set(id, new THREE.Vector3(Math.cos(a) * ring.r, elev, Math.sin(a) * ring.r * 0.78));
    });
  });
  // 未点名的次级人物：按序铺在外壳
  const leftovers = chars.filter((c) => !map.has(c.id)).map((c) => c.id);
  leftovers.forEach((id, i) => {
    const shell = i % 3;
    const r = 56 + shell * 8;
    const n = Math.max(1, Math.ceil(leftovers.length / 3));
    const j = Math.floor(i / 3);
    const a = (j / n) * Math.PI * 2 + shell * 0.4;
    map.set(id, new THREE.Vector3(Math.cos(a) * r, Math.sin(i * 1.7) * 7 - 2, Math.sin(a) * r * 0.8));
  });
  return map;
}

type Props = {
  onOpen?: (c: Character) => void;
};

export default function StarMap({ onOpen }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(56);
  const [playing, setPlaying] = useState(false);
  const [relOn, setRelOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REL_TYPES.map((t) => [t, true])),
  );
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [sel, setSel] = useState<Character | null>(null);
  const [labelTick, setLabelTick] = useState(0);

  const chars = useMemo(() => getAllCharacters(), []);
  const groups = useMemo(() => getGroups(), []);
  const groupColor = useMemo(() => {
    const m: Record<string, string> = {};
    groups.forEach((g) => (m[g.id] = g.color));
    return m;
  }, [groups]);

  // three 场景生命周期
  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const host: HTMLDivElement = hostEl;

    const pal = palette();
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(pal.bg, 0.0085);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    camera.position.set(42, 30, 62);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(pal.bg, 1);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 30;
    controls.maxDistance = 180;
    controls.target.set(0, 0, 0);
    // 慢速自转：交互暂停，闲置续上
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let userBusy = false;
    const pauseSpin = () => {
      userBusy = true;
      controls.autoRotate = false;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        userBusy = false;
        if (!selIdRef.current && !hoverRef.current) controls.autoRotate = true;
      }, 3200);
    };
    renderer.domElement.addEventListener('pointerdown', pauseSpin);
    renderer.domElement.addEventListener('wheel', pauseSpin, { passive: true });

    // 背景星尘
    const dustGeo = new THREE.BufferGeometry();
    const dustN = 900;
    const dustPos = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) {
      const r = 80 + Math.random() * 140;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      dustPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      dustPos[i * 3 + 1] = r * Math.cos(ph) * 0.45;
      dustPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: pal.starHalo, size: 0.35, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    scene.add(dust);

    // 太虚环（装饰性轨道）
    const ringMat = new THREE.LineBasicMaterial({ color: pal.gold, transparent: true, opacity: 0.12 });
    [22, 38, 54].forEach((r) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 3) * 1.2, Math.sin(a) * r * 0.78));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
    });

    const pos = layoutStars(chars);

    // 星体
    type StarObj = {
      id: string;
      mesh: THREE.Mesh;
      halo: THREE.Sprite;
      label: LabelItem;
      firstCh: number;
      lastCh: number;
    };
    const stars: StarObj[] = [];
    const meshById = new Map<string, THREE.Mesh>();
    const labelItems: LabelItem[] = [];

    const makeHalo = (color: number, size: number) => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d')!;
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      const col = `#${color.toString(16).padStart(6, '0')}`;
      grd.addColorStop(0, col);
      grd.addColorStop(0.35, `${col}88`);
      grd.addColorStop(1, `${col}00`);
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(size, size, 1);
      return sp;
    };

    chars.forEach((c) => {
      const p = pos.get(c.id)!;
      const rank = starRank(c.id);
      const r = rank === 3 ? 1.35 : rank === 2 ? 1.0 : 0.7;
      const col = new THREE.Color(c.color || groupColor[c.group] || pal.gold);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 20, 20),
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: rank === 3 ? 0.95 : 0.65,
          roughness: 0.35,
          metalness: 0.1,
        }),
      );
      mesh.position.copy(p);
      mesh.userData.id = c.id;
      scene.add(mesh);
      meshById.set(c.id, mesh);

      const halo = makeHalo(col.getHex(), r * (rank === 3 ? 7.5 : rank === 2 ? 5.5 : 4.5));
      halo.position.copy(p);
      scene.add(halo);

      mesh.userData.haloBase = r * (rank === 3 ? 7.5 : rank === 2 ? 5.5 : 4.5);
      const label: LabelItem = {
        id: c.id,
        text: c.name,
        object: mesh,
        priority: rank,
      };
      labelItems.push(label);
      stars.push({ id: c.id, mesh, halo, label, firstCh: c.firstCh, lastCh: c.lastCh });
    });

    // 关系光线
    type EdgeObj = { line: THREE.Line; rel: Relation; a: string; b: string };
    const edges: EdgeObj[] = [];
    const seen = new Set<string>();
    getAllRelations()
      .filter((r) => pos.has(r.s) && pos.has(r.t) && r.s !== r.t)
      .forEach((r) => {
        const k = [r.s, r.t].sort().join('|') + '|' + r.type;
        if (seen.has(k)) return;
        seen.add(k);
        const a = pos.get(r.s)!;
        const b = pos.get(r.t)!;
        // 微弧线，更像星桥
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.y += a.distanceTo(b) * 0.08;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(REL_COLOR[r.type] || '#8a7f72'),
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        edges.push({ line, rel: r, a: r.s, b: r.t });
      });

    // 光照
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.PointLight(pal.gold, 90, 200, 2);
    key.position.set(20, 40, 30);
    scene.add(key);

    // 交互
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hover: string | null = null;
    let selId: string | null = null;
    const hoverRef = { current: null as string | null };
    const selIdRef = { current: null as string | null };
    let raf = 0;
    let chapterRef = 56;
    let relOnRef: Record<string, boolean> = Object.fromEntries(REL_TYPES.map((t) => [t, true]));

    function pick(ev: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects([...meshById.values()], false);
      return hits[0]?.object.userData.id as string | undefined;
    }

    function onMove(ev: PointerEvent) {
      const id = pick(ev) || null;
      if (id !== hover) {
        hover = id;
        hoverRef.current = id;
        if (id) pauseSpin();
        setHoverId(id);
        renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      }
    }
    function onClick(ev: PointerEvent) {
      const id = pick(ev);
      if (!id) return;
      const c = chars.find((x) => x.id === id);
      if (c) {
        selId = id;
        selIdRef.current = id;
        pauseSpin();
        setSel(c);
        onOpen?.(c);
      }
    }
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('click', onClick);

    function resize() {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    function applyVisibility() {
      const ch = chapterRef;
      stars.forEach((s) => {
        const on = ch >= s.firstCh - 2 && ch <= s.lastCh + 2;
        const near = ch >= s.firstCh && ch <= s.lastCh;
        s.mesh.visible = on;
        s.halo.visible = on;
        const mat = s.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = near ? 1 : 0.35;
        mat.transparent = !near;
        s.halo.material.opacity = near ? 0.85 : 0.25;
      });
      edges.forEach((e) => {
        const ca = chars.find((c) => c.id === e.a);
        const cb = chars.find((c) => c.id === e.b);
        const aOn = chapterRef >= (ca?.firstCh ?? 0) - 2 && chapterRef <= (ca?.lastCh ?? 999) + 2;
        const bOn = chapterRef >= (cb?.firstCh ?? 0) - 2 && chapterRef <= (cb?.lastCh ?? 999) + 2;
        // 关系起止回目（正文情节线）
        const relFrom = e.rel.fromCh ?? 1;
        const relTo = e.rel.toCh ?? 120;
        const inRelWindow = chapterRef >= relFrom - 1 && chapterRef <= relTo + 1;
        const typeOn = relOnRef[e.rel.type] !== false;
        const isHover = hover && (e.a === hover || e.b === hover);
        const mat = e.line.material as THREE.LineBasicMaterial;
        e.line.visible = aOn && bOn && typeOn && inRelWindow;
        mat.opacity = isHover ? 0.95 : aOn && bOn ? 0.5 : 0.1;
      });
    }

    const unsub = observeTheme((p: ScenePalette) => {
      renderer.setClearColor(p.bg, 1);
      (scene.fog as THREE.FogExp2).color.set(p.bg);
      dust.material.color.set(p.starHalo);
      key.color.set(p.gold);
      applyVisibility();
    });

    function tick() {
      raf = requestAnimationFrame(tick);
      controls.update();
      dust.rotation.y += 0.00025;
      stars.forEach((s) => {
        const isHover = hover === s.id;
        const isSel = selId === s.id;
        const target = isSel ? 1.45 : isHover ? 1.25 : 1;
        s.mesh.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
        const base = (s.mesh.userData.haloBase as number) || 6.5;
        s.halo.scale.setScalar(base * (isHover || isSel ? 1.25 : 1));
      });
      applyVisibility();
      renderer.render(scene, camera);

      // 标签投影
      const items = projectLabels(camera, host.clientWidth, host.clientHeight, labelItems.filter((l) => {
        const s = stars.find((x) => x.id === l.id);
        return s ? s.mesh.visible : false;
      }));
      if (labelsRef.current) {
        // 仅在悬停/选中/高优先级时显示名字，避免密密麻麻
        labelsRef.current.innerHTML = items
          .filter((it) => it.visible)
          .map((it) => {
            const c = chars.find((x) => x.id === it.id)!;
            const col = c.color || groupColor[c.group] || '#c4a35a';
            const rnk = starRank(it.id);
            const on = it.id === hover || it.id === selId;
            const fs = on ? 13 : rnk >= 3 ? 12 : rnk === 2 ? 11 : 9;
            const op = on ? 1 : rnk >= 3 ? 0.95 : rnk === 2 ? 0.85 : 0.65;
            const pad = on ? '3px 10px' : '1px 6px';
            return `<div style="position:absolute;left:${it.x}px;top:${it.y}px;transform:translate(-50%,${on ? 16 : 12}px);pointer-events:none;font-family:var(--serif);font-size:${fs}px;font-weight:${on || rnk >= 3 ? 500 : 400};letter-spacing:.12em;color:${on ? '#f7efe4' : '#d8ccb8'};opacity:${op};text-shadow:0 1px 10px rgba(0,0,0,.95),0 0 24px rgba(0,0,0,.7);white-space:nowrap">${on ? `<span style="border-bottom:1px solid ${col};padding-bottom:2px">${it.text}</span>` : it.text}</div>`;
          })
          .join('');
      }
    }
    tick();

    // 暴露章节/过滤/选中到外部 state 的同步
    const sync = () => applyVisibility();
    (host as any).__starSync = {
      setChapter: (n: number) => { chapterRef = n; sync(); },
      setRel: (r: Record<string, boolean>) => { relOnRef = r; sync(); },
      setSel: (id: string | null) => { selId = id; selIdRef.current = id; if (!id) controls.autoRotate = !userBusy; },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chars, groupColor, onOpen]);

  // 章节 / 过滤 / 选中 → three
  useEffect(() => {
    const s = (hostRef.current as any)?.__starSync;
    s?.setChapter(chapter);
  }, [chapter]);

  // 回目轴自动播放：1 → 120，到头暂停
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setChapter((c) => {
        if (c >= 120) {
          setPlaying(false);
          return 120;
        }
        return c + 1;
      });
    }, 280);
    return () => clearInterval(t);
  }, [playing]);
  useEffect(() => {
    const s = (hostRef.current as any)?.__starSync;
    s?.setRel(relOn);
  }, [relOn]);
  useEffect(() => {
    const s = (hostRef.current as any)?.__starSync;
    s?.setSel(sel?.id ?? null);
  }, [sel]);

  useEffect(() => {
    // 触发标签重绘节流
    const t = setInterval(() => setLabelTick((n) => n + 1), 400);
    return () => clearInterval(t);
  }, []);

  const selRels = sel ? getRelationsFor(sel.id) : [];

  return (
    <div className="starmap">
      <div className="starmap-canvas" ref={hostRef}>
        <div className="starmap-labels" ref={labelsRef} data-tick={labelTick} />
      </div>

      <div className="starmap-ui">
        <div className="starmap-acts">
          <button
            className="starmap-play"
            onClick={() => {
              if (!playing && chapter >= 120) setChapter(1);
              setPlaying(!playing);
            }}
            title={playing ? '暂停回目播放' : '自动播放回目'}
            aria-label={playing ? '暂停' : '播放'}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="14" height="14"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="starmap-ch">第{toCN(chapter)}回</span>
          <input
            className="starmap-range"
            type="range"
            min={1}
            max={120}
            value={chapter}
            onChange={(e) => {
              setPlaying(false);
              setChapter(Number(e.target.value));
            }}
            onPointerDown={() => setPlaying(false)}
            aria-label="回目时间轴"
          />
          <div className="starmap-act-marks">
            {[
              { n: 5, t: '神话' },
              { n: 56, t: '盛景' },
              { n: 78, t: '裂痕' },
              { n: 110, t: '倾颓' },
              { n: 120, t: '归荒' },
            ].map((m) => (
              <button key={m.n} onClick={() => { setPlaying(false); setChapter(m.n); }} title={`跳至第${toCN(m.n)}回`}>
                {m.t}
              </button>
            ))}
          </div>
        </div>

        <div className="starmap-filters">
          {REL_TYPES.map((t) => (
            <button
              key={t}
              className={`chip ${relOn[t] ? 'on' : ''}`}
              style={{ borderColor: REL_COLOR[t] }}
              onClick={() => setRelOn((s) => ({ ...s, [t]: !s[t] }))}
            >
              <i style={{ background: REL_COLOR[t] }} />
              {REL_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {sel && (
        <div className="modal-wrap" onClick={() => setSel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className={`pill ${sel.gender === '女' ? 'accent' : 'jade'}`} style={{ marginBottom: 8 }}>
                  {sel.role}
                </div>
                <h2>{sel.name}</h2>
                <div style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 6 }}>
                  {groups.find((g) => g.id === sel.group)?.name} · 第{toCN(sel.firstCh)}回 — 第{toCN(sel.lastCh)}回
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSel(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{sel.bio}</p>
              {sel.fate && (
                <p style={{ color: 'var(--accent)', fontFamily: 'var(--serif)' }}>结局 · {sel.fate}</p>
              )}
              <div className="meta-row">
                <Link className="pill" href={`/read/${sel.firstCh}/`}>
                  第{toCN(sel.firstCh)}回初现
                </Link>
                <Link className="pill accent" href={`/search/?q=${encodeURIComponent(sel.name)}`}>
                  检索
                </Link>
              </div>
              <div className="meta-row">
                {selRels.map((r, i) => (
                  <button key={i} className="pill" onClick={() => setSel(r.other)}>
                    {r.other.name}
                    <span style={{ opacity: 0.65 }}>·{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
