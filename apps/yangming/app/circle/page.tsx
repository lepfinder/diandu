import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/Link';
import { getCircleData, getWork } from '@/lib/data';

export const metadata: Metadata = {
  title: '交游人物',
};

export default function CirclePage() {
  const data = getCircleData();

  return (
    <div className="page-scroll">
      <div className="page">
        {data.banner ? (
          <div className="topic-banner">
            <Image src={data.banner} alt="" fill priority sizes="(max-width: 960px) 100vw, 980px" />
          </div>
        ) : null}

        <header className="section-head">
          <div>
            <h1>{data.title}</h1>
            <p className="sub">{data.lead}</p>
          </div>
        </header>

        <section className="char-grid">
          {data.people.map((p) => {
            const works = p.workIds.map((id) => getWork(id)).filter(Boolean);
            return (
              <article key={p.id} className="char-card">
                <div className="char-art">
                  {p.image ? (
                    <Image src={p.image} alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
                  ) : null}
                  <span className="char-seal" aria-hidden>
                    {p.seal}
                  </span>
                </div>
                <div className="char-body">
                  <div className="num">{p.relation}</div>
                  <h3>{p.name}</h3>
                  <p>{p.blurb}</p>
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
            );
          })}
        </section>
      </div>
    </div>
  );
}
