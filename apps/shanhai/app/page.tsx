import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { getBook, getChapterList } from '@/lib/book';
import { getPeople } from '@/lib/characters';
import { getTopics } from '@/lib/topics';

const spots = [
  { n: 1, note: '南山经起笔，招摇之山与狌狌。' },
  { n: 2, note: '西山经，西王母与昆仑一线。' },
  { n: 3, note: '北山经，精卫填海。' },
  { n: 7, note: '海外西经，刑天舞干戚。' },
  { n: 8, note: '海外北经，夸父逐日。' },
  { n: 11, note: '海内西经，帝之下都。' },
  { n: 16, note: '大荒西经，烛龙与女娲之肠。' },
  { n: 18, note: '海内经，黄帝、鲧禹收束。' },
];

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const byN = new Map(chapters.map((c) => [c.n, c]));
  const chars = book.chapters.reduce(
    (sum, chapter) => sum + chapter.paras.reduce((n, para) => n + para.length, 0),
    0,
  );
  const sceneCount = getTopics().scenes.length;
  const regionCount = getTopics().regions.length;
  const peopleCount = getPeople().length;
  const featured = byN.get(3) ?? chapters[0];

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <Image src="/cover.webp" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">先秦神话地理 · 交互图鉴</div>
              <h1>山海经</h1>
              <p className="lead">
                山经记陆，海经记荒。
                <br />
                按方位读，按异兽记。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">从南山经读起</Link>
                <Link className="btn ghost" href="/topics/regions/">方位图鉴</Link>
              </div>
            </div>
          </div>
          <div className="side-stack">
            <div className="progress-card">
              <div className="label">
                <strong>全书概览</strong>
                <span>十八篇 · 约 {Math.max(1, Math.round(chars / 10000))} 万字</span>
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
            {featured ? (
              <Link className="mini-card" href={`/read/${featured.n}/`}>
                <div className="t">名物 · {featured.t1}</div>
                <div className="d">精卫填海，写在北山经。</div>
                <div className="go">打开正文 →</div>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">先按山经海经摸方位，再进异兽图鉴与名物短述。</p>
          </div>
        </div>
        <section className="home-grid">
          <TopicCard
            href="/topics/regions/"
            icon="方"
            title="方位"
            desc={`${regionCount} 篇。南山到海内，山经五、海经十三，按方向打开。`}
            image="/topics/topic-regions.webp"
          />
          <TopicCard
            href="/topics/scenes/"
            icon="物"
            title="名物"
            desc={`精卫、夸父、刑天、西王母、烛龙。${sceneCount} 条短述，各链回那一篇。`}
            image="/topics/topic-scenes.webp"
          />
          <TopicCard
            href="/characters/"
            icon="鉴"
            title="图鉴"
            desc={`异兽、奇鸟、神祇、海外国、帝裔。${peopleCount} 条，点开看出处。`}
            image="/topics/topic-characters.webp"
          />
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>从这里进去</h1>
            <p className="sub">先读这几篇，能摸到山海经的骨架。</p>
          </div>
        </div>
        <section className="home-grid">
          {spots.map((spot) => {
            const chapter = byN.get(spot.n);
            if (!chapter) return null;
            return (
              <Link key={spot.n} className="topic-card" href={`/read/${spot.n}/`}>
                <div className="icon">{chapter.t2?.slice(0, 1) || String(spot.n)}</div>
                <h3>{chapter.t1}</h3>
                <p>{spot.note}</p>
              </Link>
            );
          })}
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>篇目一览</h1>
            <p className="sub">十八篇目录。阅读页可用 ← → 翻篇，/ 打开检索。</p>
          </div>
          <Link className="btn ghost sm" href="/read/1/">从南山经开始</Link>
        </div>
        <section className="chapter-grid">
          {chapters.map((chapter) => (
            <Link key={chapter.n} href={`/read/${chapter.n}/`} className="chapter-card">
              <div className="num">{chapter.t2} · 第 {chapter.n} 篇</div>
              <h3>{chapter.t1}</h3>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
