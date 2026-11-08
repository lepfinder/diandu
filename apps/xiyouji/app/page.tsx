import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { getBook, getChapterList } from '@/lib/book';
import { getTopics } from '@/lib/topics';

const spots = [
  { n: 1, note: '花果山，石猴出世。' },
  { n: 7, note: '五行山下，心猿先定住。' },
  { n: 14, note: '揭了压帖，紧箍也戴上。' },
  { n: 27, note: '白虎岭，三打白骨精。' },
  { n: 58, note: '两个悟空，打到灵山才分开。' },
  { n: 59, note: '火焰山，第一借芭蕉扇。' },
  { n: 74, note: '狮驼岭，三魔设关。' },
  { n: 98, note: '灵山见如来，真经在这一回。' },
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
              <h1>西游记</h1>
              <p className="lead">
                欲知造化会元功，须看西游释厄传。
                <br />
                一程走到灵山，才算取到真经。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">从第一回读起</Link>
                <Link className="btn ghost" href="/topics/route/">西行图</Link>
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
              </p>
            </div>
            <Link className="mini-card" href="/read/27/">
              <div className="t">名篇 · 第二十七回</div>
              <div className="d">{byN.get(27)?.t1}　{byN.get(27)?.t2}</div>
              <div className="go">打开正文 →</div>
            </Link>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">西行跟着回目走。名场面与器物先写短述，链回那一回。</p>
          </div>
        </div>
        <section className="home-grid">
          <TopicCard href="/topics/route/" icon="途" title="西行" desc="十八站。拖到第几回，就看到取经人走到哪一站。" image="/topics/topic-route.webp" />
          <TopicCard href="/topics/scenes/" icon="戏" title="名场面" desc={`从龙宫借宝、白骨精、车迟国到狮驼岭。${sceneCount} 场短述，各链回那一回。`} image="/topics/topic-scenes.webp" />
          <TopicCard href="/topics/relics/" icon="器" title="器物" desc="金箍棒、紧箍、芭蕉扇、人参果。十二件叫得响的兵器法宝，各链回出处。" image="/topics/topic-relics.webp" />
          <TopicCard href="/characters/" icon="人" title="人物" desc="取经五口之外，天庭、佛门、妖魔和人间按书里有名有事的人补过。五十五人。" image="/topics/topic-characters.webp" />
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>从这里进去</h1>
            <p className="sub">先读这几回，能摸到全书的骨架。</p>
          </div>
        </div>
        <section className="home-grid">
          {spots.map((spot) => {
            const chapter = byN.get(spot.n);
            if (!chapter) return null;
            return (
              <Link key={spot.n} className="topic-card" href={`/read/${spot.n}/`}>
                <div className="icon">{chapter.label.replace('第', '').replace('回', '').slice(0, 2)}</div>
                <h3>{chapter.t1}</h3>
                <p>{spot.note}</p>
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
