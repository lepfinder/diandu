import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { getBook, getChapterList } from '@/lib/book';

const spotNs = [2, 3, 16, 40, 83, 98, 107, 108];

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const byN = new Map(chapters.map((c) => [c.n, c]));
  const chars = book.chapters.reduce(
    (sum, chapter) => sum + chapter.paras.reduce((n, para) => n + para.length, 0),
    0,
  );
  const spots = spotNs.map((n) => byN.get(n)).filter(Boolean) as typeof chapters;
  const featured = byN.get(107) ?? chapters[0];

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <Image src="/cover.webp" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">中国古典历史演义 · 交互精读</div>
              <h1>东周列国志</h1>
              <p className="lead">
                平王东迁到秦并天下。
                <br />
                春秋争霸、战国兼并，一回一战，也可跳进江山舆图。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">
                  从第一回读起
                </Link>
                <Link className="btn ghost" href="/topics/scenes/">
                  名篇
                </Link>
              </div>
            </div>
          </div>
          <div className="side-stack">
            <div className="progress-card">
              <div className="label">
                <strong>全书概览</strong>
                <span>
                  一百零八回 · {book.meta.chapterCount || chapters.length} 回 · 约{' '}
                  {Math.max(1, Math.round(chars / 10000))} 万字
                </span>
              </div>
              <div className="bar">
                <i style={{ width: '100%' }} />
              </div>
              <p className="meta-note">
                {book.meta.author}
                <br />
                {book.meta.edition}
                <br />
                导出于 {book.meta.exported || '—'}
              </p>
            </div>
            {featured ? (
              <Link className="mini-card" href={`/read/${featured.n}/`}>
                <div className="t">名篇 · {featured.t1}</div>
                <div className="d">{featured.label}</div>
                <div className="go">打开正文 →</div>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">时代、名篇、成语出处与古今地名，并可跳江山舆图。</p>
          </div>
        </div>
        <section className="home-grid">
          <TopicCard
            href="/topics/eras/"
            icon="时"
            title="时代"
            desc="春秋五霸、战国七雄。先摸五百年大势。"
            image="/topics/topic-eras.webp"
          />
          <TopicCard
            href="/topics/scenes/"
            icon="篇"
            title="名篇"
            desc="烽火、城濮、长平、易水……事与地对照。"
            image="/topics/topic-scenes.webp"
          />
          <TopicCard
            href="/topics/idioms/"
            icon="语"
            title="成语出处"
            desc="烽火戏诸侯、退避三舍、完璧归赵……本事与回目。"
            image="/topics/topic-idioms.webp"
          />
          <TopicCard
            href="/topics/places/"
            icon="地"
            title="古今地名"
            desc="镐京、临淄、长平、咸阳……古称对今地。"
            image="/topics/topic-places.webp"
          />
          <TopicCard
            href="/characters/"
            icon="人"
            title="人物"
            desc="桓公管仲、重耳勾践、商鞅荆轲，到始皇一统。"
            image="/topics/topic-characters.webp"
          />
        </section>

        {spots.length > 0 ? (
          <>
            <div className="section-head" style={{ marginTop: 48 }}>
              <div>
                <h1>从这里进去</h1>
                <p className="sub">先读这几回，能摸到列国志的气口。</p>
              </div>
            </div>
            <section className="home-grid">
              {spots.map((s) => (
                <Link key={s.n} className="topic-card" href={`/read/${s.n}/`}>
                  <div className="icon">{s.n}</div>
                  <h3>{s.t1}</h3>
                  <p>{s.t2 || s.label}</p>
                </Link>
              ))}
            </section>
          </>
        ) : null}

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>回目一览</h1>
            <p className="sub">按回排列。阅读页可用 ← → 翻回，/ 打开检索。</p>
          </div>
          <Link className="btn ghost sm" href="/read/1/">
            从第一回开始
          </Link>
        </div>
        <section className="chapter-grid">
          {chapters.map((c) => (
            <Link key={c.n} href={`/read/${c.n}/`} className="chapter-card">
              <div className="num">{c.label}</div>
              <h3>{c.t1}</h3>
              <p>{c.t2 || '—'}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
