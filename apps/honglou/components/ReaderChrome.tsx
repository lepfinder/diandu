'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from '@/components/Link';
import type { Chapter } from '@/lib/types';
import { toCN, escapeHtml, type TocItem } from '@/lib/cn';
import { getAllCharacters, getCharacter, getRelationsFor } from '@/lib/content';
import { getTwelveDetail, type TwelveDetail } from '@/lib/twelve-detail';
import { TwelveDetailModal } from '@/components/TwelveDetailModal';
import type { Character } from '@/lib/types';
import { asset } from '@classic/ui';

type MarkName = { nm: string; id: string };

function buildMarks(): Map<string, MarkName[]> {
  const buckets = new Map<string, MarkName[]>();
  for (const c of getAllCharacters()) {
    const names = [c.name, ...(c.aliases || [])].filter((n) => n && n.length >= 2);
    for (const nm of names) {
      const k = nm[0];
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push({ nm, id: c.id });
    }
  }
  buckets.forEach((arr) => arr.sort((a, b) => b.nm.length - a.nm.length));
  return buckets;
}

function annotateParagraph(
  text: string,
  marks: Map<string, MarkName[]>,
  notes: { id: string; type: string; ch: number; quote: string; comment: string }[],
) {
  type Span = { start: number; end: number; note: { id: string; type: string; quote: string; comment: string } };
  const spans: Span[] = [];
  for (const n of notes) {
    if (!n.quote || n.quote.length < 2) continue;
    const idx = text.indexOf(n.quote);
    if (idx >= 0) spans.push({ start: idx, end: idx + n.quote.length, note: n });
  }
  spans.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const kept: Span[] = [];
  for (const sp of spans) {
    if (kept.some((k) => sp.start < k.end && k.start < sp.end)) continue;
    kept.push(sp);
  }
  let out = '';
  let i = 0;
  for (const sp of kept) {
    if (i < sp.start) out += markText(text.slice(i, sp.start), marks);
    const cls = sp.note.type === 'note' ? 'note-wave' : 'hl-underline';
    out += `<span class="${cls}" data-note-id="${sp.note.id}">` + markText(text.slice(sp.start, sp.end), marks) + '</span>';
    i = sp.end;
  }
  if (i < text.length) out += markText(text.slice(i), marks);
  return out;
}

function markText(text: string, marks: Map<string, MarkName[]>) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const bucket = marks.get(text[i]);
    let hit: MarkName | null = null;
    if (bucket) {
      for (const m of bucket) {
        if (text.startsWith(m.nm, i)) {
          hit = m;
          break;
        }
      }
    }
    if (hit) {
      out += `<span class="mark" data-char="${hit.id}" title="${hit.nm}">${hit.nm}</span>`;
      i += hit.nm.length;
    } else {
      out += escapeHtml(text[i]);
      i++;
    }
  }
  return out;
}

export function ReaderChrome({ chapter, prev, next, toc }: {
  chapter: Chapter;
  prev: { n: number; label: string; t1: string } | null;
  next: { n: number; label: string; t1: string } | null;
  toc: TocItem[];
}) {
  const [tocOpen, setTocOpen] = useState(false);
  const [setOpen, setSetOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [tocFilter, setTocFilter] = useState('');
  const [fontSize, setFontSize] = useState(19);
  const [lineHeight, setLineHeight] = useState(1.95);
  const [readWidth, setReadWidth] = useState(38);
  const [theme, setTheme] = useState('paper');
  const [fontMode, setFontMode] = useState<'song' | 'kai'>('song');
  const [lastRead, setLastRead] = useState<{ n: number; label: string; t1: string } | null>(null);
  const [selBar, setSelBar] = useState<{ x: number; y: number; text: string } | null>(null);
  const [noteFilter, setNoteFilter] = useState<'all' | 'note' | 'mark'>('all');
  const [notes, setNotes] = useState<{ id: string; type: string; ch: number; quote: string; comment: string }[]>([]);
  const [toast, setToast] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const marks = useMemo(() => buildMarks(), []);
  const list = toc;

  useEffect(() => {
    const clamp = (raw: string | null, fallback: number, min: number, max: number) => {
      if (raw == null || raw === '') return fallback;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < min || n > max) return fallback;
      return n;
    };
    const fs = clamp(localStorage.getItem('hl:fontSize'), 19, 16, 26);
    const lh = clamp(localStorage.getItem('hl:lineHeight'), 1.95, 1.4, 2.6);
    const rw = clamp(localStorage.getItem('hl:width'), 38, 28, 52);
    const th = localStorage.getItem('hl:theme') || 'paper';
    const fm = (localStorage.getItem('hl:font') as 'song' | 'kai') || 'song';
    setFontSize(fs);
    setLineHeight(lh);
    setReadWidth(rw);
    setTheme(th);
    setFontMode(fm === 'kai' ? 'kai' : 'song');
    document.documentElement.setAttribute('data-theme', th);
    try {
      setNotes(JSON.parse(localStorage.getItem('hl:notes') || '[]'));
    } catch { setNotes([]); }
    localStorage.setItem('hl:chapter', String(chapter.n));
    const lastN = Number(localStorage.getItem('hl:lastN') || 0);
    if (lastN && lastN !== chapter.n) {
      const item = toc.find((c) => c.n === lastN);
      if (item) setLastRead(item);
    }
    // restore scroll position for this chapter
    const saved = Number(localStorage.getItem('hl:scroll:' + chapter.n) || 0);
    requestAnimationFrame(() => {
      const body = bodyRef.current;
      if (body && saved > 0) body.scrollTop = saved;
    });
  }, [chapter.n, toc]);

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--read-size', fontSize + 'px');
    r.style.setProperty('--read-lh', String(lineHeight));
    r.style.setProperty('--read-width', readWidth + 'rem');
    r.style.setProperty('--read-font', fontMode === 'kai'
      ? '"Kaiti SC", "STKaiti", "KaiTi", "楷体", serif'
      : '"Noto Serif SC", "Songti SC", "STSong", "SimSun", serif');
  }, [fontSize, lineHeight, readWidth, fontMode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.matches('input, textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'k') {
        if (next) location.href = `/read/${next.n}/`;
      }
      if (e.key === 'ArrowLeft' || e.key === 'j') {
        if (prev) location.href = `/read/${prev.n}/`;
      }
      if (e.key === 'Escape') {
        setTocOpen(false);
        setSetOpen(false);
        setNotesOpen(false);
      }
      if (e.key === 'n' || e.key === 'N') setNotesOpen((v) => !v);
      if (e.key === 't' || e.key === 'T') {
        const order = ['paper', 'sepia', 'night'];
        const nx = order[(order.indexOf(theme) + 1) % order.length];
        setTheme(nx);
        localStorage.setItem('hl:theme', nx);
        document.documentElement.setAttribute('data-theme', nx);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, theme]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 1600);
  }

  function onBodyClick(e: React.MouseEvent) {
    const noteEl = (e.target as HTMLElement).closest('.note-wave, .hl-underline') as HTMLElement | null;
    if (noteEl?.dataset.noteId) {
      const n = notes.find((x) => x.id === noteEl.dataset.noteId);
      if (n) {
        const r = noteEl.getBoundingClientRect();
        setActiveNote({
          id: n.id,
          quote: n.quote,
          comment: n.comment || '（无批语，仅划线）',
          x: Math.min(window.innerWidth - 300, Math.max(16, r.left)),
          y: Math.min(window.innerHeight - 160, r.bottom + 10),
        });
        return;
      }
    }
    const el = (e.target as HTMLElement).closest('.mark') as HTMLElement | null;
    if (!el) return;
    const id = el.dataset.char;
    const c = getCharacter(id!);
    if (c) openChar(c);
  }

  const [modalChar, setModalChar] = useState<Character | null>(null);
  const [activeNote, setActiveNote] = useState<{ id: string; quote: string; comment: string; x: number; y: number } | null>(null);
  const [composer, setComposer] = useState<{ quote: string; kind: 'note' | 'mark' } | null>(null);
  const [composerText, setComposerText] = useState('');
  const [twelveDetail, setTwelveDetail] = useState<TwelveDetail | null>(null);
  function openChar(c: Character) {
    setModalChar(c);
    setTwelveDetail(null);
  }

  function saveNote(item: { id: string; type: string; ch: number; quote: string; comment: string }) {
    const nextNotes = [item, ...notes];
    setNotes(nextNotes);
    localStorage.setItem('hl:notes', JSON.stringify(nextNotes));
  }

  function openComposer(text: string, kind: 'note' | 'mark') {
    if (!text) return showToast('请先在正文中选中一段文字');
    if (text.length > 200) return showToast('选中文字请控制在 200 字内');
    setComposerText('');
    setComposer({ quote: text, kind });
  }

  function commitComposer() {
    if (!composer) return;
    saveNote({
      id: (composer.kind === 'note' ? 'n' : 'm') + Date.now(),
      type: composer.kind,
      ch: chapter.n,
      quote: composer.quote,
      comment: composerText.trim(),
    });
    window.getSelection()?.removeAllRanges();
    setSelBar(null);
    setComposer(null);
    setComposerText('');
    showToast(composer.kind === 'note' ? '已保存批注' : '已划线');
  }

  function addNoteFromSel() {
    openComposer(selBar?.text || '', 'note');
  }

  function addMarkFromSel() {
    openComposer(selBar?.text || '', 'mark');
  }

  function addNote() {
    const text = (window.getSelection()?.toString() || '').trim();
    openComposer(text, 'note');
  }

  function addBookmark() {
    if (notes.some((n) => n.type === 'mark' && n.quote === chapter.label + '　' + chapter.t1)) {
      showToast('本回已有书签');
      setNotesOpen(true);
      return;
    }
    saveNote({
      id: 'b' + Date.now(),
      type: 'mark',
      ch: chapter.n,
      quote: chapter.label + '　' + chapter.t1,
      comment: '',
    });
    showToast('已加入书签');
    setNotesOpen(true);
  }

  function delNote(id: string) {
    const nextNotes = notes.filter((n) => n.id !== id);
    setNotes(nextNotes);
    localStorage.setItem('hl:notes', JSON.stringify(nextNotes));
  }

  function onMouseUp(e: React.MouseEvent) {
    const sel = window.getSelection();
    const text = (sel?.toString() || '').trim();
    if (!text || text.length > 200) {
      setSelBar(null);
      return;
    }
    // only when selection is inside reader body
    const anchor = sel?.anchorNode;
    const body = bodyRef.current;
    if (!body || !anchor || !body.contains(anchor)) {
      setSelBar(null);
      return;
    }
    const rect = sel!.getRangeAt(0).getBoundingClientRect();
    setSelBar({
      x: rect.left + rect.width / 2,
      y: rect.top - 12,
      text,
    });
  }

  function exportNotes(kind: 'md' | 'txt' | 'json') {
    const list = notes.filter((n) => noteFilter === 'all' || n.type === noteFilter);
    let content = '';
    let ext = 'txt';
    let mime = 'text/plain;charset=utf-8';
    if (kind === 'json') {
      content = JSON.stringify({ exportedAt: new Date().toISOString(), notes: list }, null, 2);
      ext = 'json';
      mime = 'application/json';
    } else if (kind === 'md') {
      const groups = new Map<number, typeof list>();
      for (const n of list) {
        if (!groups.has(n.ch)) groups.set(n.ch, []);
        groups.get(n.ch)!.push(n);
      }
      const parts = ['# 红楼梦 · 批注与收藏', '', `导出时间：${new Date().toLocaleString()}`, ''];
      for (const [ch, items] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
        parts.push(`## 第${toCN(ch)}回`, '');
        for (const n of items) {
          parts.push(`- **${n.type === 'mark' ? '划线' : '批注'}** > ${n.quote}`);
          if (n.comment) parts.push(`  - ${n.comment}`);
        }
        parts.push('');
      }
      content = parts.join('\n');
      ext = 'md';
      mime = 'text/markdown;charset=utf-8';
    } else {
      const parts = ['红楼梦 · 批注与收藏', `导出时间：${new Date().toLocaleString()}`, ''];
      for (const n of list) {
        parts.push(`[第${toCN(n.ch)}回] ${n.type === 'mark' ? '划线' : '批注'}`);
        parts.push(n.quote);
        if (n.comment) parts.push('评：' + n.comment);
        parts.push('');
      }
      content = parts.join('\n');
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `honglou-notes.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`已导出 ${ext.toUpperCase()}`);
  }

  function onScroll() {
    const body = bodyRef.current;
    const bar = progressRef.current;
    if (!body || !bar) return;
    const max = body.scrollHeight - body.clientHeight;
    bar.style.width = max > 0 ? (body.scrollTop / max) * 100 + '%' : '0%';
    localStorage.setItem('hl:scroll:' + chapter.n, String(Math.round(body.scrollTop)));
    localStorage.setItem('hl:lastN', String(chapter.n));
  }

  const filteredToc = tocFilter
    ? list.filter(
        (c) =>
          (c.label + c.title + c.t1 + c.t2).includes(tocFilter) ||
          String(c.n) === tocFilter ||
          chapter.paras.some((p) => p.includes(tocFilter))
      )
    : list;

  // only filter toc by titles when filter present; body match uses current chapter only is wrong
  // better: filter list by title OR we need all paras - for static we filter titles primarily
  const tocList = tocFilter
    ? list.filter((c) => (c.label + c.title + c.t1 + c.t2).includes(tocFilter) || String(c.n) === tocFilter)
    : list;

  return (
    <div className="reader-shell">
      <div className="read-progress" ref={progressRef} />
      <div className="reader-top">
        <button className="icon-btn" onClick={() => setTocOpen(true)} title="目录">
          <svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h10" /></svg>
        </button>
        <div className="title">
          <div className="ch">{chapter.label} · 第 {chapter.n} / 120 回</div>
          <h2>{chapter.t1}　{chapter.t2}</h2>
        </div>
        {prev ? (
          <Link className="icon-btn" href={`/read/${prev.n}/`} title="上一回">
            <svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6" /></svg>
          </Link>
        ) : <span style={{ width: 40 }} />}
        {next ? (
          <Link className="icon-btn" href={`/read/${next.n}/`} title="下一回">
            <svg viewBox="0 0 24 24"><path d="m10 6 6 6-6 6" /></svg>
          </Link>
        ) : <span style={{ width: 40 }} />}
        <button className="icon-btn" onClick={() => setNotesOpen(true)} title="批注与书签">
          <svg viewBox="0 0 24 24"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z" /></svg>
        </button>
        <button className="icon-btn" onClick={() => setSetOpen(true)} title="阅读设置">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2M12 18.5v2M4.8 7.5l1.7 1M17.5 15.5l1.7 1M4.8 16.5l1.7-1M17.5 8.5l1.7-1" /></svg>
        </button>
      </div>

      <div className="reader-body" ref={bodyRef} onScroll={onScroll} onClick={onBodyClick} onMouseUp={onMouseUp}>
        <article className="chapter">
          <header className="chapter-header">
            <div className="num">{chapter.label}</div>
            <h1>{chapter.t1}</h1>
            <div className="pair">{chapter.t2}</div>
          </header>
          {chapter.paras.map((p, i) => (
            <p
              key={i}
              className={i === 0 ? 'open' : ''}
              dangerouslySetInnerHTML={{
                __html: annotateParagraph(
                  p,
                  marks,
                  notes.filter((n) => n.ch === chapter.n && (n.type === 'note' || n.type === 'mark')),
                ),
              }}
            />
          ))}
          <nav className="nav-chapter">
            {prev ? (
              <Link href={`/read/${prev.n}/`}>
                <span className="lbl">上一回</span>
                <span className="nm">{prev.label}　{prev.t1}</span>
              </Link>
            ) : <span />}
            {next ? (
              <Link className="next" href={`/read/${next.n}/`}>
                <span className="lbl">下一回</span>
                <span className="nm">{next.label}　{next.t1}</span>
              </Link>
            ) : <span />}
          </nav>
        </article>
      </div>

      {activeNote ? (
        <div className="note-pop" style={{ left: activeNote.x, top: activeNote.y }} onClick={(e) => e.stopPropagation()}>
          <div className="note-pop-kicker">批注</div>
          <div className="note-pop-q">{activeNote.quote}</div>
          <div className="note-pop-c">{activeNote.comment}</div>
          <div className="note-pop-a">
            <button className="btn sm ghost" onClick={() => setActiveNote(null)}>关闭</button>
            <button
              className="btn sm ghost"
              onClick={() => {
                delNote(activeNote.id);
                setActiveNote(null);
                showToast('已删除');
              }}
            >
              删除
            </button>
          </div>
        </div>
      ) : null}

      {composer ? (
        <div className="note-composer-wrap" onClick={() => setComposer(null)}>
          <div className="note-composer" onClick={(e) => e.stopPropagation()}>
            <div className="note-composer-kicker">{composer.kind === 'note' ? '批注' : '划线'} · {chapter.label}</div>
            <blockquote className="note-composer-quote">{composer.quote}</blockquote>
            {composer.kind === 'note' ? (
              <textarea
                className="note-composer-input"
                placeholder="写下你的批语（可留空）…"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                autoFocus
                rows={4}
              />
            ) : (
              <p className="note-composer-hint">将用金色衬底标出这段文字。</p>
            )}
            <div className="note-composer-a">
              <button className="btn sm ghost" onClick={() => setComposer(null)}>取消</button>
              <button className="btn sm accent" onClick={commitComposer}>
                {composer.kind === 'note' ? '保存批注' : '划线'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selBar ? (
        <div
          className="sel-toolbar"
          style={{ left: selBar.x, top: selBar.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button className="btn sm accent" onClick={addNoteFromSel}>批注</button>
          <button className="btn sm ghost" onClick={addMarkFromSel}>划线</button>
          <button
            className="btn sm ghost"
            onClick={() => {
              navigator.clipboard?.writeText(selBar.text);
              setSelBar(null);
              showToast('已复制');
            }}
          >
            复制
          </button>
        </div>
      ) : null}

      <div className={`overlay ${tocOpen || setOpen || notesOpen ? 'open' : ''}`} onClick={() => { setTocOpen(false); setSetOpen(false); setNotesOpen(false); setSelBar(null); setActiveNote(null); }} />

      <aside className={`drawer ${tocOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <h3>目录 · 一百二十回</h3>
          <button className="icon-btn" onClick={() => setTocOpen(false)}>×</button>
        </div>
        <div className="drawer-search">
          <input placeholder="筛选回目…" value={tocFilter} onChange={(e) => setTocFilter(e.target.value)} />
        </div>
        {lastRead ? (
          <Link
            href={`/read/${lastRead.n}/`}
            className="toc-item"
            style={{ margin: '0 12px 8px', background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}
            onClick={() => setTocOpen(false)}
          >
            <span className="n">续</span>
            <span className="t">
              继续阅读 · {lastRead.label}
              <br />
              <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>{lastRead.t1}</span>
            </span>
          </Link>
        ) : null}
        <div className="toc-list">
          {(tocFilter ? tocList : list).map((c) => (
            <Link key={c.n} href={`/read/${c.n}/`} className={`toc-item ${c.n === chapter.n ? 'active' : ''}`} onClick={() => setTocOpen(false)}>
              <span className="n">{c.label.replace('第', '').replace('回', '')}</span>
              <span className="t">{c.t1}<br /><span style={{ color: 'var(--ink-3)', fontSize: 12 }}>{c.t2}</span></span>
            </Link>
          ))}
          {tocFilter && tocList.length === 0 && <div className="empty">无匹配回目</div>}
        </div>
      </aside>

      <aside className={`drawer right ${notesOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <h3>批注与书签</h3>
          <button className="icon-btn" onClick={() => setNotesOpen(false)}>×</button>
        </div>
        <div className="drawer-search" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn sm accent" style={{ flex: 1 }} onClick={addNote}>对选中文字做批注</button>
          <button className="btn sm ghost" onClick={addBookmark}>书签本回</button>
        </div>
        <div className="drawer-search" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([
            { id: 'all', name: '全部' },
            { id: 'note', name: '批注' },
            { id: 'mark', name: '收藏' },
          ] as const).map((f) => (
            <button
              key={f.id}
              className={`btn sm ${noteFilter === f.id ? 'accent' : 'ghost'}`}
              onClick={() => setNoteFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
          <button className="btn sm ghost" onClick={() => exportNotes('md')}>MD</button>
          <button className="btn sm ghost" onClick={() => exportNotes('txt')}>TXT</button>
          <button className="btn sm ghost" onClick={() => exportNotes('json')}>JSON</button>
        </div>
        <div className="toc-list">
          {notes.filter((n) => noteFilter === 'all' || n.type === noteFilter).length === 0 && (
            <div className="empty">暂无内容<br /><span style={{ fontSize: 12, opacity: 0.7 }}>阅读时选中文字，可批注或划线</span></div>
          )}
          {notes.filter((n) => noteFilter === 'all' || n.type === noteFilter).map((n) => (
            <div key={n.id} className="note-item">
              <div className="note-top">
                <span className={`pill ${n.type === 'mark' ? 'gold' : 'accent'}`}>{n.type === 'mark' ? '划线' : '批注'}</span>
                <Link href={`/read/${n.ch}/`} className="note-ch">第{toCN(n.ch)}回</Link>
                <button className="icon-btn note-del" style={{ marginLeft: 'auto', width: 28, height: 28 }} onClick={() => delNote(n.id)}>×</button>
              </div>
              <div className="note-quote">{n.quote}</div>
              {n.comment ? <div className="note-comment">{n.comment}</div> : null}
              <Link href={`/read/${n.ch}/`} className="note-jump">回到此处 →</Link>
            </div>
          ))}
        </div>
      </aside>

      <aside className={`drawer right ${setOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <h3>阅读设置</h3>
          <button className="icon-btn" onClick={() => setSetOpen(false)}>×</button>
        </div>
        <div className="settings">
          <div className="set-row">
            <label>主题</label>
            <div className="theme-row">
              {(['paper', 'sepia', 'night'] as const).map((t) => (
                <button
                  key={t}
                  className={`theme-btn ${theme === t ? 'active' : ''}`}
                  data-set-theme={t}
                  title={t}
                  onClick={() => {
                    setTheme(t);
                    localStorage.setItem('hl:theme', t);
                    document.documentElement.setAttribute('data-theme', t);
                  }}
                />
              ))}
            </div>
          </div>
          <div className="set-row">
            <label>字号 {fontSize}px</label>
            <input type="range" min={16} max={28} value={fontSize}
              onChange={(e) => { setFontSize(+e.target.value); localStorage.setItem('hl:fontSize', e.target.value); }} />
          </div>
          <div className="set-row">
            <label>行距 {lineHeight.toFixed(2)}</label>
            <input type="range" min={150} max={240} step={5} value={Math.round(lineHeight * 100)}
              onChange={(e) => { setLineHeight(+e.target.value / 100); localStorage.setItem('hl:lineHeight', String(+e.target.value / 100)); }} />
          </div>
          <div className="set-row">
            <label>栏宽 {readWidth}rem</label>
            <input type="range" min={28} max={52} value={readWidth}
              onChange={(e) => { setReadWidth(+e.target.value); localStorage.setItem('hl:width', e.target.value); }} />
          </div>
          <div className="set-row">
            <label>字体</label>
            <div className="theme-row" style={{ gap: 8 }}>
              {([
                { id: 'song', name: '宋体' },
                { id: 'kai', name: '楷体' },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  className={`btn sm ${fontMode === f.id ? 'accent' : 'ghost'}`}
                  onClick={() => {
                    setFontMode(f.id);
                    localStorage.setItem('hl:font', f.id);
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          <div className="set-row">
            <label>快捷键</label>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.9 }}>
              <div><b style={{ color: 'var(--ink)' }}>← / J</b> 上一回</div>
              <div><b style={{ color: 'var(--ink)' }}>→ / K</b> 下一回</div>
              <div><b style={{ color: 'var(--ink)' }}>T</b> 切换主题</div>
              <div><b style={{ color: 'var(--ink)' }}>N</b> 批注与书签</div>
              <div><b style={{ color: 'var(--ink)' }}>Esc</b> 关闭面板</div>
            </div>
          </div>
        </div>
      </aside>

      {modalChar && (() => {
        const twelve = getTwelveDetail(modalChar.id);
        const art = modalChar.image || twelve?.image;
        return (
          <div className="modal-wrap" onClick={() => setModalChar(null)}>
            <div className={`modal ${art ? 'has-art' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-identity">
                  {art ? (
                    <div className="char-art">
                      <img src={asset(art)} alt={modalChar.name} width={128} height={80} loading="lazy" decoding="async" />
                    </div>
                  ) : null}
                  <div>
                    <div className={`pill ${modalChar.gender === '女' ? 'accent' : 'jade'}`} style={{ marginBottom: 8 }}>
                      {twelve
                        ? `${twelve.register === 'zheng' ? '正册' : twelve.register === 'fu' ? '副册' : '又副册'} · ${modalChar.role}`
                        : `${modalChar.gender} · ${modalChar.role}`}
                    </div>
                    <h2>{modalChar.name}</h2>
                    <div style={{ color: 'var(--ink-3)', marginTop: 6, fontSize: 13 }}>{modalChar.tag}</div>
                  </div>
                </div>
                <button className="icon-btn" onClick={() => setModalChar(null)}>×</button>
              </div>
              <div className="modal-body">
                <p>{modalChar.bio}</p>
                {modalChar.fate ? <div className="meta-row"><span className="pill accent">结局：{modalChar.fate}</span></div> : null}
                <div className="meta-row">
                  {twelve ? (
                    <button className="btn accent sm" onClick={() => setTwelveDetail(twelve)}>
                      判词详述
                    </button>
                  ) : null}
                  <Link className="pill" href={`/read/${modalChar.firstCh}/`}>第{toCN(modalChar.firstCh)}回初现</Link>
                  <Link className="pill" href={`/search/?q=${encodeURIComponent(modalChar.name)}`}>检索“{modalChar.name}”</Link>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 8, marginBottom: 8 }}>人物关系</div>
                  <div className="meta-row">
                    {getRelationsFor(modalChar.id).map((r, i) => (
                      <button key={i} className="pill" onClick={() => openChar(r.other)}>
                        {r.other.name}<span style={{ opacity: 0.65 }}>·{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <TwelveDetailModal detail={twelveDetail} onClose={() => setTwelveDetail(null)} />

      {toast ? <div className="toast show">{toast}</div> : null}
    </div>
  );
}
