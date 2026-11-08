import Image from 'next/image';
import Link from '@/components/Link';
import {
  HOME_CIRCLE_CARD,
  HOME_TOPICS,
  getCircle,
  getFeaturedWorks,
  getPerson,
  getTimeline,
  getTopic,
  getWorks,
} from '@/lib/data';

export default function HomePage() {
  const person = getPerson();
  const featured = getFeaturedWorks().slice(0, 6);
  const works = getWorks();
  const events = getTimeline();
  const circle = getCircle().slice(0, 6);
  const highlight = events.find((e) => e.id === 'longchang') ?? events[0];
  const circleCard = HOME_CIRCLE_CARD;

  return (
    <div className="page-scroll">
      <div className="home">
        <section className="hero">
          <div className="hero-card has-img">
            <Image src="/cover.webp" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
            <div className="hero-content">
              <div className="hero-kicker">{person.kicker}</div>
              <h1>{person.name}</h1>
              <p className="lead">
                {person.lead[0]}
                <br />
                {person.lead[1]}
              </p>
              <div className="hero-actions">
                <Link className="btn accent" href="/life/">
                  看生平
                </Link>
                <Link className="btn ghost" href="/works/zhixing-heyi/">
                  读传习录
                </Link>
                <Link className="btn ghost" href="/topics/longchang/">
                  龙场悟道
                </Link>
              </div>
            </div>
          </div>
          <div className="side-stack">
            <div className="progress-card">
              <div className="label">
                <strong>人物概览</strong>
                <span>
                  {person.years} · {works.length} 篇精读
                </span>
              </div>
              <p className="meta-note">
                {person.courtesy} · {person.hao}
                <br />
                {person.dynasty} · {person.birthplace}
                <br />
                {person.edition}
              </p>
            </div>
            <Link className="mini-card" href="/life/">
              <div className="t">转折 · {highlight.title}</div>
              <div className="d">{highlight.blurb}</div>
              <div className="go">打开时间线 →</div>
            </Link>
            <Link className="mini-card" href="/topics/liangzhi/">
              <div className="t">专题 · 致良知</div>
              <div className="d">百死千难中得来的三字宗旨。</div>
              <div className="go">进入专题 →</div>
            </Link>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h1>怎么读</h1>
            <p className="sub">{person.blurb}</p>
          </div>
        </div>
        <section className="home-grid">
          <Link className="topic-card has-img" href={circleCard.href}>
            <div className="topic-media">
              <Image src={circleCard.image} alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
            </div>
            <div className="topic-body">
              <div className="icon">{circleCard.icon}</div>
              <h3>{circleCard.title}</h3>
              <p>{circleCard.desc}</p>
            </div>
          </Link>
          {HOME_TOPICS.map((item) => {
            const topic = getTopic(item.id);
            if (!topic) return null;
            if (topic.image) {
              return (
                <Link key={item.id} className="topic-card has-img" href={item.href}>
                  <div className="topic-media">
                    <Image src={topic.image} alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
                  </div>
                  <div className="topic-body">
                    <div className="icon">{item.icon}</div>
                    <h3>{topic.title}</h3>
                    <p>{topic.lead}</p>
                  </div>
                </Link>
              );
            }
            return (
              <Link key={item.id} className="topic-card" href={item.href}>
                <div className="icon">{item.icon}</div>
                <h3>{topic.title}</h3>
                <p>{topic.lead}</p>
              </Link>
            );
          })}
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>名篇</h1>
            <p className="sub">先读这几篇，能摸到心学的气口。每篇附背景、笺注与相关篇。</p>
          </div>
        </div>
        <section className="featured-grid">
          {featured.map((w) => (
            <Link key={w.id} className="featured-card" href={`/works/${w.id}/`}>
              {w.image ? (
                <div className="featured-art">
                  <Image src={w.image} alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
                </div>
              ) : null}
              <div className="featured-body">
                <div className="num">
                  {w.genreLabel} · {w.yearLabel}
                </div>
                <h3>{w.title}</h3>
                <p>{w.blurb}</p>
              </div>
            </Link>
          ))}
        </section>

        <div className="section-head" style={{ marginTop: 48 }}>
          <div>
            <h1>交游人物</h1>
            <p className="sub">几位关键人物。上图下文，点开可跳到相关作品。</p>
          </div>
          <Link className="btn ghost sm" href="/circle/">
            全部人物
          </Link>
        </div>
        <section className="char-grid">
          {circle.map((p) => (
            <Link key={p.id} className="char-card" href={p.workIds[0] ? `/works/${p.workIds[0]}/` : '/circle/'}>
              <div className="char-art">
                {p.image ? (
                  <Image src={p.image} alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
                ) : null}
                <span className="char-seal" aria-hidden>
                  {p.seal}
                </span>
              </div>
              <div className="char-body">
                <div className="num">{p.relation}</div>
                <h3>{p.name}</h3>
                <p>{p.blurb}</p>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
