'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Link from '@/components/Link';

/** 四幕叙事 */
const ACTS = [
  {
    id: 'stone',
    kicker: '第一幕 · 青埂峰',
    title: '无材补天',
    lines: [
      '女娲炼石补天之时，于大荒山无稽崖炼成顽石三万六千五百零一块。',
      '单单剩了一块未用，弃在此山青埂峰下。',
      '谁知此石灵性已通，因见众石俱得补天，独自己无材不堪入选，遂自怨自嗟。',
    ],
  },
  {
    id: 'monk',
    kicker: '第二幕 · 红尘梦',
    title: '一僧一道',
    lines: [
      '俄见一僧一道远远而来，生得骨骼不凡，丰神迥异。',
      '说到红尘中荣华富贵，此石听了，不觉打动凡心。',
      '那僧大施佛法，将一块大石登时变成鲜明莹洁的美玉，缩成扇坠大小。',
    ],
  },
  {
    id: 'taixu',
    kicker: '第三幕 · 太虚幻境',
    title: '梦游太虚',
    lines: [
      '假作真时真亦假，无为有处有还无。',
      '宝玉随警幻来至太虚幻境，但见朱栏白石，绿树清溪，人迹希逢，飞尘不到。',
      '转过牌坊，便是「薄命司」——册中所载，皆天下女子之命。',
    ],
  },
  {
    id: 'fate',
    kicker: '第四幕 · 薄命司',
    title: '十二钗判词',
    lines: [
      '宝玉取「金陵十二钗正册」来看。只见头一页上便画着两株枯木，木上悬着一围玉带；又有一堆雪，雪下一股金簪。',
      '判词云：可叹停机德，堪怜咏絮才。玉带林中挂，金簪雪里埋。',
      '此后种种繁华，皆成倒计时。',
    ],
  },
] as const;

/** 十二钗精简判词（正册） */
const SCROLLS = [
  { name: '林黛玉 · 薛宝钗', verse: '可叹停机德，堪怜咏絮才。玉带林中挂，金簪雪里埋。', href: '/topics/twelve/' },
  { name: '贾元春', verse: '二十年来辨是非，榴花开处照宫闱。三春争及初春景，虎兕相逢大梦归。', href: '/topics/twelve/' },
  { name: '贾探春', verse: '才自精明志自高，生于末世运偏消。清明涕送江边望，千里东风一梦遥。', href: '/topics/twelve/' },
  { name: '史湘云', verse: '富贵又何为？襁褓之间父母违。展眼吊斜晖，湘江水逝楚云飞。', href: '/topics/twelve/' },
  { name: '妙玉', verse: '欲洁何曾洁，云空未必空。可怜金玉质，终陷淖泥中。', href: '/topics/twelve/' },
  { name: '贾迎春', verse: '子系中山狼，得志便猖狂。金闺花柳质，一载赴黄粱。', href: '/topics/twelve/' },
  { name: '贾惜春', verse: '勘破三春景不长，缁衣顿改昔年妆。可怜绣户侯门女，独卧青灯古佛旁。', href: '/topics/twelve/' },
  { name: '王熙凤', verse: '凡鸟偏从末世来，都知爱慕此生才。一从二令三人木，哭向金陵事更哀。', href: '/topics/twelve/' },
  { name: '贾巧姐', verse: '留余庆，忽遇恩人。幸娘亲，积得阴功。', href: '/topics/twelve/' },
  { name: '李纨', verse: '桃李春风结子完，到头谁似一盆兰？如冰水好空相妒，枉与他人作笑谈。', href: '/topics/twelve/' },
  { name: '秦可卿', verse: '情天情海幻情身，情既相逢必主淫。漫言不肖皆荣出，造衅开端实在宁。', href: '/topics/twelve/' },
];

function makeMistTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grd.addColorStop(0, 'rgba(220,210,190,0.55)');
  grd.addColorStop(0.45, 'rgba(180,170,150,0.18)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function makeJadeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c4a35a';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#8a6a30';
  g.lineWidth = 3;
  g.strokeRect(10, 10, 108, 108);
  // 通灵宝玉 四字简化
  g.fillStyle = '#3a2810';
  g.font = 'bold 28px serif';
  g.textAlign = 'center';
  g.fillText('通灵', 64, 56);
  g.fillText('宝玉', 64, 96);
  return new THREE.CanvasTexture(c);
}

export default function TaixuJourney() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState(0);
  const [openScroll, setOpenScroll] = useState<number | null>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const host: HTMLDivElement = hostEl;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0c12, 0.018);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
    camera.position.set(0, 2, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // 星尘
    const dustGeo = new THREE.BufferGeometry();
    const N = 1200;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 160 - 40;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xc4a35a, size: 0.12, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    scene.add(dust);

    // 顽石 / 玉
    const stone = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 1),
      new THREE.MeshStandardMaterial({
        color: 0x4a453c,
        roughness: 0.92,
        metalness: 0.08,
        flatShading: true,
        emissive: 0x1a1810,
        emissiveIntensity: 0.15,
      }),
    );
    stone.position.set(0, 0, 0);
    scene.add(stone);

    const jadeMat = new THREE.MeshStandardMaterial({
      color: 0xe0d0a0,
      roughness: 0.2,
      metalness: 0.45,
      emissive: 0x8a7030,
      emissiveIntensity: 0,
      map: makeJadeTexture(),
    });
    const jade = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.35, 32), jadeMat);
    jade.rotation.x = Math.PI / 2;
    jade.position.set(0, 0, 0);
    jade.visible = false;
    scene.add(jade);

    // 光晕环
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.04, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xc4a35a, transparent: true, opacity: 0.35 }),
    );
    scene.add(halo);
    const halo2 = halo.clone();
    halo2.scale.setScalar(1.5);
    halo2.rotation.x = Math.PI / 3;
    scene.add(halo2);

    // 雾团
    const mistTex = makeMistTexture();
    const mists: THREE.Sprite[] = [];
    for (let i = 0; i < 18; i++) {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: mistTex, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      sp.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 16, -8 - Math.random() * 30);
      sp.scale.setScalar(8 + Math.random() * 14);
      scene.add(sp);
      mists.push(sp);
    }

    // 卷轴架（薄命司）
    const scrolls3d: THREE.Group[] = [];
    for (let i = 0; i < 11; i++) {
      const g = new THREE.Group();
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.7 }),
      );
      rod.rotation.z = Math.PI / 2;
      g.add(rod);
      const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 2.2),
        new THREE.MeshStandardMaterial({
          color: 0xf0e6d4,
          roughness: 0.9,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        }),
      );
      g.add(paper);
      const a = (i / 11) * Math.PI * 2;
      const r = 7.5;
      g.position.set(Math.cos(a) * r, Math.sin(i * 1.7) * 1.2, Math.sin(a) * r - 22);
      g.rotation.y = -a + Math.PI / 2;
      g.visible = false;
      scene.add(g);
      scrolls3d.push(g);
    }

    // 牌坊（太虚）
    const gate = new THREE.Group();
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x8b3a2e, roughness: 0.6 });
    for (const x of [-2.2, 2.2]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6, 0.35), gateMat);
      p.position.set(x, 0, -28);
      gate.add(p);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(6, 0.35, 0.45), gateMat);
    beam.position.set(0, 2.8, -28);
    gate.add(beam);
    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.25, 0.4), gateMat);
    beam2.position.set(0, 2.1, -28);
    gate.add(beam2);
    // 匾
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xc4a35a, transparent: true, opacity: 0.85 }),
    );
    plaque.position.set(0, 2.45, -27.75);
    gate.add(plaque);
    gate.visible = false;
    scene.add(gate);

    // 光
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.PointLight(0xffe0b0, 40, 80, 2);
    key.position.set(4, 6, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x6a8aaa, 18, 60, 2);
    rim.position.set(-6, -2, -4);
    scene.add(rim);

    let raf = 0;
    let progress = 0;
    let actRef = 0;
    let lastScroll = 0;

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

    function applyProgress(p: number) {
      progress = p;
      const a0 = p < 0.18 ? 0 : p < 0.36 ? 1 : p < 0.55 ? 2 : 3;
      if (a0 !== actRef) {
        actRef = a0;
        setAct(a0);
      }

      // 相机推进
      const camZ = 18 - p * 38;
      camera.position.set(Math.sin(p * Math.PI) * 2.2, 2 + Math.sin(p * 6) * 0.4, camZ);
      camera.lookAt(0, 0, camZ - 12);

      // 石 → 玉
      const turn = THREE.MathUtils.smoothstep(p, 0.18, 0.32);
      stone.visible = turn < 0.98;
      jade.visible = turn > 0.02;
      const stoneMat = stone.material as THREE.MeshStandardMaterial;
      stoneMat.emissive = new THREE.Color(0xc4a35a);
      stoneMat.emissiveIntensity = turn * 0.35;
      stone.scale.setScalar(1 - turn * 0.55);
      jade.scale.setScalar(0.2 + turn * 0.9);
      jadeMat.emissiveIntensity = turn * 0.4;
      stone.rotation.y += 0.004;
      jade.rotation.z += 0.008;

      // 光环随进度
      halo.rotation.z = p * 2;
      halo2.rotation.y = p * 1.5;
      const haloOp = 0.2 + Math.sin(p * Math.PI) * 0.35;
      (halo.material as THREE.MeshBasicMaterial).opacity = haloOp;
      (halo2.material as THREE.MeshBasicMaterial).opacity = haloOp * 0.7;

      // 牌坊浮现
      const gateOn = THREE.MathUtils.smoothstep(p, 0.42, 0.58);
      gate.visible = gateOn > 0.05;
      gate.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial & THREE.MeshStandardMaterial;
        if (m && 'opacity' in m) {
          m.transparent = true;
          m.opacity = gateOn * (o === plaque ? 0.85 : 1);
        }
      });

      // 卷轴浮现
      const scOn = THREE.MathUtils.smoothstep(p, 0.62, 0.8);
      scrolls3d.forEach((g, i) => {
        g.visible = scOn > 0.05;
        const local = THREE.MathUtils.smoothstep(scOn, i * 0.06, i * 0.06 + 0.35);
        g.scale.setScalar(0.4 + local * 0.7);
        g.position.y = Math.sin(performance.now() * 0.001 + i) * 0.15 + (1 - local) * 2;
        g.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m && 'opacity' in m) {
            m.transparent = true;
            m.opacity = 0.15 + local * 0.75;
          }
        });
      });

      // 雾
      mists.forEach((sp, i) => {
        sp.position.x += Math.sin(performance.now() * 0.0002 + i) * 0.01;
        sp.material.opacity = 0.12 + (1 - Math.abs(p - 0.5) * 1.2) * 0.2;
      });

      // 雾色 / 基色随幕
      const bg = new THREE.Color().setHSL(0.62, 0.25, 0.04 + p * 0.03);
      (scene.fog as THREE.FogExp2).color.copy(bg);
      key.color.setHSL(0.08, 0.4, 0.7 - p * 0.1);
    }

    function tick() {
      raf = requestAnimationFrame(tick);
      lastScroll += (scrollRef.current - lastScroll) * 0.08;
      applyProgress(lastScroll);
      dust.rotation.y += 0.0003;
      renderer.render(scene, camera);
    }
    tick();

    (host as any).__taixu = { setProgress: (v: number) => { scrollRef.current = v; } };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 滚动 → 进度
  useEffect(() => {
    const scroller = document.getElementById('taixu-scroll');
    if (!scroller) return;
    function onScroll() {
      const el = scroller!;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? el.scrollTop / max : 0;
      (hostRef.current as any)?.__taixu?.setProgress(p);
    }
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  const cur = ACTS[act];

  return (
    <div className="taixu">
      <div className="taixu-stage" ref={hostRef}>
        <div className="taixu-vignette" />
      </div>

      <div className="taixu-scroll" id="taixu-scroll">
        {/* 开场：随滚动自然划走 */}
        <section className="taixu-hero">
          <div className="taixu-hero-kicker">红楼梦 · 交互精读</div>
          <h1 className="taixu-hero-title">太虚幻境</h1>
          <p className="taixu-hero-sub">因空见色，由色生情，传情入色，自色悟空</p>
          <div className="taixu-hero-scroll">
            <span>缓缓下滑</span>
            <i />
          </div>
        </section>

        {ACTS.map((a, i) => (
          <section key={a.id} id={`act-${i}`} className={`taixu-act ${act === i ? 'on' : ''}`}>
            <div className="taixu-act-inner">
              <div className="taixu-kicker">{a.kicker}</div>
              <h2 className="taixu-title">{a.title}</h2>
              <div className="taixu-lines">
                {a.lines.map((l, j) => (
                  <p key={j}>{l}</p>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* 薄命司卷轴（第四幕内） */}
        <section className="taixu-act taixu-act-fate">
          <div className="taixu-act-inner wide">
            <div className="taixu-kicker">薄命司 · 金陵十二钗正册</div>
            <h2 className="taixu-title">命册</h2>
            <p className="taixu-hint">点击卷轴，展读判词</p>
            <div className="taixu-scrolls">
              {SCROLLS.map((s, i) => (
                <button
                  key={s.name}
                  className={`taixu-scroll-card ${openScroll === i ? 'open' : ''}`}
                  onClick={() => setOpenScroll(openScroll === i ? null : i)}
                >
                  <div className="taixu-scroll-name">{s.name}</div>
                  {openScroll === i && (
                    <div className="taixu-scroll-verse">
                      <p>{s.verse}</p>
                      <Link className="taixu-scroll-go" href={s.href} onClick={(e) => e.stopPropagation()}>
                        十二钗详解 →
                      </Link>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 尾声 */}
        <section className="taixu-act taixu-act-end">
          <div className="taixu-act-inner">
            <div className="taixu-kicker">尾声 · 归彼大荒</div>
            <h2 className="taixu-title">好一似食尽鸟投林</h2>
            <p className="taixu-quote">落了片白茫茫大地真干净。</p>
            <div className="taixu-cta">
              <Link className="btn accent" href="/read/5/">
                读第五回 · 游幻境
              </Link>
              <Link className="btn ghost" href="/star/">
                人物星图
              </Link>
              <Link className="btn ghost" href="/">
                回首页
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* 侧边幕次指示 */}
      <aside className="taixu-rail">
        {ACTS.map((a, i) => (
          <a key={a.id} className={`taixu-dot ${act === i ? 'on' : ''}`} href={`#act-${i}`} title={a.title}>
            <i />
            <span>{a.title}</span>
          </a>
        ))}
      </aside>

      <div className="taixu-caption">
        <span className="taixu-caption-kicker">{cur.kicker}</span>
        <span className="taixu-caption-title">{cur.title}</span>
      </div>
    </div>
  );
}
