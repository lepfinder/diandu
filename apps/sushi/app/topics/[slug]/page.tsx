import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { getTopic, getTopicTabs, getWork } from '@/lib/data';

export function generateStaticParams() {
  return getTopicTabs().map((tab) => ({ slug: tab.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  return { title: topic ? topic.title : '专题' };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tabs = getTopicTabs();
  const topic = getTopic(slug);
  if (!topic) notFound();

  return (
    <div className="page-scroll">
      <div className="page topic-page">
        <nav className="topic-tabs">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.href} className={tab.id === slug ? 'on' : ''}>
              {tab.name}
            </Link>
          ))}
        </nav>

        {topic.image ? (
          <div className="topic-banner">
            <Image src={topic.image} alt="" fill priority sizes="(max-width: 960px) 100vw, 980px" />
          </div>
        ) : null}

        <header className="section-head">
          <div>
            <h1>{topic.title}</h1>
            <p className="sub">{topic.lead}</p>
          </div>
        </header>

        {topic.essay ? <p className="topic-essay">{topic.essay}</p> : null}

        <section className="topic-list">
          {topic.items.map((item) => {
            const work = getWork(item.workId);
            if (!work) return null;
            return (
              <article key={`${item.workId}-${item.note.slice(0, 12)}`} className="topic-entry">
                {work.image ? (
                  <div className="topic-entry-art">
                    <Image src={work.image} alt="" fill sizes="160px" />
                  </div>
                ) : null}
                <div className="topic-entry-body">
                  <div className="topic-entry-head">
                    <span className="num">
                      {work.genreLabel} · {work.yearLabel}
                    </span>
                    <h2>
                      <Link href={`/works/${work.id}/`}>{work.title}</Link>
                    </h2>
                  </div>
                  <p>{item.note}</p>
                  <Link className="go" href={`/works/${work.id}/`}>
                    打开正文 →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
