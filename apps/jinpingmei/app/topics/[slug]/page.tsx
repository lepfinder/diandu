import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { getChapterList } from '@/lib/book';
import { getGroup, getPersonByName } from '@/lib/characters';
import { getCharacterArt } from '@/lib/character-art';
import { TOPIC_TABS, TL_ACTS, actForChapter, getTopics, relationNames } from '@/lib/topics';
import { asset } from '@classic/ui';

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

        {slug === 'timeline' ? (
          <>
            <header className="section-head">
              <div>
                <h1>年表</h1>
                <p className="sub">全书分四幕推进。点开节点，跳到那一回。</p>
              </div>
            </header>
            {TL_ACTS.map((act) => {
              const items = topics.timeline.filter(
                (item) => item.chapter >= act.range[0] && item.chapter <= act.range[1],
              );
              return (
                <section key={act.id} className="tl-act">
                  <div className="tl-act-head">
                    <div className="tl-act-img" data-label={act.title}>
                      <img src={asset(act.image)} alt={act.title} width={1200} height={360} loading="eager" decoding="async" />
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
                            {chapter?.label} · {actLabel}
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.text}</p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </>
        ) : null}

        {slug === 'house' ? (
          <>
            <header className="section-head">
              <div>
                <h1>府内</h1>
                <p className="sub">西门庆一府的亲属、妾室，和几条出了门还缠着的关系。</p>
              </div>
            </header>
            <section className="house-grid">
              {topics.house.map((item) => {
                const names = relationNames(item.people);
                return (
                  <article key={item.id} className="house-card">
                    <header>
                      <div className="num">从第 {item.chapter} 回看起</div>
                      <h2>{item.label}</h2>
                    </header>
                    <div className="house-faces">
                      {names.map((name) => {
                        const person = getPersonByName(name);
                        const art = person ? getCharacterArt(person.id) : null;
                        const camp = person ? getGroup(person.group) : null;
                        return (
                          <div key={name} className="house-face">
                            {art ? (
                              <img src={asset(art.avatar)} alt={name} width={72} height={72} loading="lazy" decoding="async" />
                            ) : (
                              <span className="avatar" style={{ background: camp?.color || 'var(--paper-3)' }}>
                                {name.slice(0, 1)}
                              </span>
                            )}
                            <em>{name}</em>
                          </div>
                        );
                      })}
                    </div>
                    <p>{item.text}</p>
                    <Link href={`/read/${item.chapter}/`}>打开这一回 →</Link>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}

        {slug === 'scenes' ? (
          <>
            <header className="section-head">
              <div>
                <h1>名场面</h1>
                <p className="sub">从热结十兄弟到幻度孝哥，挑书里一眼能认出来的那几场。</p>
              </div>
            </header>
            <section className="scene-grid">
              {topics.scenes.map((scene) => {
                const chapter = toc.find((item) => item.n === scene.chapter);
                return (
                  <article key={scene.id} className={scene.image ? 'scene-card has-art' : 'scene-card'}>
                    {scene.image ? (
                      <img className="scene-art" src={asset(scene.image)} alt={scene.title} />
                    ) : (
                      <div className="scene-plate" aria-hidden="true">{scene.plate}</div>
                    )}
                    <div className="scene-body">
                      <div className="num">
                        {chapter?.label}　{chapter?.t1}
                      </div>
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
                <p className="sub">开卷诗、回前词，和收束那几联。每首配一帧宋风图，原文照崇祯本。</p>
              </div>
            </header>
            <section className="piece-list">
              {topics.pieces.map((piece) => {
                const chapter = toc.find((item) => item.n === piece.chapter);
                return (
                  <article key={piece.id} className={piece.image ? 'piece has-art' : 'piece'}>
                    {piece.image ? (
                      <img className="piece-art" src={asset(piece.image)} alt={piece.title} loading="lazy" decoding="async" />
                    ) : null}
                    <div className="piece-body">
                      <header>
                        <div className="num">
                          {piece.kind} · {chapter?.label}
                        </div>
                        <h2>{piece.title}</h2>
                      </header>
                      <div className="piece-verse">
                        {piece.lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                      <p className="piece-note">{piece.note}</p>
                      <Link href={`/read/${piece.chapter}/`}>打开这一回 →</Link>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}

        {slug === 'goods' ? (
          <>
            <header className="section-head">
              <div>
                <h1>物产器用</h1>
                <p className="sub">衣料器用之外，吃食玩物也单列：酒茶、猪头、瓜子，双陆、骨牌、秋千。</p>
              </div>
            </header>
            <section className="goods-grid">
              {topics.goods.map((good) => {
                const chapter = toc.find((item) => item.n === good.chapter);
                return (
                  <article key={good.id} className={good.image ? 'goods-card has-art' : 'goods-card'}>
                    {good.image ? (
                      <img className="goods-art" src={asset(good.image)} alt={good.name} loading="lazy" decoding="async" />
                    ) : null}
                    <div className="num">
                      {good.kind} · {chapter?.label}
                    </div>
                    <h2>{good.name}</h2>
                    <p>{good.text}</p>
                    <Link href={`/read/${good.chapter}/`}>从这一回看起 →</Link>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}

        {slug === 'editions' ? (
          <>
            <header className="section-head">
              <div>
                <h1>版本笺记</h1>
                <p className="sub">词话本、崇祯本、张评本三大系统。本站用崇祯本。</p>
              </div>
            </header>
            <section className="essay-list">
              {topics.editions.map((essay) => (
                <article key={essay.id} className="essay">
                  <header>
                    <div className="num">笺记</div>
                    <h2>{essay.title}</h2>
                  </header>
                  {essay.paras.map((para) => (
                    <p key={para.slice(0, 24)} style={{ marginTop: 12 }}>
                      {para}
                    </p>
                  ))}
                </article>
              ))}
            </section>
          </>
        ) : null}

        {slug === 'market' ? (
          <>
            <header className="section-head">
              <div>
                <h1>市井官场</h1>
                <p className="sub">铺面、提刑、蔡京门路、丽春院。府内写人，这里写路子。</p>
              </div>
            </header>
            <section className="house-grid">
              {topics.market.map((item) => {
                const names = relationNames(item.people);
                return (
                  <article key={item.id} className="house-card">
                    <header>
                      <div className="num">从第 {item.chapter} 回看起</div>
                      <h2>{item.label}</h2>
                    </header>
                    <div className="house-faces">
                      {names.map((name) => {
                        const person = getPersonByName(name);
                        const art = person ? getCharacterArt(person.id) : null;
                        const camp = person ? getGroup(person.group) : null;
                        return (
                          <div key={name} className="house-face">
                            {art ? (
                              <img src={asset(art.avatar)} alt={name} width={72} height={72} loading="lazy" decoding="async" />
                            ) : (
                              <span className="avatar" style={{ background: camp?.color || 'var(--paper-3)' }}>
                                {name.slice(0, 1)}
                              </span>
                            )}
                            <em>{name}</em>
                          </div>
                        );
                      })}
                    </div>
                    <p>{item.text}</p>
                    <Link href={`/read/${item.chapter}/`}>打开这一回 →</Link>
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
