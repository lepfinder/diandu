import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/Link';
import { GENRE_ORDER, getWorks } from '@/lib/data';

export const metadata: Metadata = {
  title: '作品',
};

export default function WorksPage() {
  const works = getWorks();

  return (
    <div className="page-scroll">
      <div className="page">
        <header className="section-head">
          <div>
            <h1>作品</h1>
            <p className="sub">
              首批 {works.length} 篇精读。每篇含背景、笺注与相关篇；按词、诗、文分列。
            </p>
          </div>
        </header>

        {GENRE_ORDER.map((genre) => {
          const list = works.filter((w) => w.genre === genre.id);
          if (list.length === 0) return null;
          return (
            <section key={genre.id} className="works-section">
              <h2 className="works-genre">{genre.label}</h2>
              <div className="featured-grid">
                {list.map((w) => (
                  <Link key={w.id} className="featured-card" href={`/works/${w.id}/`}>
                    {w.image ? (
                      <div className="featured-art">
                        <Image src={w.image} alt="" fill sizes="(max-width: 720px) 100vw, 33vw" />
                      </div>
                    ) : null}
                    <div className="featured-body">
                      <div className="num">
                        {w.yearLabel} · {w.place}
                      </div>
                      <h3>{w.title}</h3>
                      <p>{w.blurb}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
