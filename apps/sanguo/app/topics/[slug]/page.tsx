import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { SituationMap } from '@/components/SituationMap';
import { getChapterList } from '@/lib/book';
import { TL_ACTS, TOPIC_TABS, actForChapter, getTopics } from '@/lib/topics';

export function generateStaticParams() {
  return TOPIC_TABS.map((tab) => ({ slug: tab.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tab = TOPIC_TABS.find((item) => item.id === slug);
  return { title: tab ? tab.name : '专题' };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tab = TOPIC_TABS.find((item) => item.id === slug);
  if (!tab) notFound();
  const topics = getTopics();
  const toc = getChapterList();

  return (
    <div className="page-scroll">
      <div className="page topic-page">
        <nav className="topic-tabs">
          {TOPIC_TABS.map((item) => (
            <Link key={item.id} href={item.href} className={item.id === slug ? 'on' : ''}>
              {item.name}
            </Link>
          ))}
        </nav>

        {slug === 'map' ? (
          <>
            <header className="section-head">
              <div>
                <h1>形势</h1>
                <p className="sub">拖到你读到的那一回。色块跟着这一回的城池归属铺开，岸线和河网是实地的。</p>
              </div>
            </header>
            <SituationMap toc={toc} />
          </>
        ) : null}

        {slug === 'events' ? (
          <>
            <header className="section-head">
              <div>
                <h1>大事</h1>
                <p className="sub">全书分四幕推进。点开节点，跳到那一回。</p>
              </div>
            </header>
            {TL_ACTS.map((act) => {
              const items = topics.events.filter(
                (item) => item.chapter >= act.range[0] && item.chapter <= act.range[1],
              );
              return (
                <section key={act.id} className="tl-act">
                  <div className="tl-act-head">
                    <div className="tl-act-img" data-label={act.title}>
                      <img src={act.image} alt={act.title} width={1200} height={360} loading="eager" decoding="async" />
                    </div>
                    <div className="tl-act-meta">
                      <h2>{act.title}</h2>
                      <p>
                        {toc.find((row) => row.n === act.range[0])?.label} —{' '}
                        {toc.find((row) => row.n === act.range[1])?.label}
                      </p>
                      <p className="blurb">{act.blurb}</p>
                    </div>
                  </div>
                  <div className="timeline">
                    {items.map((item) => {
                      const chapter = toc.find((row) => row.n === item.chapter);
                      const actLabel = actForChapter(item.chapter).title.split('·')[0].trim();
                      return (
                        <Link key={item.id} href={`/read/${item.chapter}/`} className="tl-item">
                          <div className="ch">
                            {item.year ? `公元${item.year}年 · ` : ''}
                            {chapter?.label} · {actLabel}
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.blurb}</p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </>
        ) : null}

        {slug === 'scenes' ? (
          <>
            <header className="section-head">
              <div>
                <h1>名场面</h1>
                <p className="sub">二十七场都配了图。每场一条短述，链回那一回。</p>
              </div>
            </header>
            <section className="scene-grid">
              {topics.scenes.map((scene) => {
                const chapter = toc.find((item) => item.n === scene.chapter);
                return (
                  <article key={scene.id} className={scene.image ? 'scene-card has-art' : 'scene-card'}>
                    {scene.image ? (
                      <img className="scene-art" src={scene.image} alt={scene.title} />
                    ) : (
                      <div className="scene-plate" aria-hidden="true">{scene.plate}</div>
                    )}
                    <div className="scene-body">
                      <div className="num">{chapter?.label}　{chapter?.t1}</div>
                      <h2>{scene.title}</h2>
                      <p>{scene.summary}</p>
                      <div className="people">
                        {scene.people.map((name) => (
                          <span key={name}>{name}</span>
                        ))}
                      </div>
                      <Link href={`/read/${scene.chapter}/`}>阅读此回 →</Link>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}

        {slug === 'pieces' ? (
          <>
            <header className="section-head">
              <div>
                <h1>名篇</h1>
                <p className="sub">书里当场写出、当场念出的六篇。原文照这一版，各配一图。</p>
              </div>
            </header>
            <section className="piece-list">
              {topics.pieces.map((piece) => {
                const chapter = toc.find((item) => item.n === piece.chapter);
                return (
                  <article key={piece.id} className={piece.image ? 'piece has-img' : 'piece'}>
                    {piece.image ? (
                      <div className="piece-img">
                        <img src={piece.image} alt={piece.title} />
                      </div>
                    ) : null}
                    <div className="piece-body">
                      <header>
                        <div className="num">{piece.kind} · {piece.author} · {chapter?.label}</div>
                        <h2>{piece.title}</h2>
                      </header>
                      {piece.lines ? (
                        <div className="piece-verse">
                          {piece.lines.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      ) : null}
                      {piece.paras ? (
                        <div className="piece-prose">
                          {piece.paras.map((para) => (
                            <p key={para.slice(0, 24)}>{para}</p>
                          ))}
                        </div>
                      ) : null}
                      <p className="piece-note">{piece.note}</p>
                      <Link href={`/read/${piece.chapter}/`}>打开这一回 →</Link>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}

        {slug === 'history' ? (
          <>
            <header className="section-head">
              <div>
                <h1>史实对照</h1>
                <p className="sub">演义怎么写，陈寿和裴注怎么记。七则里，温酒、单刀、七擒是新补的。</p>
              </div>
            </header>
            <section className="essay-list">
              {topics.essays.map((essay) => {
                const chapter = toc.find((item) => item.n === essay.chapter);
                return (
                  <article key={essay.id} className="essay">
                    <header>
                      <div className="num">{chapter?.label}　{chapter?.t1}</div>
                      <h2>{essay.title}</h2>
                    </header>
                    <div className="essay-block">
                      <h3>演义</h3>
                      <p>{essay.novel}</p>
                    </div>
                    <div className="essay-block">
                      <h3>史书</h3>
                      <p>{essay.history}</p>
                    </div>
                    <div className="essay-block">
                      <h3>怎么读</h3>
                      <p>{essay.reading}</p>
                    </div>
                    <Link href={`/read/${essay.chapter}/`}>打开这一回 →</Link>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}

        {slug === 'relics' ? (
          <>
            <header className="section-head">
              <div>
                <h1>兵器坐骑</h1>
                <p className="sub">书里叫得响的刀枪和名马。各一段出处，链回相关回目。</p>
              </div>
            </header>
            <section className="relic-grid">
              {topics.relics.map((relic) => {
                const chapter = toc.find((item) => item.n === relic.chapter);
                return (
                  <article key={relic.id} className="relic-card">
                    {relic.image ? <img className="relic-art" src={relic.image} alt={relic.name} /> : null}
                    <div className="relic-body">
                      <div className="num">
                        {relic.kind} · {relic.owner}
                      </div>
                      <h2>{relic.name}</h2>
                      <p>{relic.blurb}</p>
                      <Link href={`/read/${relic.chapter}/`}>
                        {chapter?.label ?? `第 ${relic.chapter} 回`} →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
