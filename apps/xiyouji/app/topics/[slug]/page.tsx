import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { RouteMap } from '@/components/RouteMap';
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

        {slug === 'route' ? (
          <>
            <header className="section-head">
              <div>
                <h1>西行</h1>
                <p className="sub">拖到你读到的那一回。十八站里，走过的会亮。</p>
              </div>
            </header>
            <RouteMap toc={toc} />
          </>
        ) : null}

        {slug === 'scenes' ? (
          <>
            <header className="section-head">
              <div>
                <h1>名场面</h1>
                <p className="sub">二十一场都配了图。每场一条短述，链回那一回。八十一难的全表不在这里。</p>
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

        {slug === 'relics' ? (
          <>
            <header className="section-head">
              <div>
                <h1>器物</h1>
                <p className="sub">书里叫得响的兵器、法宝和坐骑。各一段出处，链回相关回目。</p>
              </div>
            </header>
            <section className="relic-grid">
              {topics.relics.map((relic) => {
                const chapter = toc.find((item) => item.n === relic.chapter);
                return (
                  <article key={relic.id} className="relic-card">
                    {relic.image ? <img className="relic-art" src={asset(relic.image)} alt={relic.name} /> : null}
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
