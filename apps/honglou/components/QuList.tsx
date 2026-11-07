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

export function QuList({ items, intro }: { items: QuItem[]; intro: string }) {
  return (
    <>
      <p className="sub" style={{ margin: '-10px 0 22px', maxWidth: '68ch', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
        {intro}
      </p>
      <div className="poem-list">
        {items.map((q) => (
          <article key={q.id} className="poem-card">
            <div className="poem-img" data-label={q.title}>
              <img src={asset(q.image)} alt={q.title} width={1200} height={420} loading="eager" decoding="async" />
            </div>
            <div className="poem-body">
              <h3>
                {q.title}
                <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--sans)' }}>
                  {q.personId ? (
                    <Link href={`/search/?q=${encodeURIComponent(q.person.replace(/（.*）/, ''))}`} style={{ color: 'var(--accent)' }}>
                      {q.person}
                    </Link>
                  ) : (
                    q.person
                  )}
                </span>
              </h3>
              <div className="lines" style={{ whiteSpace: 'pre-wrap' }}>
                {q.text}
              </div>
              <div className="note">{q.read}</div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
