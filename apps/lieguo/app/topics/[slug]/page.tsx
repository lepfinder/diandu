import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { getChapterList } from '@/lib/book';
import { TOPIC_TABS, getTopics } from '@/lib/topics';
import { MapLink } from '@/components/MapLink';
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

        {slug === 'eras' ? (
          <>
            <header className="section-head">
              <div>
                <h1>时代</h1>
                <p className="sub">春秋与战国。点名篇进正文，也可对照江山舆图。</p>
              </div>
            </header>
            <section className="house-grid">
              {topics.eras.map((era) => (
                <article key={era.id} className={era.image ? 'house-card has-art' : 'house-card'}>
                  {era.image ? <img className="house-art" src={asset(era.image)} alt={era.name} /> : null}
                  <div className="house-body">
                    <header>
                      <div className="num">{era.stories.length} 条线索</div>
                      <h2>{era.name}</h2>
                    </header>
                    <p>{era.blurb}</p>
                    <div className="people" style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {era.stories.map((title) => (
                        <span key={title}>{title}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : null}

        {slug === 'scenes' ? (
          <>
            <header className="section-head">
              <div>
                <h1>名篇</h1>
                <p className="sub">事与地对照。可开正文，也可跳江山舆图。</p>
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
                      <div className="scene-plate" aria-hidden="true">
                        {scene.plate}
                      </div>
                    )}
                    <div className="scene-body">
                      <div className="num">{chapter ? `${chapter.label}` : scene.title}</div>
                      <h2>{scene.title}</h2>
                      <p>{scene.summary}</p>
                      <div className="people">
                        {scene.people.map((name) => (
                          <span key={name}>{name}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                        {chapter ? <Link href={`/read/${chapter.n}/`}>阅读此回 →</Link> : null}
                        <MapLink anchor={scene.map} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}

        {slug === 'idioms' ? (
          <>
            <header className="section-head">
              <div>
                <h1>成语出处</h1>
                <p className="sub">列国故事里走出来的成语。释义、本事、回目与舆图对照。</p>
              </div>
            </header>
            <section className="idiom-grid">
              {topics.idioms.map((item) => {
                const chapter = toc.find((c) => c.n === item.chapter);
                const eraLabel = item.era === 'warring' ? '战国' : item.era === 'spring' ? '春秋' : '';
                return (
                  <article key={item.id} className="idiom-card">
                    <header>
                      <div className="num">
                        {eraLabel}
                        {eraLabel && chapter ? ' · ' : ''}
                        {chapter ? chapter.label : `第 ${item.chapter} 回`}
                      </div>
                      <h2>{item.idiom}</h2>
                      <p className="gloss">{item.gloss}</p>
                    </header>
                    <p>{item.story}</p>
                    <div className="people">
                      {item.people.map((name) => (
                        <span key={name}>{name}</span>
                      ))}
                    </div>
                    <div className="card-actions">
                      {chapter ? <Link href={`/read/${chapter.n}/`}>阅读此回 →</Link> : null}
                      <MapLink anchor={item.map} />
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}

        {slug === 'places' ? (
          <>
            <header className="section-head">
              <div>
                <h1>古今地名</h1>
                <p className="sub">镐京、临淄、长平……古称对今地，并可跳江山舆图。</p>
              </div>
            </header>
            <section className="place-grid">
              {topics.places.map((item) => {
                const chapter = toc.find((c) => c.n === item.chapter);
                const eraLabel = item.era === 'warring' ? '战国' : item.era === 'spring' ? '春秋' : '';
                return (
                  <article key={item.id} className="place-card">
                    <header>
                      <div className="num">{eraLabel || '地名'}</div>
                      <h2>{item.ancient}</h2>
                      <p className="modern">今 · {item.modern}</p>
                    </header>
                    <p>{item.note}</p>
                    <div className="card-actions">
                      {chapter ? <Link href={`/read/${chapter.n}/`}>相关回目 →</Link> : null}
                      <MapLink anchor={item.map} />
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
