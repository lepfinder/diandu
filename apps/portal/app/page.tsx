import { BOOKS } from '@classic/catalog';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import { bookHref } from '@/lib/links';

const seals: Record<string, string> = {
  honglou: '梦',
  sanguo: '三',
  shuihu: '浒',
  xiyouji: '西',
  jinpingmei: '金',
  liaozhai: '聊',
};

function jsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: '典读',
        url: `${site}/`,
        description: '中国古典交互精读：六部古典全文阅读、人物图谱、专题与检索。',
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'ItemList',
        name: '典读书目',
        numberOfItems: BOOKS.length,
        itemListElement: BOOKS.map((book, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Book',
            name: book.title,
            author: { '@type': 'Person', name: book.author },
            url: absoluteUrl(`${book.basePath}/`),
            image: absoluteUrl(book.cover),
            inLanguage: 'zh-CN',
          },
        })),
      },
    ],
  };
}

export default function HomePage() {
  const ld = jsonLd();
  return (
    <div className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <div className="grain" aria-hidden />

      <header className="topbar">
        <div className="brand">典读</div>
        <div className="top-meta">六部古典 · 一门而入</div>
      </header>

      <section className="hero">
        <p className="eyebrow">中国古典 · 交互精读</p>
        <h1>典读</h1>
        <p className="lead">
          把六部古典请进同一座书斋：全文阅读、人物图谱、专题与检索，各自成章。
        </p>
      </section>

      <section className="shelf" aria-label="书目">
        <div className="shelf-head">
          <h2>书目</h2>
          <span>{BOOKS.length} 部</span>
        </div>

        <div className="grid">
          {BOOKS.map((book, i) => (
            <a
              key={book.id}
              className="tome"
              href={bookHref(book)}
              style={{ animationDelay: `${0.08 + i * 0.06}s` }}
            >
              <div className="tome-media">
                <img src={book.cover} alt="" loading={i < 3 ? 'eager' : 'lazy'} />
                <div className="tome-shade" />
                <span className="seal" aria-hidden>
                  {seals[book.id] || book.title.slice(0, 1)}
                </span>
              </div>
              <div className="tome-body">
                <p className="kicker">{book.author}</p>
                <h3>{book.title}</h3>
                <p className="quote">
                  {book.lead[0]}
                  <br />
                  {book.lead[1]}
                </p>
                <div className="meta">
                  <span className="hl">{book.highlight}</span>
                  <span className="go">进入精读</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer className="foot">正文多取维基文库公有领域文本 · 典读</footer>
    </div>
  );
}
