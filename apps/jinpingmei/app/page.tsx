import Link from '@/components/Link';
import { getBook, getChapterList } from '@/lib/book';

const spots = [
  { n: 1, note: '十兄弟结拜，武松打虎，潘金莲已在帘内。' },
  { n: 27, note: '翡翠轩私语，葡萄架一闹。' },
  { n: 62, note: '李瓶儿病死，西门庆大哭。' },
  { n: 79, note: '西门庆纵欲身亡，吴月娘生下孝哥。' },
  { n: 100, note: '普静幻度孝哥，西门一家的收场。' },
];

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const byN = new Map(chapters.map((c) => [c.n, c]));
  const chars = book.chapters.reduce((s, c) => s + c.paras.reduce((a, p) => a + p.length, 0), 0);

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <div className="hero-content">
              <div className="hero-kicker">中国古典长篇小说 · 交互精读</div>
              <h1>金瓶梅</h1>
              <p className="lead">
                读《金瓶梅》而生怜悯心者，菩萨也。
                <br />
                生畏惧心者，君子也。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">从第一回读起</Link>
                <Link className="btn ghost" href="/topics/timeline/">回目年表</Link>
              </div>
            </div>
          </div>
          <div className="side-stack">
            <div className="progress-card">
              <div className="label">
                <strong>全书概览</strong>
                <span>一百回 · 约 {Math.round(chars / 10000)} 万字</span>
              </div>
              <div className="bar"><i style={{ width: '100%' }} /></div>
              <p className="meta-note">
                {book.meta.author}
                <br />
                {book.meta.edition}
                <br />
                导出于 {book.meta.exported}
                <br />
                原文照录，含直白的情欲描写。
              </p>
            </div>
            <Link className="mini-card" href="/read/27/">
              <div className="t">葡萄架 · 第二十七回</div>
              <div className="d">{byN.get(27)?.t1}　{byN.get(27)?.t2}</div>
              <div className="go">打开正文 →</div>
            </Link>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">年表、府内、名场面之外，还有名篇、物产、版本和市井官场。</p>
          </div>
        </div>
        <section className="home-grid">
          <Link className="topic-card" href="/topics/timeline/">
            <div className="icon">年</div>
            <h3>年表</h3>
            <p>四幕推进。从清河开场到普静幻度。</p>
          </Link>
          <Link className="topic-card" href="/topics/house/">
            <div className="icon">府</div>
            <h3>府内</h3>
            <p>六房、女婿、结义兄弟和几条外宅。</p>
          </Link>
          <Link className="topic-card" href="/topics/scenes/">
            <div className="icon">戏</div>
            <h3>名场面</h3>
            <p>从热结十兄弟到幻度孝哥，一眼能认出来的那几场。</p>
          </Link>
          <Link className="topic-card" href="/topics/pieces/">
            <div className="icon">篇</div>
            <h3>名篇</h3>
            <p>开卷诗到收束联，配宋风图。</p>
          </Link>
          <Link className="topic-card" href="/topics/goods/">
            <div className="icon">物</div>
            <h3>物产</h3>
            <p>四十九件器物静物图，衣料吃食玩物都有。</p>
          </Link>
          <Link className="topic-card" href="/topics/editions/">
            <div className="icon">本</div>
            <h3>版本</h3>
            <p>词话、崇祯、张评三大系统。本站用崇祯本。</p>
          </Link>
          <Link className="topic-card" href="/topics/market/">
            <div className="icon">市</div>
            <h3>市井官场</h3>
            <p>铺面、提刑、蔡京门路、丽春院。</p>
          </Link>
          <Link className="topic-card" href="/characters/">
            <div className="icon">人</div>
            <h3>人物</h3>
            <p>西门府内外主线。点开看登场与写到。</p>
          </Link>
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>从这里进去</h1>
            <p className="sub">先读这几回，能摸到全书的骨架。</p>
          </div>
        </div>
        <section className="home-grid">
          {spots.map((s) => {
            const c = byN.get(s.n);
            if (!c) return null;
            return (
              <Link key={s.n} className="topic-card" href={`/read/${s.n}/`}>
                <div className="icon">{String(c.n)}</div>
                <h3>{c.t1}</h3>
                <p>{s.note}</p>
              </Link>
            );
          })}
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>回目一览</h1>
            <p className="sub">一百回目录。阅读页可用 ← → 翻回，/ 打开检索。</p>
          </div>
          <Link className="btn ghost sm" href="/read/1/">从第一回开始</Link>
        </div>
        <section className="chapter-grid">
          {chapters.map((c) => (
            <Link key={c.n} href={`/read/${c.n}/`} className="chapter-card">
              <div className="num">{c.label}</div>
              <h3>{c.t1}</h3>
              <p>{c.t2}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
