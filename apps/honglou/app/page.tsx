import Image from 'next/image';
import Link from '@/components/Link';
import { getBook, getChapterList } from '@/lib/book';
import { toCN } from '@/lib/cn';

export default function HomePage() {
  const book = getBook();
  const chapters = getChapterList();
  const pct = 1;

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
                <Link className="btn accent" href="/taixu/">太虚幻境 · 入梦</Link>
                <Link className="btn ghost" href="/zanghua/">葬花吟</Link>
                <Link className="btn ghost" href="/star/">人物关系</Link>
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
            <p className="sub">把人物、园林、判词与版本拆开读，再回到正文——第二遍、第三遍会有完全不同的风景。</p>
          </div>
        </div>
        <section className="home-grid">
          <Link className="topic-card has-img" href="/taixu/">
            <Image src="/images/taixu.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">梦</div>
            <h3>太虚幻境</h3>
            <p>滚动叙事门面：顽石、点化、太虚、薄命司十二册。</p>
          </Link>
          <Link className="topic-card has-img" href="/zanghua/">
            <Image src="/images/poem-zanghua.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">花</div>
            <h3>葬花吟</h3>
            <p>落花粒子场，六幕诗句随风飘散，末句归于花冢。</p>
          </Link>
          <Link className="topic-card has-img" href="/star/">
            <Image src="/images/graph-banner.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">缘</div>
            <h3>人物关系</h3>
            <p>三维星座中的贾府群芳。血缘、姻亲、情缘一图看清，拖回目轴看兴衰明灭。</p>
          </Link>
          <Link className="topic-card has-img" href="/garden/">
            <Image src="/images/place-yihong.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">园</div>
            <h3>三维园林</h3>
            <p>大观园微缩沙盘：沁芳溪、怡红院、潇湘馆……五幕气候可切换。</p>
          </Link>
          <Link className="topic-card has-img" href="/characters/">
            <Image src="/images/place-xiaoxiang.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">人</div>
            <h3>人物百科</h3>
            <p>六十余位核心人物的身世、性格与命运，按府邸与身份分类速查。</p>
          </Link>
          <Link className="topic-card has-img" href="/topics/places/">
            <Image src="/images/place-hengwu.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">鉴</div>
            <h3>大观园图鉴</h3>
            <p>怡红院、潇湘馆、蘅芜苑……青春乌托邦的空间叙事。</p>
          </Link>
          <Link className="topic-card has-img" href="/topics/twelve/">
            <Image src="/images/chai-daiyu.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">册</div>
            <h3>金陵十二钗</h3>
            <p>太虚判词与红楼梦曲，十二种命册的解读。</p>
          </Link>
          <Link className="topic-card has-img" href="/topics/poems/">
            <Image src="/images/poem-hongdou.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">诗</div>
            <h3>诗词曲赋</h3>
            <p>葬花吟、芙蓉女儿诔、好了歌——命运的韵文体预告。</p>
          </Link>
          <Link className="topic-card has-img" href="/topics/background/">
            <Image src="/images/bg-author.webp" alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            <div className="icon">史</div>
            <h3>背景与红学</h3>
            <p>作者、版本、红学源流与核心意象，把书放回历史里读。</p>
          </Link>
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
