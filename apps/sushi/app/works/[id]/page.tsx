import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { getEvent, getRelatedWorks, getWork, getWorks } from '@/lib/data';

export function generateStaticParams() {
  return getWorks().map((w) => ({ id: w.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const work = getWork(id);
  return { title: work ? work.title : '作品' };
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const works = getWorks();
  const work = getWork(id);
  if (!work) notFound();

  const index = works.findIndex((w) => w.id === id);
  const prev = index > 0 ? works[index - 1] : null;
  const next = index < works.length - 1 ? works[index + 1] : null;
  const event = work.timelineId ? getEvent(work.timelineId) : null;
  const related = getRelatedWorks(work);

  return (
    <div className="page-scroll">
      <article className="chapter work-chapter">
        {work.image ? (
          <div className="work-hero">
            <Image src={work.image} alt="" fill priority sizes="(max-width: 720px) 100vw, 38rem" />
          </div>
        ) : null}

        <header className="chapter-header">
          <div className="num">
            {work.genreLabel} · {work.yearLabel} · {work.place}
          </div>
          <h1>{work.title}</h1>
          {work.note ? <p className="pair">{work.note}</p> : null}
          <p className="work-blurb">{work.blurb}</p>
          {event ? (
            <p className="work-life">
              相关生平：
              <Link href="/life/">{event.title}</Link>
              <span>
                （{event.yearLabel} · {event.place}）
              </span>
            </p>
          ) : null}
        </header>

        {work.background || work.why ? (
          <aside className="work-guide">
            {work.background ? (
              <div>
                <h2>背景</h2>
                <p>{work.background}</p>
              </div>
            ) : null}
            {work.why ? (
              <div>
                <h2>为何必读</h2>
                <p>{work.why}</p>
              </div>
            ) : null}
          </aside>
        ) : null}

        <div className="work-body">
          {work.lines.map((line, i) => (
            <p key={i} className={work.genre === 'wen' ? undefined : 'open verse'}>
              {line}
            </p>
          ))}
        </div>

        {work.glosses && work.glosses.length > 0 ? (
          <section className="work-glosses">
            <h2>笺注</h2>
            <ul>
              {work.glosses.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="work-related">
            <h2>相关篇目</h2>
            <div className="chapter-grid">
              {related.map((w) => (
                <Link key={w.id} className="chapter-card" href={`/works/${w.id}/`}>
                  <div className="num">
                    {w.genreLabel} · {w.yearLabel}
                  </div>
                  <h3>{w.title}</h3>
                  <p>{w.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <nav className="nav-chapter">
          {prev ? (
            <Link href={`/works/${prev.id}/`}>
              <span className="lbl">上一篇</span>
              <span className="nm">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="next" href={`/works/${next.id}/`}>
              <span className="lbl">下一篇</span>
              <span className="nm">{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </div>
  );
}
