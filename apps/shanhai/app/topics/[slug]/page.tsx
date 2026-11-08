import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { getChapterList } from '@/lib/book';
import { TOPIC_TABS, getTopics } from '@/lib/topics';
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
  const shan = topics.regions.filter((r) => r.corpus === '山经');
  const hai = topics.regions.filter((r) => r.corpus === '海经');

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

        {slug === 'regions' ? (
          <>
            <header className="section-head">
              <div>
                <h1>方位</h1>
                <p className="sub">山经五篇记陆，海经十三篇记荒。按方向摸一遍，再进正文。</p>
              </div>
            </header>

            <div className="section-head" style={{ marginTop: 8 }}>
              <div>
                <h2 style={{ fontSize: 22, margin: 0 }}>山经</h2>
                <p className="sub">南、西、北、东、中。按山系走。</p>
              </div>
            </div>
            <section className="house-grid">
              {shan.map((region) => {
                const chapter = toc.find((item) => item.n === region.chapter);
                return (
                  <article key={region.id} className="house-card">
                    <div className="house-body">
                      <header>
                        <div className="num">{region.quadrant} · {region.corpus}</div>
                        <h2>{region.name}</h2>
                      </header>
                      <p>{region.blurb}</p>
                      <Link href={`/read/${region.chapter}/`} style={{ color: 'var(--accent)', marginTop: 12, display: 'inline-block' }}>
                        {chapter?.label ?? region.name} →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="section-head" style={{ marginTop: 36 }}>
              <div>
                <h2 style={{ fontSize: 22, margin: 0 }}>海经</h2>
                <p className="sub">海外、海内、大荒。荒外诸国与帝系。</p>
              </div>
            </div>
            <section className="house-grid">
              {hai.map((region) => {
                const chapter = toc.find((item) => item.n === region.chapter);
                return (
                  <article key={region.id} className="house-card">
                    <div className="house-body">
                      <header>
                        <div className="num">{region.quadrant} · {region.corpus}</div>
                        <h2>{region.name}</h2>
                      </header>
                      <p>{region.blurb}</p>
                      <Link href={`/read/${region.chapter}/`} style={{ color: 'var(--accent)', marginTop: 12, display: 'inline-block' }}>
                        {chapter?.label ?? region.name} →
                      </Link>
                    </div>
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
                <h1>名物</h1>
                <p className="sub">十二则最常被提起的神话与异物。先读短述，再进那一篇。</p>
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
                      <div className="num">{chapter?.t1 ?? `第 ${scene.chapter} 篇`}</div>
                      <h2>{scene.title}</h2>
                      <p>{scene.summary}</p>
                      <div className="people">
                        {scene.people.map((name) => (
                          <span key={name}>{name}</span>
                        ))}
                      </div>
                      <Link href={`/read/${scene.chapter}/`}>阅读此篇 →</Link>
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
