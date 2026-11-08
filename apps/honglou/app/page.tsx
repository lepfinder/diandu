import Image from 'next/image';
import Link from '@/components/Link';
import { TopicCard } from '@classic/ui';
import { getBook, getChapterList } from '@/lib/book';

const TOPICS = [
  {
    href: '/star/',
    icon: '缘',
    title: '人物关系',
    desc: '三维星座中的贾府群芳。血缘、姻亲、情缘一图看清，拖回目轴看兴衰明灭。',
    image: '/images/graph-banner.webp',
  },
  {
    href: '/characters/',
    icon: '人',
    title: '人物百科',
    desc: '六十余位核心人物的身世、性格与命运，按府邸与身份分类速查。',
    image: '/images/characters.webp',
  },
  {
    href: '/topics/places/',
    icon: '鉴',
    title: '大观园图鉴',
    desc: '怡红院、潇湘馆、蘅芜苑……青春乌托邦的空间叙事。',
    image: '/images/garden-scroll.webp',
  },
  {
    href: '/topics/seasons/',
    icon: '时',
    title: '大观园四季',
    desc: '春晓、夏梦、秋水、冬雪——同一座园子里的时序与盛衰。',
    image: '/images/season-spring.webp',
  },
  {
    href: '/topics/twelve/',
    icon: '册',
    title: '金陵十二钗',
    desc: '太虚判词与红楼梦曲，十二种命册的解读。',
    image: '/images/chai-daiyu.webp',
  },
  {
    href: '/topics/posters/',
    icon: '影',
    title: '水墨海报',
    desc: '葬花词与石头记——黛玉、宝玉的竖幅水墨电影海报。',
    image: '/images/poster-daiyu.webp',
    objectPosition: '50% 18%',
  },
  {
    href: '/topics/poems/',
    icon: '诗',
    title: '诗词曲赋',
    desc: '葬花吟、芙蓉女儿诔、好了歌——命运的韵文体预告。',
    image: '/images/poem-hongdou.webp',
  },
  {
    href: '/topics/background/',
    icon: '史',
    title: '背景与红学',
    desc: '作者、版本、红学源流与核心意象，把书放回历史里读。',
    image: '/images/bg-author.webp',
  },
] as const;

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card">
            <Image src="/images/cover.webp" alt="红楼梦" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">中国古典长篇小说 · 交互精读</div>
              <h1>红楼梦</h1>
              <p className="lead">
                满纸荒唐言，一把辛酸泪。
                <br />
                都云作者痴，谁解其中味？
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/read/1/">开始精读</Link>
                <Link className="btn ghost" href="/star/">人物关系</Link>
                <Link className="btn ghost" href="/topics/twelve/">十二钗</Link>
              </div>
            </div>
          </div>
          <div className="side-stack">
            <div className="progress-card">
              <div className="label">
                <strong>全书概览</strong>
                <span>一百二十回 · 约 87 万字</span>
              </div>
              <div className="bar"><i style={{ width: '100%' }} /></div>
              <p style={{ margin: '14px 0 0', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.7, fontFamily: 'var(--serif)' }}>
                {book.meta.author}<br />
                {book.meta.edition}
              </p>
            </div>
            <Link className="mini-card" href={`/read/27/`}>
              <div className="t">名篇导读 · 第二十七回</div>
              <div className="d">滴翠亭杨妃戏彩蝶　埋香冢飞燕泣残红——葬花吟在此写成。</div>
              <div className="go">打开正文 →</div>
            </Link>
            <Link className="mini-card" href="/search/">
              <div className="t">全文检索</div>
              <div className="d">查一句、一个人、一处草蛇灰线。快捷键 <b>/</b></div>
              <div className="go">开始检索 →</div>
            </Link>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>专题导读</h1>
            <p className="sub">把人物、判词、诗词与版本拆开读，再回到正文——第二遍、第三遍会有完全不同的风景。</p>
          </div>
        </div>
        <section className="home-grid">
          {TOPICS.map((t) => (
            <TopicCard
              key={t.href}
              href={t.href}
              icon={t.icon}
              title={t.title}
              desc={t.desc}
              image={t.image}
              objectPosition={'objectPosition' in t ? t.objectPosition : undefined}
            />
          ))}
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>回目一览</h1>
            <p className="sub">一百二十回目录，点按即读。也可在阅读页用快捷键 <b>← →</b> 翻回。</p>
          </div>
          <Link className="btn ghost sm" href="/read/1/">从第一回开始</Link>
        </div>
        <section className="place-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {chapters.map((c) => (
            <Link key={c.n} href={`/read/${c.n}/`} className="place-card" style={{ padding: 16 }}>
              <div className="place-body">
                <div style={{ color: 'var(--accent)', fontSize: 12, letterSpacing: '0.08em' }}>{c.label}</div>
                <h3 style={{ fontSize: 15 }}>{c.t1}</h3>
                <p style={{ fontSize: 12 }}>{c.t2}</p>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
