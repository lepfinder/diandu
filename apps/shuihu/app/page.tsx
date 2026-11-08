import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { getBook, getChapterList } from '@/lib/book';
import { getTopics } from '@/lib/topics';

const spots = [
  { n: 1, note: '龙虎山伏魔殿，走了魔君。' },
  { n: 3, note: '渭州桥下，三拳打死镇关西。' },
  { n: 7, note: '倒拔垂杨柳，又误入白虎堂。' },
  { n: 10, note: '草料场一夜雪，山神庙里杀陆谦。' },
  { n: 16, note: '黄泥冈上，生辰纲被药酒麻翻。' },
  { n: 23, note: '景阳冈，哨棒打折，赤手打虎。' },
  { n: 31, note: '从飞云浦杀回，血溅鸳鸯楼。' },
  { n: 71, note: '石碣落下，一百单八人排了座次。' },
];

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const byN = new Map(chapters.map((c) => [c.n, c]));
  const chars = book.chapters.reduce((sum, chapter) => sum + chapter.paras.reduce((n, para) => n + para.length, 0), 0);
  const sceneCount = getTopics().scenes.length;

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <Image src="/cover.webp" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">中国古典长篇小说 · 交互精读</div>
              <h1>水浒传</h1>
              <p className="lead">
                试看书林隐处，几多俊逸儒流。
                <br />
                水泊一百单八人，从引首看到蓼儿洼。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/0/">从引首读起</Link>
                <Link className="btn ghost" href="/topics/seats/">座次</Link>
              </div>
            </div>
          </div>
          <div className="side-stack">
            <div className="progress-card">
              <div className="label">
                <strong>全书概览</strong>
                <span>引首加一百二十回 · 约 {Math.round(chars / 10000)} 万字</span>
              </div>
              <div className="bar"><i style={{ width: '100%' }} /></div>
              <p className="meta-note">
                {book.meta.author}
                <br />
                {book.meta.edition}
                <br />
                导出于 {book.meta.exported}
              </p>
            </div>
            <Link className="mini-card" href="/read/16/">
              <div className="t">名篇 · 第十六回</div>
              <div className="d">{byN.get(16)?.t1}　{byN.get(16)?.t2}</div>
              <div className="go">打开正文 →</div>
            </Link>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">座次按石碣。聚义跟着回目走。名场面先写短述，链回那一回。</p>
          </div>
        </div>
        <section className="home-grid">
          <TopicCard href="/topics/seats/" icon="座" title="座次" desc="三十六天罡，七十二地煞。拖到第几回，已经写到的人就亮。" image="/topics/topic-seats.webp" />
          <TopicCard href="/topics/path/" icon="聚" title="聚义" desc="从龙虎山到蓼儿洼。二十二站，按书里的次序，不是地图。" image="/topics/topic-path.webp" />
          <TopicCard href="/topics/scenes/" icon="戏" title="名场面" desc={`从误走妖魔、镇关西、生辰纲，到招安和蓼儿洼。${sceneCount} 场短述。`} image="/topics/topic-scenes.webp" />
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>从这里进去</h1>
            <p className="sub">先读这几回，能摸到上山以前的骨架。</p>
          </div>
        </div>
        <section className="home-grid">
          {spots.map((spot) => {
            const chapter = byN.get(spot.n);
            if (!chapter) return null;
            return (
              <Link key={spot.n} className="topic-card" href={`/read/${spot.n}/`}>
                <div className="icon">{spot.n}</div>
                <h3>{chapter.t1}</h3>
                <p>{spot.note}</p>
              </Link>
            );
          })}
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>回目一览</h1>
            <p className="sub">引首和一百二十回。阅读页可用 ← → 翻回，/ 打开检索。</p>
          </div>
          <Link className="btn ghost sm" href="/read/0/">从引首开始</Link>
        </div>
        <section className="chapter-grid">
          {chapters.map((chapter) => (
            <Link key={chapter.n} href={`/read/${chapter.n}/`} className="chapter-card">
              <div className="num">{chapter.label}</div>
              <h3>{chapter.t1}</h3>
              <p>{chapter.t2}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
