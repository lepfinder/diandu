'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Link from '@/components/Link';

/** 葬花吟 · 分幕诗句 */
const VERSES = [
  { id: 0, label: '起', lines: ['花谢花飞花满天，', '红消香断有谁怜？'] },
  { id: 1, label: '承', lines: ['游丝软系飘春榭，', '落絮轻沾扑绣帘。'] },
  { id: 2, label: '转', lines: ['闺中女儿惜春暮，', '愁绪满怀无释处。'] },
  { id: 3, label: '转', lines: ['手把花锄出绣闺，', '忍踏落花来复去。'] },
  { id: 4, label: '合', lines: ['试看春残花渐落，', '便是红颜老死时。'] },
  { id: 5, label: '绝', lines: ['一朝春尽红颜老，', '花落人亡两不知！'] },
] as const;

const PETAL_COUNT = 900;

function makePetalTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.translate(32, 32);
  // 椭圆花瓣
  const grd = g.createRadialGradient(0, -4, 2, 0, 0, 28);
  grd.addColorStop(0, 'rgba(255, 210, 210, 0.95)');
  grd.addColorStop(0.45, 'rgba(232, 140, 150, 0.75)');
  grd.addColorStop(1, 'rgba(180, 60, 70, 0)');
  g.fillStyle = grd;
  g.beginPath();
  g.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2);
  g.fill();
  // 花脉
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, -18);
  g.quadraticCurveTo(4, 0, 0, 18);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

function makeMoundTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  grd.addColorStop(0, 'rgba(120, 50, 55, 0.55)');
  grd.addColorStop(0.6, 'rgba(80, 30, 35, 0.25)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export default function ZanghuaField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [vi, setVi] = useState(0);
  const [wind, setWind] = useState(0.35);
  const viRef = useRef(0);

  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const host: HTMLDivElement = hostEl;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e0a0c, 0.028);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
    camera.position.set(0, 2.5, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // 落花
    const tex = makePetalTexture();
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PETAL_COUNT * 3);
    const seed = new Float32Array(PETAL_COUNT * 4); // phase, speed, size, hue
    for (let i = 0; i < PETAL_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = Math.random() * 18 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18 - 2;
      seed[i * 4] = Math.random() * Math.PI * 2;
      seed[i * 4 + 1] = 0.4 + Math.random() * 0.9;
      seed[i * 4 + 2] = 0.35 + Math.random() * 0.55;
      seed[i * 4 + 3] = Math.random();
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));

    const petalMat = new THREE.PointsMaterial({
      map: tex,
      size: 0.85,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      opacity: 0.95,
      sizeAttenuation: true,
      color: 0xf0a8b0,
    });
    // 用 Sprite 列表更像花瓣；为性能用 Points + 贴图
    const petals = new THREE.Points(geo, petalMat);
    scene.add(petals);

    // 花冢
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x4a3030,
        roughness: 0.95,
        map: makeMoundTexture(),
        transparent: true,
        opacity: 0.85,
      }),
    );
    mound.scale.set(1.2, 0.45, 1);
    mound.position.set(0, -4.5, -2);
    scene.add(mound);

    // 冢上残红
    const heap = new THREE.Points(
      (() => {
        const g = new THREE.BufferGeometry();
        const n = 120;
        const p = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 1.8;
          p[i * 3] = Math.cos(a) * r;
          p[i * 3 + 1] = -4.2 + Math.random() * 0.5;
          p[i * 3 + 2] = -2 + Math.sin(a) * r * 0.7;
        }
        g.setAttribute('position', new THREE.BufferAttribute(p, 3));
        return g;
      })(),
      new THREE.PointsMaterial({ map: tex, size: 0.4, color: 0xc06070, transparent: true, opacity: 0.8, depthWrite: false }),
    );
    scene.add(heap);

    // 风场指示（细丝）
    const silkGeo = new THREE.BufferGeometry();
    const silkPts: THREE.Vector3[] = [];
    for (let s = 0; s < 12; s++) {
      const y = -1 + s * 0.35;
      for (let t = 0; t <= 20; t++) {
        silkPts.push(new THREE.Vector3(-12 + t * 1.2, y + Math.sin(t * 0.4 + s) * 0.15, -3 - s * 0.15));
      }
    }
    silkGeo.setFromPoints(silkPts);
    const silk = new THREE.LineSegments(
      silkGeo,
      new THREE.LineBasicMaterial({ color: 0xc4a35a, transparent: true, opacity: 0.08 }),
    );
    scene.add(silk);

    // 光
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.PointLight(0xffc0b0, 30, 60, 2);
    key.position.set(3, 8, 6);
    scene.add(key);

    let raf = 0;
    let windRef = 0.35;
    let burst = 0;

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

    // 鼠标风向
    let mx = 0;
    function onMove(e: PointerEvent) {
      const r = host.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    }
    host.addEventListener('pointermove', onMove);

    function tick() {
      raf = requestAnimationFrame(tick);
      const t = performance.now() * 0.001;
      const arr = geo.attributes.position.array as Float32Array;
      const sd = geo.attributes.aSeed.array as Float32Array;

      for (let i = 0; i < PETAL_COUNT; i++) {
        const i3 = i * 3;
        const i4 = i * 4;
        const phase = sd[i4];
        const speed = sd[i4 + 1];
        // 下落 + 风飘 + 回旋
        arr[i3 + 1] -= speed * 0.018 * (1 + burst * 0.5);
        arr[i3] += (Math.sin(t * 0.7 + phase) * 0.008 + windRef * 0.02 + mx * 0.01) * speed;
        arr[i3 + 2] += Math.cos(t * 0.5 + phase) * 0.004;

        // 落地 → 花冢附近堆积，再飘回天上
        if (arr[i3 + 1] < -4.2) {
          // 靠近花冢
          arr[i3] = arr[i3] * 0.92 + (Math.random() - 0.5) * 0.1;
          arr[i3 + 2] = arr[i3 + 2] * 0.92 + -2 * 0.02;
          if (Math.random() < 0.02) {
            // 重新升起
            arr[i3] = (Math.random() - 0.5) * 28;
            arr[i3 + 1] = 12 + Math.random() * 6;
            arr[i3 + 2] = (Math.random() - 0.5) * 18 - 2;
          }
        }
        // 越界回绕
        if (arr[i3] > 16) arr[i3] = -16;
        if (arr[i3] < -16) arr[i3] = 16;
      }
      geo.attributes.position.needsUpdate = true;
      burst = Math.max(0, burst - 0.002);

      // 花瓣随诗幕变色：后段更残红
      const p = viRef.current / (VERSES.length - 1);
      petalMat.color.setHSL(0.98 - p * 0.04, 0.45 - p * 0.15, 0.72 - p * 0.18);
      petalMat.opacity = 0.85 - p * 0.15;

      // 轻微镜头呼吸
      camera.position.x = Math.sin(t * 0.15) * 0.4 + mx * 0.3;
      camera.position.y = 2.5 + Math.sin(t * 0.2) * 0.15;
      camera.lookAt(0, -1.5, -2);

      renderer.render(scene, camera);
    }
    tick();

    (host as any).__zanghua = {
      setWind: (w: number) => { windRef = w; },
      gust: () => { burst = 1; },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    (hostRef.current as any)?.__zanghua?.setWind(wind);
  }, [wind]);

  useEffect(() => {
    viRef.current = vi;
  }, [vi]);

  function next() {
    if (vi < VERSES.length - 1) {
      setVi(vi + 1);
      (hostRef.current as any)?.__zanghua?.gust();
    }
  }
  function prev() {
    if (vi > 0) setVi(vi - 1);
  }

  const v = VERSES[vi];
  const isEnd = vi === VERSES.length - 1;

  return (
    <div className="zanghua" onClick={next}>
      <div className="zanghua-canvas" ref={hostRef} />
      <div className="zanghua-vignette" />

      {/* 诗句 */}
      <div className={`zanghua-verse ${isEnd ? 'end' : ''}`} key={v.id}>
        <div className="zanghua-label">{v.label}</div>
        {v.lines.map((l, i) => (
          <p key={i} style={{ animationDelay: `${0.12 + i * 0.22}s` }}>
            {l}
          </p>
        ))}
      </div>

      {/* 花冢题名（末幕） */}
      {isEnd && (
        <div className="zanghua-mound-cap">
          <span>埋香冢</span>
          <em>花落人亡两不知</em>
        </div>
      )}

      {/* 控制 */}
      <div className="zanghua-ui" onClick={(e) => e.stopPropagation()}>
        <div className="zanghua-progress">
          {VERSES.map((x, i) => (
            <button
              key={x.id}
              className={i === vi ? 'on' : i < vi ? 'done' : ''}
              onClick={() => setVi(i)}
              title={x.lines[0]}
            />
          ))}
        </div>
        <div className="zanghua-wind">
          <label>风</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={wind}
            onChange={(e) => setWind(Number(e.target.value))}
          />
          <button className="zanghua-gust" onClick={() => (hostRef.current as any)?.__zanghua?.gust()}>
            起风
          </button>
        </div>
        <div className="zanghua-nav">
          <button onClick={prev} disabled={vi === 0}>
            ← 上句
          </button>
          <button onClick={next} disabled={isEnd}>
            下句 →
          </button>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="zanghua-foot">
        <div className="zanghua-title">葬花吟</div>
        <div className="zanghua-links">
          <Link href="/read/27/">第二十七回</Link>
          <Link href="/topics/poems/">诗词</Link>
          <Link href="/garden/">大观园</Link>
          <Link href="/">精读站</Link>
        </div>
      </footer>
    </div>
  );
}
