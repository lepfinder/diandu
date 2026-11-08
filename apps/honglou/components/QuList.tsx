'use client';

import Link from '@/components/Link';
import { asset } from '@classic/ui';

export type QuItem = {
  id: string;
  title: string;
  person: string;
  personId: string | null;
  image: string;
  text: string;
  read: string;
};

/** 按句读切开词曲，便于竖排阅读。 */
function splitQuLines(text: string): string[] {
  const normalized = text.replace(/\s+/g, '').trim();
  if (!normalized) return [];
  const parts = normalized
    .split(/(?<=[。！？；])/u)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [normalized];
}

export function QuList({ items, intro }: { items: QuItem[]; intro: string }) {
  return (
    <>
      <p className="sub" style={{ margin: '-10px 0 22px', maxWidth: '68ch', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
        {intro}
      </p>
      <div className="poem-list qu-list">
        {items.map((q) => {
          const isPortrait = q.image.includes('/chai-');
          return (
            <article key={q.id} className="poem-card has-img qu-card">
              <div className="poem-img" data-label={q.title}>
                <img
                  src={asset(q.image)}
                  alt={q.title}
                  width={isPortrait ? 1024 : 1200}
                  height={isPortrait ? 1024 : 900}
                  loading="eager"
                  decoding="async"
                  style={isPortrait ? { objectPosition: '50% 18%' } : { objectPosition: '50% 45%' }}
                />
              </div>
              <div className="poem-body">
                <header className="poem-head">
                  <h3>{q.title}</h3>
                  <div className="who">
                    {q.personId ? (
                      <Link
                        className="ch-link"
                        href={`/search/?q=${encodeURIComponent(q.person.replace(/（.*）/, ''))}`}
                      >
                        {q.person}
                      </Link>
                    ) : (
                      <span className="author">{q.person}</span>
                    )}
                  </div>
                </header>
                <div className="lines">
                  {splitQuLines(q.text).map((line, i) => (
                    <p key={i} className="line">
                      {line}
                    </p>
                  ))}
                </div>
                {q.read ? (
                  <aside className="note">
                    <span className="note-label">读解</span>
                    <p>{q.read}</p>
                  </aside>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
