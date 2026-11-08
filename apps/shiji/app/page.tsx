import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { CORPUS_ORDER, getBook, getChapterList, kindLabel } from '@/lib/book';
import type { CorpusKind } from '@/lib/types';

const spotTitles = ['项羽本纪', '高祖本纪', '刺客列传', '淮阴侯列传', '陈涉世家', '太史公自序'];

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const byTitle = new Map(chapters.map((c) => [c.t1, c]));
  const chars = book.chapters.reduce(
    (sum, chapter) => sum + chapter.paras.reduce((n, para) => n + para.length, 0),
    0,
  );
  const spots = spotTitles
    .map((title) => {
      const c = byTitle.get(title);
      if (!c) return null;
      return { n: c.n, title: c.t1, kind: c.kind as CorpusKind, note: c.label };
    })
    .filter(Boolean) as { n: number; title: string; kind: CorpusKind; note: string }[];
  const featured = byTitle.get('项羽本纪') ?? chapters[0];

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <Image src="/cover.webp" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">中国史学 · 纪传体开山 · 交互精读</div>
              <h1>史记</h1>
              <p className="lead">
                究天人之际，通古今之变，成一家之言。
                <br />
                本纪世家列传之外，还可跳进江山舆图看当时版图。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">
                  从五帝本纪读起
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
                  五体 · {book.meta.chapterCount || chapters.length} 篇 · 约{' '}
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
                <div className="d">{featured.t2}</div>
                <div className="go">打开正文 →</div>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">按五体摸结构；名篇带舆图外链，对照江山时序。</p>
          </div>
        </div>
        <section className="home-grid">
          <TopicCard href="/topics/corpus/" icon="体" title="五体" desc="本纪、表、书、世家、列传。先看太史公怎么给天下分卷。" image="/topics/topic-corpus.webp" />
          <TopicCard href="/topics/scenes/" icon="篇" title="名篇" desc="钜鹿、鸿门、垓下、易水、井陉……事与地一并打开。" image="/topics/topic-scenes.webp" />
          <TopicCard href="/characters/" icon="人" title="人物" desc="帝王将相与刺客游侠。人物页可直达江山行迹。" image="/topics/topic-characters.webp" />
        </section>

        {spots.length > 0 ? (
          <>
            <div className="section-head" style={{ marginTop: 48 }}>
              <div>
                <h1>从这里进去</h1>
                <p className="sub">先读这几篇，能摸到史记的气口。</p>
              </div>
            </div>
            <section className="home-grid">
              {spots.map((s) => (
                <Link key={s.n} className="topic-card" href={`/read/${s.n}/`}>
                  <div className="icon">{kindLabel(s.kind).slice(0, 1)}</div>
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
            <p className="sub">按五体排列。阅读页可用 ← → 翻篇，/ 打开检索。</p>
          </div>
          <Link className="btn ghost sm" href="/read/1/">
            从第一篇开始
          </Link>
        </div>
        {CORPUS_ORDER.map((kind) => {
          const list = chapters.filter((c) => c.kind === kind);
          if (!list.length) return null;
          return (
            <section key={kind} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 600, margin: '0 0 12px' }}>
                {kindLabel(kind)}
              </h2>
              <div className="chapter-grid">
                {list.map((c) => (
                  <Link key={c.n} href={`/read/${c.n}/`} className="chapter-card">
                    <div className="num">{c.t2}</div>
                    <h3>{c.t1}</h3>
                    <p>第 {c.n} 篇</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
