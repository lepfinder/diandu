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
  const byTitle = new Map(toc.map((item) => [item.t1, item]));

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

        {slug === 'corpus' ? (
          <>
            <header className="section-head">
              <div>
                <h1>五体</h1>
                <p className="sub">本纪、表、书、世家、列传。点篇名跳进正文。</p>
              </div>
            </header>
            <section className="house-grid">
              {topics.corpus.map((kind) => (
                <article key={kind.id} className={kind.image ? 'house-card has-art' : 'house-card'}>
                  {kind.image ? <img className="house-art" src={asset(kind.image)} alt={kind.name} /> : null}
                  <div className="house-body">
                    <header>
                      <div className="num">{kind.stories.length} 篇示例</div>
                      <h2>{kind.name}</h2>
                    </header>
                    <p>{kind.blurb}</p>
                    <div className="people" style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {kind.stories.map((title) => {
                        const chapter = byTitle.get(title);
                        if (!chapter) return <span key={title}>{title}</span>;
                        return (
                          <Link key={title} href={`/read/${chapter.n}/`} style={{ color: 'var(--accent)' }}>
                            {title}
                          </Link>
                        );
                      })}
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
                const chapter = toc.find((item) => item.n === scene.chapter) ?? byTitle.get(scene.title);
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
                      <div className="num">
                        {chapter ? `${chapter.t2}　第 ${chapter.n} 篇` : scene.title}
                      </div>
                      <h2>{scene.title}</h2>
                      <p>{scene.summary}</p>
                      <div className="people">
                        {scene.people.map((name) => (
                          <span key={name}>{name}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                        {chapter ? <Link href={`/read/${chapter.n}/`}>阅读此篇 →</Link> : null}
                        <MapLink anchor={scene.map} />
                      </div>
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
