import Link from '@/components/Link';
import { getTopics, PLACE_IMAGES, TWELVE_IMAGES, BG_IMAGES, TL_ACTS, actForChapter } from '@/lib/content';
import { TwelveRegisters } from '@/components/TwelveRegisters';
import { PoemsBoard } from '@/components/PoemsBoard';
import { GardenScroll } from '@/components/GardenScroll';
import { QuList } from '@/components/QuList';
import { GlossaryBoard } from '@/components/GlossaryBoard';
import { Music87Board } from '@/components/Music87Board';
import { FoodBoard } from '@/components/FoodBoard';
import food from '@/data/food.json';
import music87 from '@/data/music87.json';
import glossary from '@/data/glossary.json';
import { toCN } from '@/lib/cn';
import { asset } from '@classic/ui';

const tabs = [
  { id: 'places', name: '大观园' },
  { id: 'twelve', name: '十二钗' },
  { id: 'qu', name: '红楼曲' },
  { id: 'music', name: '87版歌曲' },
  { id: 'poems', name: '诗词' },
  { id: 'background', name: '红学背景' },
  { id: 'timeline', name: '情节年表' },
  { id: 'food', name: '饮食' },
  { id: 'glossary', name: '术语' },
];

export function generateStaticParams() {
  return tabs.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = tabs.find((x) => x.id === slug);
  return { title: t ? t.name : '专题' };
}

export default async function TopicsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const T = getTopics();
  const title = tabs.find((t) => t.id === slug)?.name || '专题';

  let body: React.ReactNode = null;

  if (slug === 'places') {
    body = (
      <>
        <p className="sub" style={{ margin: '-10px 0 18px', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>{T.places.intro}</p>
        <GardenScroll />
        <div className="place-grid">
          {T.places.items.map((p) => (
            <article key={p.id} className="place-card">
              <div className="place-img" data-label={p.name.replace(/ /g, '')}>
                {PLACE_IMAGES[p.id] ? (
                  <img
                    src={asset(PLACE_IMAGES[p.id])}
                    alt={p.name}
                    width={640}
                    height={360}
                    loading="eager"
                    decoding="async"
                  />
                ) : null}
              </div>
              <div className="place-body">
                <h3>{p.name}</h3>
                <div className="host">{p.host}</div>
                <p>{p.desc}</p>
                <div className="tags">{(p.tags || []).map((t) => <span key={t} className="pill">{t}</span>)}</div>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  } else if (slug === 'twelve') {
    const fu = (T.twelve as any).fuCe as typeof T.twelve.items;
    const fuIntro = (T.twelve as any).fuCeIntro as string;
    const youFu = (T.twelve as any).youFuCe as typeof T.twelve.items;
    const youFuIntro = (T.twelve as any).youFuCeIntro as string;
    body = (
      <TwelveRegisters
        zheng={T.twelve.items}
        fu={fu || []}
        youFu={youFu || []}
        intro={T.twelve.intro}
        fuIntro={fuIntro || ''}
        youFuIntro={youFuIntro || ''}
      />
    );
  } else if (slug === 'qu') {
    const qu = T.qu;
    body = qu ? <QuList items={qu.items} intro={qu.intro} /> : <div className="empty">暂无红楼曲</div>;
  } else if (slug === 'music') {
    body = (
      <Music87Board
        tracks={(music87 as any).tracks}
        intro={(music87 as any).intro}
        album={(music87 as any).album}
      />
    );
  } else if (slug === 'poems') {
    body = (
      <PoemsBoard
        featured={T.poems.items}
        full={T.poems.full || []}
        intro={T.poems.intro}
      />
    );
  } else if (slug === 'background') {
    body = (
      <>
        <div className="topic-hero" data-label="太虚幻境">
          <img src={asset("/images/taixu.webp")} alt="太虚幻境" width={1536} height={520} loading="eager" decoding="async" />
          <div className="topic-hero-cap">因空见色，由色生情，传情入色，自色悟空</div>
        </div>
        <p className="sub" style={{ margin: '0 0 22px', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>{T.background.intro}</p>
        <div className="essay-list">
          {T.background.essays.map((e) => (
            <article key={e.id} className="essay-card has-img">
              {BG_IMAGES[e.id] ? (
                <div className="essay-img" data-label={e.title}>
                  <img src={asset(BG_IMAGES[e.id])} alt={e.title} width={1200} height={420} loading="eager" decoding="async" />
                </div>
              ) : null}
              <div className="essay-body" style={{ padding: 20 }}>
                <h3>{e.title}</h3>
                <div className="body">{e.body.map((p, i) => <p key={i}>{p}</p>)}</div>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  } else if (slug === 'food') {
    body = <FoodBoard items={(food as any).items} intro={(food as any).intro} />;
  } else if (slug === 'glossary') {
    body = (
      <GlossaryBoard
        items={(glossary as any).items}
        intro={(glossary as any).intro}
      />
    );
  } else if (slug === 'timeline') {
    const acts = TL_ACTS;
    body = (
      <>
        <p className="sub" style={{ margin: '-10px 0 22px', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
          全书分五幕推进，从神话缘起到归结红楼梦。点击节点可跳到对应回目。
        </p>
        {acts.map((act) => {
          const items = T.timeline.filter((t) => t.ch >= act.range[0] && t.ch <= act.range[1]);
          return (
            <section key={act.id} className="tl-act">
              <div className="tl-act-head">
                <div className="tl-act-img" data-label={act.title}>
                  <img src={asset(act.image)} alt={act.title} width={1200} height={360} loading="eager" decoding="async" />
                </div>
                <div className="tl-act-meta">
                  <h2>{act.title}</h2>
                  <p>第{toCN(act.range[0])}回 — 第{toCN(act.range[1])}回</p>
                  <p className="blurb">{act.blurb}</p>
                </div>
              </div>
              <div className="timeline">
                {items.map((t) => (
                  <Link key={t.ch + t.label} href={`/read/${t.ch}/`} className="tl-item">
                    <div className="ch">第{toCN(t.ch)}回 · {actForChapter(t.ch).id === act.id ? act.title.split('·')[0].trim() : ''}</div>
                    <h3>{t.label}</h3>
                    <p>{t.desc}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </>
    );
  }

  return (
    <div className="page-scroll">
      <div className="page">
        <div className="section-head">
          <div>
            <h1>专题 · {title}</h1>
            <p className="sub">人物关系之外的深度资料——空间、命册、诗词与版本源流。</p>
          </div>
        </div>
        <div className="topic-tabs filters">
          {tabs.map((t) => (
            <Link key={t.id} href={`/topics/${t.id}/`} className={`chip ${slug === t.id ? 'active' : ''}`}>{t.name}</Link>
          ))}
        </div>
        {body}
      </div>
    </div>
  );
}
