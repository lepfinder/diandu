import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { getBook, getChapterList } from '@/lib/book';

const spotTitles = ['画壁', '画皮', '婴宁', '聂小倩', '促织', '席方平', '香玉', '黄英'];

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const byTitle = new Map(chapters.map((c) => [c.t1, c]));
  const chars = book.chapters.reduce((sum, chapter) => sum + chapter.paras.reduce((n, para) => n + para.length, 0), 0);
  const spots = spotTitles
    .map((title) => {
      const c = byTitle.get(title);
      if (!c) return null;
      return { n: c.n, title: c.t1, vol: c.t2, note: c.label };
    })
    .filter(Boolean) as { n: number; title: string; vol: string; note: string }[];
  const featured = byTitle.get('聂小倩') ?? chapters[0];

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <Image src="/cover.webp" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">中国古典文言短篇 · 交互精读</div>
              <h1>聊斋志异</h1>
              <p className="lead">
                才非干宝，雅爱搜神；情类黄州，喜人谈鬼。
                <br />
                狐鬼花妖之外，写的是人世冷暖。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">从第一篇读起</Link>
                <Link className="btn ghost" href="/topics/scenes/">名篇</Link>
              </div>
            </div>
          </div>
          <div className="side-stack">
            <div className="progress-card">
              <div className="label">
                <strong>全书概览</strong>
                <span>十二卷 · {book.meta.chapterCount || chapters.length} 篇 · 约 {Math.max(1, Math.round(chars / 10000))} 万字</span>
              </div>
              <div className="bar"><i style={{ width: '100%' }} /></div>
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
                <div className="d">{featured.t2}</div>
                <div className="go">打开正文 →</div>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">狐鬼花妖按品类看；名篇先读短述，再跳进正文。</p>
          </div>
        </div>
        <section className="home-grid">
          <TopicCard href="/topics/kinds/" icon="品" title="品类" desc="狐、鬼、花妖、仙道、人间。志异的世界先按类摸一遍。" image="/topics/topic-kinds.webp" />
          <TopicCard href="/topics/scenes/" icon="篇" title="名篇" desc="画皮、婴宁、聂小倩、促织、席方平……先读这些。" image="/topics/topic-scenes.webp" />
          <TopicCard href="/characters/" icon="人" title="人物" desc="四十二人。狐鬼花妖、异类仙道，和人间的孝女剑侠。" image="/topics/topic-characters.webp" />
        </section>

        {spots.length > 0 ? (
          <>
            <div className="section-head" style={{ marginTop: 48 }}>
              <div>
                <h1>从这里进去</h1>
                <p className="sub">先读这几篇，能摸到聊斋的气味。</p>
              </div>
            </div>
            <section className="home-grid">
              {spots.map((s) => (
                <Link key={s.n} className="topic-card" href={`/read/${s.n}/`}>
                  <div className="icon">{s.vol.replace('第', '').replace('卷', '')}</div>
                  <h3>{s.title}</h3>
                  <p>{s.note}</p>
                </Link>
              ))}
            </section>
          </>
        ) : null}

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>篇目一览</h1>
            <p className="sub">按卷排列。阅读页可用 ← → 翻篇，/ 打开检索。</p>
          </div>
          <Link className="btn ghost sm" href="/read/1/">从第一篇开始</Link>
        </div>
        <section className="chapter-grid">
          {chapters.map((c) => (
            <Link key={c.n} href={`/read/${c.n}/`} className="chapter-card">
              <div className="num">{c.t2}</div>
              <h3>{c.t1}</h3>
              <p>第 {c.n} 篇</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
