import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { getBook, getChapterList } from '@/lib/book';

const spots = [
  { n: 1, note: '词起，桃园结义，黄巾初起。' },
  { n: 5, note: '十八路诸侯，三英战吕布。' },
  { n: 21, note: '青梅煮酒，天下英雄使君与操。' },
  { n: 37, note: '南阳岗，三顾草庐。' },
  { n: 49, note: '七星坛祭风，赤壁一夜火。' },
  { n: 95, note: '街亭既失，空城抚琴。' },
];

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const byN = new Map(chapters.map((c) => [c.n, c]));

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <Image src="/cover.webp" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">中国古典长篇小说 · 交互精读</div>
              <h1>三国演义</h1>
              <p className="lead">
                滚滚长江东逝水，浪花淘尽英雄。
                <br />
                是非成败转头空。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">从第一回读起</Link>
                <Link className="btn ghost" href="/topics/map/">形势图</Link>
              </div>
            </div>
          </div>
          <div className="side-stack">
            <div className="progress-card">
              <div className="label">
                <strong>全书概览</strong>
                <span>一百二十回 · 约 {Math.round(book.chapters.reduce((s, c) => s + c.paras.reduce((a, p) => a + p.length, 0), 0) / 10000)} 万字</span>
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
            <Link className="mini-card" href="/read/49/">
              <div className="t">赤壁 · 第四十九回</div>
              <div className="d">{byN.get(49)?.t1}　{byN.get(49)?.t2}</div>
              <div className="go">打开正文 →</div>
            </Link>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">形势、大事、名场面、名篇、史实、兵器坐骑和人物，各自有入口。</p>
          </div>
        </div>
        <section className="home-grid">
          <TopicCard href="/topics/map/" icon="势" title="形势" desc="拖到第几回，底图上的势力跟着城池换色。右边是这一回谁据有哪座城。" image="/topics/topic-map.webp" />
          <TopicCard href="/topics/events/" icon="事" title="大事" desc="全书四幕：群雄、三分、蜀汉兴衰、归一。点节点跳回正文。" image="/topics/topic-events.webp" />
          <TopicCard href="/topics/scenes/" icon="戏" title="名场面" desc="从凤仪亭到五丈原。二十七场短述，各自链回正文。" image="/topics/topic-scenes.webp" />
          <TopicCard href="/topics/pieces/" icon="篇" title="名篇" desc="开篇词、短歌行、铜雀台赋、七步诗、前后《出师表》。原文照录，链回那一回。" image="/topics/topic-pieces.webp" />
          <TopicCard href="/topics/history/" icon="史" title="史实对照" desc="桃园、温酒、草船、赤壁、单刀、七擒、空城。演义一截，陈寿和裴注一截。" image="/topics/topic-history.webp" />
          <TopicCard href="/topics/relics/" icon="器" title="兵器坐骑" desc="青龙偃月、方天画戟、赤兔、的卢。各一段出处，链回相关回。" image="/topics/topic-relics.webp" />
          <TopicCard href="/characters/" icon="人" title="人物" desc="一百三十四人。蜀、魏、吴、群雄、汉室，点开再读行迹。" image="/topics/topic-characters.webp" />
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
                <div className="icon">{c.label.replace('第', '').replace('回', '').slice(0, 2)}</div>
                <h3>{c.t1}</h3>
                <p>{s.note}</p>
              </Link>
            );
          })}
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>回目一览</h1>
            <p className="sub">一百二十回目录。阅读页可用 ← → 翻回，/ 打开检索。</p>
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
