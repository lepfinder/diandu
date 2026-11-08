import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/Link';
import { getTimeline, getWork } from '@/lib/data';

export const metadata: Metadata = {
  title: '生平',
};

export default function LifePage() {
  const events = getTimeline();

  return (
    <div className="page-scroll">
      <div className="page life-page">
        <header className="section-head">
          <div>
            <h1>生平时间线</h1>
            <p className="sub">从余姚到南安。图随行迹；点开节点旁的篇名，可直接读到作品。</p>
          </div>
        </header>

        <ol className="timeline">
          {events.map((ev, i) => {
            const works = ev.workIds.map((id) => getWork(id)).filter(Boolean);
            const flip = i % 2 === 1;
            return (
              <li key={ev.id} className={`timeline-item${flip ? ' flip' : ''}`}>
                <div className="timeline-year">
                  <strong>{ev.year}</strong>
                  <span>{ev.yearLabel}</span>
                </div>
                <article className="timeline-card">
                  {ev.image ? (
                    <div className="timeline-art">
                      <Image
                        src={ev.image}
                        alt=""
                        fill
                        sizes="(max-width: 720px) 100vw, 280px"
                        priority={i < 2}
                      />
                    </div>
                  ) : null}
                  <div className="timeline-body">
                    <div className="timeline-meta">
                      <span className="phase">{ev.phase}</span>
                      {ev.age > 0 ? <span>{ev.age} 岁</span> : null}
                      <span>{ev.place}</span>
                    </div>
                    <h2>{ev.title}</h2>
                    <p>{ev.blurb}</p>
                    {works.length > 0 ? (
                      <div className="timeline-works">
                        {works.map((w) =>
                          w ? (
                            <Link key={w.id} href={`/works/${w.id}/`}>
                              {w.title}
                            </Link>
                          ) : null,
                        )}
                      </div>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
