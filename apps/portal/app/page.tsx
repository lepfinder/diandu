import { BOOKS } from '@classic/catalog';
import { bookHref } from '@/lib/links';

const seals: Record<string, string> = {
  honglou: '梦',
  sanguo: '三',
  shuihu: '浒',
  xiyouji: '西',
  jinpingmei: '金',
  liaozhai: '聊',
};

export default function HomePage() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="mark">典读</div>
        <div className="hint">CLASSICAL CLOSE READING</div>
      </header>

      <section className="hero">
        <p className="tag">中国古典 · 交互精读</p>
        <h1>典读</h1>
        <p className="lead">
          把六部古典请进同一座书斋：全文阅读、人物图谱、专题与检索，各自成章，一门而入。
        </p>
      </section>

      <div className="shelf-head">
        <h2>书目</h2>
        <p>{BOOKS.length} 部 · 点开即读</p>
      </div>

      <section className="shelf">
        {BOOKS.map((book) => (
          <a key={book.id} className="book" href={bookHref(book)}>
            <span className="seal" aria-hidden>
              {seals[book.id] || book.title.slice(0, 1)}
            </span>
            <p className="kicker">{book.kicker}</p>
            <h3>{book.title}</h3>
            <p className="quote">
              {book.lead[0]}
              <br />
              {book.lead[1]}
            </p>
            <div className="meta">
              <span className="hl">{book.highlight}</span>
              <span className="go">进入 →</span>
            </div>
          </a>
        ))}
      </section>

      <footer className="foot">正文多取维基文库公有领域文本 · 典读</footer>
    </div>
  );
}
