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
  { id: 'seasons', name: '四季图' },
  { id: 'twelve', name: '十二钗' },
  { id: 'posters', name: '水墨海报' },
  { id: 'qu', name: '红楼曲' },
  { id: 'music', name: '87版歌曲' },
  { id: 'poems', name: '诗词' },
  { id: 'background', name: '红学背景' },
  { id: 'timeline', name: '情节年表' },
  { id: 'food', name: '饮食' },
  { id: 'glossary', name: '术语' },
];

const SEASONS = [
  {
    id: 'spring',
    name: '春 · 大观春晓',
    image: '/images/season-spring.webp',
    verse: '绕堤柳借三篙翠，隔岸花分一脉香。',
    desc: '春水初生，柳堤花岸。大观园在元春省亲后的第一场春光里，盛开如一场尚未醒来的梦。',
  },
  {
    id: 'summer',
    name: '夏 · 芍药遗梦',
    image: '/images/season-summer.webp',
    verse: '柳堤之上，富贵繁华，到头一梦。',
    desc: '荷香满池，湘云醉卧芍药裀。盛夏是园中最热闹也最易忘忧的时节，繁华正浓。',
  },
  {
    id: 'autumn',
    name: '秋 · 大观秋水',
    image: '/images/season-autumn.webp',
    verse: '寒塘渡鹤影，冷月葬花魂。',
    desc: '中秋夜，凹晶溪馆联诗。秋水映月，鹤影掠塘——盛极将衰的清声，在此写成。',
  },
  {
    id: 'winter',
    name: '冬 · 大观冬雪',
    image: '/images/season-winter.webp',
    verse: '落了片白茫茫大地真干净。',
    desc: '琉璃世界白雪红梅。冬雪洗净繁华，也预示全书终局的空茫。',
  },
] as const;

const POSTERS = [
  {
    id: 'daiyu',
    name: '林黛玉 · 葬花词',
    image: '/images/poster-daiyu.webp',
    verse: '一朝春尽红颜老，花落人亡两不知。',
    desc: '水墨电影海报。葬花一幕，是黛玉还泪与全书诗心的汇合点。',
    href: '/read/27/',
  },
  {
    id: 'baoyu',
    name: '贾宝玉 · 石头记',
    image: '/images/poster-baoyu.webp',
    verse: '假作真时真亦假，无为有处有还无。',
    desc: '水墨电影海报。通灵宝玉入世，真假有无的开篇总纲。',
    href: '/read/1/',
  },
] as const;

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
  } else if (slug === 'seasons') {
    body = (
      <>
        <p className="sub" style={{ margin: '-10px 0 18px', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
          大观园四季全景：春晓、夏梦、秋水、冬雪。同一座园子，在时序里看见繁华与空茫。
        </p>
        <div className="season-list">
          {SEASONS.map((s) => (
            <article key={s.id} className="season-card">
              <div className="season-img" data-label={s.name}>
                <img src={asset(s.image)} alt={s.name} width={2016} height={864} loading="eager" decoding="async" />
              </div>
              <div className="season-body">
                <h3>{s.name}</h3>
                <p className="season-verse">{s.verse}</p>
                <p>{s.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  } else if (slug === 'posters') {
    body = (
      <>
        <p className="sub" style={{ margin: '-10px 0 18px', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
          水墨电影海报两帧：黛玉葬花、宝玉石头记。竖幅构图，点开可跳到对应回目。
        </p>
        <div className="poster-grid">
          {POSTERS.map((p) => (
            <Link key={p.id} href={p.href} className="poster-card">
              <div className="poster-img" data-label={p.name}>
                <img src={asset(p.image)} alt={p.name} width={1152} height={2048} loading="eager" decoding="async" />
              </div>
              <div className="poster-body">
                <h3>{p.name}</h3>
                <p className="season-verse">{p.verse}</p>
                <p>{p.desc}</p>
                <span className="go">打开正文 →</span>
              </div>
            </Link>
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
          <img src={asset("/images/taixu.webp")} alt="太虚幻境" width={1280} height={720} loading="eager" decoding="async" />
          <div className="topic-hero-cap">因空见色，由色生情，传情入色，自色悟空</div>
        </div>
        <p className="sub" style={{ margin: '0 0 22px', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>{T.background.intro}</p>
        <div className="essay-list">
          {T.background.essays.map((e) => {
            const textLen = (e.body || []).reduce((n, p) => n + p.length, 0);
            const isLong = textLen >= 320;
            return (
              <article key={e.id} className={`essay-card has-img${isLong ? ' is-long' : ''}`}>
                {BG_IMAGES[e.id] ? (
                  <div className="essay-img" data-label={e.title}>
                    <img
                      src={asset(BG_IMAGES[e.id])}
                      alt={e.title}
                      width={isLong ? 1280 : 960}
                      height={isLong ? 720 : 720}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                ) : null}
                <div className="essay-body">
                  <h3>{e.title}</h3>
                  <div className="body">{e.body.map((p, i) => <p key={i}>{p}</p>)}</div>
                </div>
              </article>
            );
          })}
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
