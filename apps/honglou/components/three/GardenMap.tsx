'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GARDEN_ACTS, GARDEN_SPOTS, STREAM_POINTS, type GardenSpot } from '@/lib/garden-layout';
import { toCN } from '@/lib/cn';
import Link from '@/components/Link';
import { palette, observeTheme } from './theme';
import { projectLabels, type LabelItem } from './labels';

type Props = {
  onOpen?: (s: GardenSpot) => void;
};

/** 造一座微缩屋：台基 + 墙 + 檐 */
function buildHouse(kind: GardenSpot['kind'], col: { wood: number; roof: number; paper: number; jade: number; gold: number }) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: col.wood, roughness: 0.75 });
  const wall = new THREE.MeshStandardMaterial({ color: 0xf0e6d4, roughness: 0.88 });
  const roofMat = new THREE.MeshStandardMaterial({ color: col.roof, roughness: 0.55, metalness: 0.08 });

  // 台基
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.55, 5.0), new THREE.MeshStandardMaterial({ color: 0xc4b49a, roughness: 0.95 }));
  base.position.y = 0.28;
  g.add(base);

  // 墙体
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.6, 3.8), wall);
  body.position.y = 1.8;
  g.add(body);

  // 朱柱
  for (const [x, z] of [[-2.4, -1.7], [2.4, -1.7], [-2.4, 1.7], [2.4, 1.7]] as const) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.7, 8), wood);
    c.position.set(x, 1.8, z);
    g.add(c);
  }

  // 歇山顶：四坡 + 起翘檐
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.9, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 3.9;
  g.add(roof);
  // 檐口
  const eave = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.18, 5.4), roofMat);
  eave.position.y = 3.05;
  g.add(eave);
  // 脊
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 3.8), roofMat);
  ridge.position.y = 4.7;
  g.add(ridge);
  // 脊饰
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: col.gold, metalness: 0.5, roughness: 0.35 }));
  finial.position.y = 4.95;
  g.add(finial);

  if (kind === 'nunnery') {
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 8), new THREE.MeshStandardMaterial({ color: col.gold, metalness: 0.5, roughness: 0.35 }));
    spire.position.y = 5.3;
    g.add(spire);
  }
  if (kind === 'farm') {
    roof.scale.set(1.2, 0.85, 1.2);
    roofMat.color.set(0x9a7a48);
    eave.material = roofMat;
  }
  if (kind === 'cottage') {
    body.scale.set(0.92, 0.8, 0.92);
  }
  if (kind === 'hall') {
    g.scale.setScalar(1.2);
  }
  if (kind === 'garden') {
    g.scale.setScalar(1.28);
  }
  return g;
}

function buildPavilion(col: { wood: number; roof: number; gold: number }) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: col.wood, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({ color: col.roof, roughness: 0.5, metalness: 0.1 });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xc4b49a, roughness: 0.95 }));
  floor.position.y = 0.18;
  g.add(floor);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.4, 6), wood);
    p.position.set(Math.cos(a) * 1.8, 1.45, Math.sin(a) * 1.8);
    g.add(p);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.35, 6), roofMat);
  roof.position.y = 3.4;
  g.add(roof);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: col.gold, metalness: 0.5, roughness: 0.35 }));
  tip.position.y = 4.15;
  g.add(tip);
  return g;
}

function buildBridge() {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 0.22, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.85 }),
  );
  deck.position.y = 0.7;
  g.add(deck);
  // 拱
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.14, 8, 24, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xa89070, roughness: 0.85 }),
  );
  arch.rotation.x = Math.PI;
  arch.rotation.z = Math.PI / 2;
  arch.position.y = 0.15;
  g.add(arch);
  // 亭
  const pav = buildPavilion({ wood: 0x8b3a2e, roof: 0x2f3d36, gold: 0xc4a35a });
  pav.scale.setScalar(0.7);
  pav.position.set(0, 0.75, 0);
  g.add(pav);
  return g;
}

function buildMound() {
  const g = new THREE.Group();
  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x8a9a6a, roughness: 0.95 }),
  );
  hill.scale.set(1, 0.55, 1);
  g.add(hill);
  // 花
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.4 + Math.random() * 1.6;
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd4785f : 0xe8a0b0, emissive: 0x331111, roughness: 0.6 }),
    );
    petal.position.set(Math.cos(a) * r, 0.4 + Math.random() * 0.3, Math.sin(a) * r);
    g.add(petal);
  }
  return g;
}

export default function GardenMap({ onOpen }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState(1);
  const [sel, setSel] = useState<GardenSpot | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const actMeta = GARDEN_ACTS[act] || GARDEN_ACTS[1];

  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const host: HTMLDivElement = hostEl;
    const pal = palette();

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(pal.bg, 55, 160);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
    camera.position.set(4, 52, 68);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(pal.bg, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minDistance = 40;
    controls.maxDistance = 140;
    controls.target.set(0, 0, 2);

    // 光
    const amb = new THREE.AmbientLight(0xffffff, 0.62);
    scene.add(amb);
    const sun = new THREE.DirectionalLight(0xffe8c0, 1.55);
    sun.position.set(28, 48, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -55;
    sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 55;
    sun.shadow.camera.bottom = -55;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb0c8e0, 0.4);
    fill.position.set(-30, 18, -22);
    scene.add(fill);

    // 底盘：绢本沙盘
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(48, 50, 1.4, 64),
      new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.95 }),
    );
    ground.position.y = -0.7;
    ground.receiveShadow = true;
    scene.add(ground);

    // 园墙（环形）—— 青砖
    const wall = new THREE.Mesh(
      new THREE.TorusGeometry(42, 0.55, 8, 64),
      new THREE.MeshStandardMaterial({ color: 0x4a4338, roughness: 0.8 }),
    );
    wall.rotation.x = Math.PI / 2;
    wall.position.y = 1.0;
    scene.add(wall);

    // 沁芳溪
    const streamPts = STREAM_POINTS.map(([x, z]) => new THREE.Vector3(x, 0.2, z));
    const streamCurve = new THREE.CatmullRomCurve3(streamPts);
    const stream = new THREE.Mesh(
      new THREE.TubeGeometry(streamCurve, 64, 1.35, 8, false),
      new THREE.MeshStandardMaterial({
        color: 0x3d7a9a,
        transparent: true,
        opacity: 0.82,
        roughness: 0.12,
        metalness: 0.25,
        emissive: 0x1a4055,
        emissiveIntensity: 0.15,
      }),
    );
    scene.add(stream);

    // 草木色随幕次
    const treeMats = {
      leaf: new THREE.MeshStandardMaterial({ color: 0x4f8f5a, roughness: 0.8 }),
      trunk: new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9 }),
    };

    function addTree(x: number, z: number, s = 1) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.28 * s, 1.7 * s, 6), treeMats.trunk);
      trunk.position.y = 0.85 * s;
      g.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.35 * s, 10, 8), treeMats.leaf);
      crown.position.y = 2.2 * s;
      crown.scale.set(1.1, 0.9, 1.1);
      crown.castShadow = true;
      g.add(crown);
      g.position.set(x, 0, z);
      scene.add(g);
      return g;
    }

    // 竹（潇湘馆）
    function addBamboo(x: number, z: number) {
      for (let i = 0; i < 16; i++) {
        const g = new THREE.Group();
        const h = 3.4 + Math.random() * 2.2;
        const cane = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.09, h, 5),
          new THREE.MeshStandardMaterial({ color: 0x3d7a48, roughness: 0.65 }),
        );
        cane.position.y = h / 2;
        g.add(cane);
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.55, 6, 5),
          new THREE.MeshStandardMaterial({ color: 0x5f9f6a, roughness: 0.75 }),
        );
        leaf.scale.set(1.5, 0.45, 1.5);
        leaf.position.y = h;
        g.add(leaf);
        g.position.set(x + (Math.random() - 0.5) * 5, 0, z + (Math.random() - 0.5) * 5);
        scene.add(g);
      }
    }

    // 草坪散点树
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + 0.35;
      const r = 7 + Math.random() * 30;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r * 0.85;
      const near = GARDEN_SPOTS.some((s) => Math.hypot(s.x - x, s.z - z) < 7);
      if (!near) addTree(x, z, 0.75 + Math.random() * 0.55);
    }
    addBamboo(-12, 16);

    // 建筑
    type SpotObj = { spot: GardenSpot; group: THREE.Group; label: LabelItem; ring: THREE.Mesh };
    const spots: SpotObj[] = [];
    const labelItems: LabelItem[] = [];

    GARDEN_SPOTS.forEach((spot) => {
      let group: THREE.Group;
      const houseCols = { wood: 0x8b3a2e, roof: 0x2f3d36, paper: 0xf0e6d4, jade: 0x4a6b5d, gold: 0xc4a35a };
      if (spot.kind === 'bridge') group = buildBridge();
      else if (spot.kind === 'pavilion') group = buildPavilion({ wood: 0x8b3a2e, roof: 0x2f3d36, gold: 0xc4a35a });
      else if (spot.kind === 'mound') group = buildMound();
      else {
        group = buildHouse(spot.kind, houseCols);
        group.scale.multiplyScalar(1.15);
      }

      group.position.set(spot.x, 0, spot.z);
      group.rotation.y = spot.rot || 0;
      group.traverse((o) => {
        o.castShadow = true;
        o.receiveShadow = true;
      });
      group.userData.id = spot.id;
      scene.add(group);

      // 选中/悬停光环
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.2, 3.7, 32),
        new THREE.MeshBasicMaterial({ color: pal.gold, transparent: true, opacity: 0, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(spot.x, 0.08, spot.z);
      scene.add(ring);

      const label: LabelItem = { id: spot.id, text: spot.name.split(' · ')[0], object: group, priority: 1 };
      labelItems.push(label);
      spots.push({ spot, group, label, ring });
    });

    // 气候 / 幕次
    let actRef = 1;
    function applyAct(n: number) {
      actRef = n;
      const meta = GARDEN_ACTS[n] || GARDEN_ACTS[1];
      const t = meta.tone;
      // 光色：春日暖金 → 秋暮冷褐 → 冬雪青灰
      const sunCol = new THREE.Color().setHSL(0.09 - t * 0.03, 0.4, 0.55 + t * 0.15);
      sun.color.copy(sunCol);
      sun.intensity = 0.85 + t * 0.95;
      amb.intensity = 0.4 + t * 0.35;
      // 树色
      const leaf = new THREE.Color().setHSL(0.32 - (1 - t) * 0.18, 0.4, 0.3 + t * 0.15);
      treeMats.leaf.color.copy(leaf);
      // 地面明度
      (ground.material as THREE.MeshStandardMaterial).color.setHSL(0.1, 0.22, 0.58 + t * 0.15);
      // 雪季
      if (n === 4) {
        treeMats.leaf.color.set(0x8a9a8a);
        (ground.material as THREE.MeshStandardMaterial).color.set(0xe0dcd4);
        sun.color.set(0xd8e4f0);
        sun.intensity = 0.9;
      }
      // 活跃建筑略亮
      spots.forEach((s) => {
        const acts = s.spot.acts || [1, 2];
        const on = acts.includes(n) || acts.includes(0);
        s.group.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m && 'emissive' in m) {
            m.emissive = new THREE.Color(on ? 0x221100 : 0x000000);
            m.emissiveIntensity = on ? 0.15 : 0;
          }
        });
      });
    }
    applyAct(1);

    // 交互
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hover: string | null = null;
    let selRef: string | null = null;
    let raf = 0;

    function pick(ev: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const meshes: THREE.Object3D[] = [];
      spots.forEach((s) => s.group.traverse((o) => meshes.push(o)));
      const hits = ray.intersectObjects(meshes, true);
      if (!hits[0]) return null;
      let o: THREE.Object3D | null = hits[0].object;
      while (o) {
        if (o.userData?.id) return o.userData.id as string;
        o = o.parent;
      }
      return null;
    }

    function onMove(ev: PointerEvent) {
      const id = pick(ev);
      if (id !== hover) {
        hover = id;
        setHoverId(id);
        renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      }
    }
    function onClick(ev: PointerEvent) {
      const id = pick(ev);
      if (!id) return;
      const s = GARDEN_SPOTS.find((x) => x.id === id);
      if (s) {
        selRef = id;
        setSel(s);
        onOpen?.(s);
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

    const unsub = observeTheme((p) => {
      renderer.setClearColor(p.bg, 1);
      (scene.fog as THREE.Fog).color.set(p.bg);
      (ground.material as THREE.MeshStandardMaterial).color.set(p.paper);
      wall.material.color.set(p.ink);
      stream.material.color.set(p.water);
    });

    function tick() {
      raf = requestAnimationFrame(tick);
      controls.update();
      // 水面微动
      stream.material.emissiveIntensity = 0.06 + Math.sin(performance.now() * 0.001) * 0.03;
      // 光环
      spots.forEach((s) => {
        const isOn = hover === s.spot.id || selRef === s.spot.id;
        const mat = s.ring.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, isOn ? 0.55 : 0, 0.12);
        const sc = isOn ? 1.08 : 1;
        s.group.scale.lerp(new THREE.Vector3(sc, sc, sc), 0.1);
      });
      renderer.render(scene, camera);

      const items = projectLabels(camera, host.clientWidth, host.clientHeight, labelItems);
      if (labelsRef.current) {
        labelsRef.current.innerHTML = items
          .filter((it) => it.visible)
          .map((it) => {
            const on = hover === it.id || selRef === it.id;
            const dim = actRef >= 3 ? 0.55 : 1;
            return `<div style="position:absolute;left:${it.x}px;top:${it.y}px;transform:translate(-50%,-100%);pointer-events:none;font-family:var(--serif);font-size:${on ? 14 : 12}px;letter-spacing:.12em;color:${on ? '#f7efe4' : '#e0d4c0'};opacity:${on ? 1 : dim};text-shadow:0 1px 8px rgba(0,0,0,.8);white-space:nowrap;background:rgba(12,14,18,${on ? 0.65 : 0.4});border:1px solid ${on ? 'rgba(196,163,90,.55)' : 'rgba(255,255,255,.1)'};padding:2px 10px;border-radius:999px">${it.text}</div>`;
          })
          .join('');
      }
    }
    tick();

    (host as any).__gardenSync = { setAct: (n: number) => applyAct(n) };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (hostRef.current as any)?.__gardenSync?.setAct(act);
  }, [act]);

  return (
    <div className="gardenmap">
      <div className="gardenmap-canvas" ref={hostRef}>
        <div className="gardenmap-labels" ref={labelsRef} />
      </div>

      <div className="gardenmap-ui">
        <div className="gardenmap-acts">
          {GARDEN_ACTS.map((a) => (
            <button key={a.id} className={`chip ${act === a.n ? 'on' : ''}`} onClick={() => setAct(a.n)}>
              {a.title}
              <span style={{ opacity: 0.65, marginLeft: 6 }}>{a.season}</span>
            </button>
          ))}
        </div>
        <div className="gardenmap-hint">拖拽旋转 · 滚轮缩放 · 点击院落</div>
      </div>

      {sel && (
        <div className="modal-wrap" onClick={() => setSel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="pill jade" style={{ marginBottom: 8 }}>
                  {sel.host === '—' ? '公共空间' : `${sel.host} 相关`}
                </div>
                <h2>{sel.name}</h2>
              </div>
              <button className="icon-btn" onClick={() => setSel(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{sel.desc}</p>
              <div className="meta-row">
                {sel.tags.map((t) => (
                  <span key={t} className="pill">
                    {t}
                  </span>
                ))}
              </div>
              <div className="meta-row">
                <Link className="pill accent" href={`/topics/places/`}>
                  大观园图鉴
                </Link>
                <Link className="pill" href={`/search/?q=${encodeURIComponent(sel.name.split(' · ')[0])}`}>
                  检索
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
