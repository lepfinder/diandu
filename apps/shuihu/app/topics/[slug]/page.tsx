import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { SeatHall } from '@/components/SeatHall';
import { StoryPath } from '@/components/StoryPath';
import { getChapterList } from '@/lib/book';
import { TOPIC_TABS, getTopics } from '@/lib/topics';

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

        {slug === 'seats' ? (
          <>
            <header className="section-head">
              <div>
                <h1>座次</h1>
                <p className="sub">上面拖到你读到的那一回。石碣上的一百单八人，名字已经出现过的会亮；点格子看简介。</p>
              </div>
            </header>
            <SeatHall toc={toc} />
          </>
        ) : null}

        {slug === 'path' ? (
          <>
            <header className="section-head">
              <div>
                <h1>聚义</h1>
                <p className="sub">从误走妖魔到神聚蓼儿洼。二十二站，走过的会亮。</p>
              </div>
            </header>
            <StoryPath toc={toc} />
          </>
        ) : null}

        {slug === 'scenes' ? (
          <>
            <header className="section-head">
              <div>
                <h1>名场面</h1>
                <p className="sub">{topics.scenes.length} 场。每场一条短述，链回那一回。</p>
              </div>
            </header>
            <section className="scene-grid">
              {topics.scenes.map((scene) => {
                const chapter = toc.find((item) => item.n === scene.chapter);
                return (
                  <article key={scene.id} className={`scene-card${scene.image ? ' has-art' : ''}`}>
                    {scene.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="scene-art" src={scene.image} alt="" />
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
      </div>
    </div>
  );
}
