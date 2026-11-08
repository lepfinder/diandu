import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { getBook, getChapterList } from '@/lib/book';
import { getPeople } from '@/lib/characters';
import { getTopics } from '@/lib/topics';

const spots = [
  { n: 1, note: '女娲宫进香，灭商之劫起笔。' },
  { n: 12, note: '陈塘关，哪吒出世。' },
  { n: 14, note: '莲花化身，先行官成形。' },
  { n: 24, note: '渭水聘贤，子牙归周。' },
  { n: 45, note: '十绝阵，金仙轮番破阵。' },
  { n: 50, note: '黄河阵，三霄困住十二金仙。' },
  { n: 82, note: '万仙阵，截教精锐折在此。' },
  { n: 99, note: '封神台，按榜封神。' },
];

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const byN = new Map(chapters.map((c) => [c.n, c]));
  const chars = book.chapters.reduce((sum, chapter) => sum + chapter.paras.reduce((n, para) => n + para.length, 0), 0);
  const sceneCount = getTopics().scenes.length;
  const peopleCount = getPeople().length;

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <Image src="/cover.webp" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">中国古典长篇小说 · 交互精读</div>
              <h1>封神演义</h1>
              <p className="lead">
                商周易位，斩将封神。
                <br />
                子牙下山，一榜定千秋。
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">从第一回读起</Link>
                <Link className="btn ghost" href="/topics/route/">伐纣征途</Link>
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
            <Link className="mini-card" href="/read/12/">
              <div className="t">名篇 · 第十二回</div>
              <div className="d">{byN.get(12)?.t1 || '陈塘关哪吒出世'}</div>
              <div className="go">打开正文 →</div>
            </Link>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题</h1>
            <p className="sub">跟着回目走伐纣路。名场面与法宝先写短述，链回那一回。</p>
          </div>
        </div>
        <section className="home-grid">
          <TopicCard href="/topics/route/" icon="途" title="征途" desc="十六站。拖到第几回，就看到伐纣走到哪一站。" image="/topics/topic-route.webp" />
          <TopicCard href="/topics/scenes/" icon="戏" title="名场面" desc={`女娲进香、哪吒出世、十绝阵、万仙阵。${sceneCount} 场短述，各链回那一回。`} image="/topics/topic-scenes.webp" />
          <TopicCard href="/topics/relics/" icon="宝" title="法宝" desc="封神榜、乾坤圈、打神鞭、诛仙四剑。十二件叫得响的兵器法宝。" image="/topics/topic-relics.webp" />
          <TopicCard href="/characters/" icon="人" title="人物" desc={`西岐、朝歌、阐教、截教、仙佛。${peopleCount} 人，点开看登场与行迹。`} image="/topics/topic-characters.webp" />
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
