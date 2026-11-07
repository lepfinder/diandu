'use client';

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { annotateParagraph } from './annotate';
import { loadNotes, readNumber, readString, saveNotes, write } from './storage';
import type { ReaderChromeProps, ReaderLinkProps, ReaderNote } from './types';
import { useCompact } from './useCompact';

const DefaultLink = ({ href, children, ...rest }: ReaderLinkProps) => (
  <a href={href} {...rest}>{children}</a>
);

function clipQuote(text: string, max = 72) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function ReaderChrome({
  storagePrefix,
  chapter,
  toc,
  prev,
  next,
  linkComponent,
  footer,
  headerExtra,
  features,
  bookTitle = '笔记',
}: ReaderChromeProps) {
  const Link = (linkComponent || DefaultLink) as ElementType<ReaderLinkProps>;
  const notesEnabled = features?.notes !== false;
  const compact = useCompact();

  const [tocOpen, setTocOpen] = useState(false);
  const [setOpen, setSetOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [marginVisible, setMarginVisible] = useState(true);
  const [tocFilter, setTocFilter] = useState('');
  const [noteFilter, setNoteFilter] = useState<'all' | 'note' | 'mark'>('all');
  const [fontSize, setFontSize] = useState(19);
  const [lineHeight, setLineHeight] = useState(1.95);
  const [readWidth, setReadWidth] = useState(38);
  const [theme, setTheme] = useState('paper');
  const [fontMode, setFontMode] = useState<'song' | 'kai'>('song');
  const [notes, setNotes] = useState<ReaderNote[]>([]);
  const [toast, setToast] = useState('');
  const [selBar, setSelBar] = useState<{
    x: number;
    y: number;
    text: string;
    rects: Array<{ top: number; left: number; width: number; height: number }>;
  } | null>(null);
  const [composer, setComposer] = useState<{ quote: string; kind: 'note' | 'mark' } | null>(null);
  const [composerText, setComposerText] = useState('');
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const tocListRef = useRef<HTMLDivElement>(null);
  const notesListRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);
  const skipSelClearRef = useRef(false);
  const flashTimerRef = useRef(0);
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const [marginPos, setMarginPos] = useState<Array<{ id: string; top: number }>>([]);

  const index = toc.findIndex((item) => item.n === chapter.n);
  const position = index >= 0 ? index + 1 : 0;

  useEffect(() => {
    setFontSize(readNumber(storagePrefix, 'fontSize', 19));
    setLineHeight(readNumber(storagePrefix, 'lineHeight', 1.95));
    setReadWidth(readNumber(storagePrefix, 'width', 38));
    const th = readString(storagePrefix, 'theme', 'paper');
    const fm = readString(storagePrefix, 'font', 'song') === 'kai' ? 'kai' : 'song';
    setTheme(th);
    setFontMode(fm);
    document.documentElement.setAttribute('data-theme', th);
    if (notesEnabled) {
      setNotes(loadNotes(storagePrefix));
      setMarginVisible(readString(storagePrefix, 'margin', '1') !== '0');
    }
    hydrated.current = true;
    write(storagePrefix, 'chapter', chapter.n);
    const saved = readNumber(storagePrefix, `scroll:${chapter.n}`, 0);
    requestAnimationFrame(() => {
      if (bodyRef.current && saved > 0) bodyRef.current.scrollTop = saved;
    });
  }, [chapter.n, notesEnabled, storagePrefix]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--read-size', `${fontSize}px`);
    root.style.setProperty('--read-lh', String(lineHeight));
    root.style.setProperty('--read-width', `${readWidth}rem`);
    root.style.setProperty(
      '--read-font',
      fontMode === 'kai'
        ? '"Kaiti SC", "STKaiti", "KaiTi", "楷体", serif'
        : '"Songti SC", "STSong", "SimSun", "Noto Serif SC", serif',
    );
    if (!hydrated.current) return;
    write(storagePrefix, 'fontSize', fontSize);
    write(storagePrefix, 'lineHeight', lineHeight);
    write(storagePrefix, 'width', readWidth);
    write(storagePrefix, 'font', fontMode);
  }, [fontMode, fontSize, lineHeight, readWidth, storagePrefix]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (composer) {
          setComposer(null);
          return;
        }
        if (selBar) {
          setSelBar(null);
          window.getSelection()?.removeAllRanges();
          return;
        }
        closePanels();
        return;
      }
      if (composer && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        commitComposer();
        return;
      }
      if ((e.target as HTMLElement)?.matches('input, textarea')) return;
      if ((e.key === 'ArrowRight' || e.key === 'k') && next) location.href = `/read/${next.n}/`;
      if ((e.key === 'ArrowLeft' || e.key === 'j') && prev) location.href = `/read/${prev.n}/`;
      if (e.key === '/') {
        e.preventDefault();
        location.href = '/search/';
      }
      if (notesEnabled && (e.key === 'n' || e.key === 'N')) {
        // 桌面：切换侧栏批注；手机：打开笔记总览
        if (compact) {
          setNotesOpen((v) => !v);
          setTocOpen(false);
          setSetOpen(false);
        } else {
          setMarginVisible((v) => {
            const next = !v;
            write(storagePrefix, 'margin', next ? '1' : '0');
            return next;
          });
        }
      }
      if (notesEnabled && (e.key === 'b' || e.key === 'B')) {
        setNotesOpen((v) => !v);
        setTocOpen(false);
        setSetOpen(false);
      }
      if (e.key === 't' || e.key === 'T') {
        const order = ['paper', 'sepia', 'night'];
        applyTheme(order[(order.indexOf(theme) + 1) % order.length]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compact, composer, composerText, next, notesEnabled, prev, selBar, storagePrefix, theme]);

  function syncSelBar() {
    if (!notesEnabled) return;
    const sel = window.getSelection();
    const text = (sel?.toString() || '').trim();
    if (!text || text.length > 200) {
      setSelBar(null);
      return;
    }
    const anchor = sel?.anchorNode;
    const body = bodyRef.current;
    if (!body || !anchor || !body.contains(anchor) || !sel || sel.rangeCount === 0) {
      setSelBar(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelBar(null);
      return;
    }
    // 浮层一挂载，WebKit 往往会清掉原生选区；用 clientRects 画临时高亮顶住视觉
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ top: r.top, left: r.left, width: r.width, height: r.height }));
    skipSelClearRef.current = true;
    if (compact) {
      setSelBar({ x: 0, y: 0, text, rects });
    } else {
      setSelBar({
        x: Math.min(window.innerWidth - 24, Math.max(24, rect.left + rect.width / 2)),
        y: Math.max(12, rect.top - 12),
        text,
        rects,
      });
    }
  }

  useEffect(() => {
    if (!tocOpen) return;
    requestAnimationFrame(() => {
      tocListRef.current?.querySelector('.cr-toc-item.active')?.scrollIntoView({ block: 'center' });
    });
  }, [tocOpen, chapter.n]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1600);
  }

  function closePanels() {
    setTocOpen(false);
    setSetOpen(false);
    setNotesOpen(false);
    setSelBar(null);
    setFocusedNoteId(null);
    setComposer(null);
  }

  function flashNoteEl(el: HTMLElement) {
    const body = bodyRef.current;
    body?.querySelectorAll('.cr-note-flash').forEach((node) => node.classList.remove('cr-note-flash'));
    el.classList.add('cr-note-flash');
    window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      el.classList.remove('cr-note-flash');
    }, 2200);
  }

  function focusNote(noteId: string, flashEl?: HTMLElement | null, openDrawer = false) {
    const note = notesRef.current.find((item) => item.id === noteId);
    setSelBar(null);
    setComposer(null);
    setFocusedNoteId(noteId);
    if (flashEl) flashNoteEl(flashEl);
    // 手机仍用笔记抽屉；桌面靠右栏批注，不挡正文
    if (openDrawer || compact) {
      if (note && noteFilter !== 'all' && noteFilter !== note.type) {
        setNoteFilter('all');
      }
      setNotesOpen(true);
      setTocOpen(false);
      setSetOpen(false);
    }
  }

  function applyTheme(nextTheme: string) {
    setTheme(nextTheme);
    write(storagePrefix, 'theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  }

  function onScroll() {
    const body = bodyRef.current;
    if (!body) return;
    const max = body.scrollHeight - body.clientHeight;
    const pct = max > 0 ? body.scrollTop / max : 0;
    if (progressRef.current) progressRef.current.style.width = `${pct * 100}%`;
    write(storagePrefix, `scroll:${chapter.n}`, Math.round(body.scrollTop));
    write(storagePrefix, 'lastN', chapter.n);
    if (selBar) setSelBar(null);
  }

  function persist(nextNotes: ReaderNote[]) {
    setNotes(nextNotes);
    saveNotes(storagePrefix, nextNotes);
  }

  function openComposer(text: string) {
    if (!text) return showToast('请先在正文中选中一段文字');
    if (text.length > 200) return showToast('选中文字请控制在 200 字内');
    setSelBar(null);
    window.getSelection()?.removeAllRanges();
    setComposerText('');
    setComposer({ quote: text, kind: 'note' });
  }

  function commitMark(text: string) {
    if (!text) return showToast('请先在正文中选中一段文字');
    if (text.length > 200) return showToast('选中文字请控制在 200 字内');
    const id = `m${Date.now()}`;
    persist([
      {
        id,
        type: 'mark',
        ch: chapter.n,
        quote: text,
        comment: '',
      },
      ...notes,
    ]);
    setSelBar(null);
    window.getSelection()?.removeAllRanges();
    showToast('已划线');
  }

  function commitComposer() {
    if (!composer) return;
    const id = `n${Date.now()}`;
    persist([
      {
        id,
        type: 'note',
        ch: chapter.n,
        quote: composer.quote,
        comment: composerText.trim(),
      },
      ...notes,
    ]);
    window.getSelection()?.removeAllRanges();
    setSelBar(null);
    setComposer(null);
    setComposerText('');
    showToast('已保存批注');
    focusNote(id, null, false);
  }

  function delNote(id: string) {
    persist(notes.filter((note) => note.id !== id));
    if (focusedNoteId === id) setFocusedNoteId(null);
  }

  function revealNote(noteId: string, quiet = false) {
    const body = bodyRef.current;
    if (!body) return false;
    const el = body.querySelector(`[data-note-id="${CSS.escape(noteId)}"]`) as HTMLElement | null;
    if (!el) {
      if (!quiet) showToast('本回正文中未找到该段');
      return false;
    }
    setNotesOpen(false);
    setSelBar(null);
    setComposer(null);
    setFocusedNoteId(noteId);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    flashNoteEl(el);
    return true;
  }

  function jumpToNote(note: ReaderNote, e: ReactMouseEvent) {
    if (note.ch === chapter.n) {
      e.preventDefault();
      if (!revealNote(note.id) && note.comment === '书签') {
        setNotesOpen(false);
        bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('已回到本回开头');
      }
      return;
    }
    setNotesOpen(false);
  }

  function addBookmark() {
    const quote = `${chapter.label}　${chapter.t1}`;
    if (notes.some((note) => note.type === 'mark' && note.quote === quote)) {
      showToast('本回已有书签');
      setNotesOpen(true);
      return;
    }
    persist([
      {
        id: `b${Date.now()}`,
        type: 'mark',
        ch: chapter.n,
        quote,
        comment: '书签',
      },
      ...notes,
    ]);
    showToast('已添加书签');
    setNotesOpen(true);
  }

  useEffect(() => {
    if (!notesOpen || !focusedNoteId) return;
    requestAnimationFrame(() => {
      notesListRef.current
        ?.querySelector(`[data-sidebar-note="${CSS.escape(focusedNoteId)}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }, [focusedNoteId, notesOpen, noteFilter]);

  function onBodyClick(e: ReactMouseEvent) {
    const noteEl = (e.target as HTMLElement).closest('.cr-note-wave, .cr-hl') as HTMLElement | null;
    if (noteEl?.dataset.noteId) {
      focusNote(noteEl.dataset.noteId, noteEl, false);
      return;
    }
    if (skipSelClearRef.current) {
      skipSelClearRef.current = false;
      return;
    }
    if (selBar && !(e.target as HTMLElement).closest('.cr-selbar')) {
      setSelBar(null);
      window.getSelection()?.removeAllRanges();
    }
  }

  useEffect(() => {
    if (!notesEnabled) return;
    const raw = window.location.hash.startsWith('#note-')
      ? decodeURIComponent(window.location.hash.slice(6))
      : '';
    if (!raw) return;
    let tries = 0;
    let timer = 0;
    const clearHash = () => {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    };
    const tick = () => {
      tries += 1;
      if (revealNote(raw, true) || tries >= 10) {
        clearHash();
        return;
      }
      timer = window.setTimeout(tick, 80);
    };
    timer = window.setTimeout(tick, 80);
    return () => window.clearTimeout(timer);
  }, [chapter.n, notesEnabled]);

  function exportNotes(kind: 'md' | 'txt' | 'json') {
    const list = notes.filter((note) => noteFilter === 'all' || note.type === noteFilter);
    let content = '';
    let ext = 'txt';
    let mime = 'text/plain;charset=utf-8';
    if (kind === 'json') {
      content = JSON.stringify({ exportedAt: new Date().toISOString(), notes: list }, null, 2);
      ext = 'json';
      mime = 'application/json';
    } else if (kind === 'md') {
      const parts = [`# ${bookTitle}`, '', `导出时间：${new Date().toLocaleString()}`, ''];
      for (const note of list) {
        parts.push(`- **${note.type === 'mark' ? '划线' : '批注'}**（第 ${note.ch} 回）> ${note.quote}`);
        if (note.comment) parts.push(`  - ${note.comment}`);
      }
      content = parts.join('\n');
      ext = 'md';
      mime = 'text/markdown;charset=utf-8';
    } else {
      const parts = [bookTitle, `导出时间：${new Date().toLocaleString()}`, ''];
      for (const note of list) {
        parts.push(`[第 ${note.ch} 回] ${note.type === 'mark' ? '划线' : '批注'}`);
        parts.push(note.quote);
        if (note.comment) parts.push(`评：${note.comment}`);
        parts.push('');
      }
      content = parts.join('\n');
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${storagePrefix}-notes.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`已导出 ${ext.toUpperCase()}`);
  }

  const filtered = toc.filter((item) => {
    const q = tocFilter.trim();
    if (!q) return true;
    return item.label.includes(q) || item.t1.includes(q) || (item.t2 || '').includes(q) || String(item.n) === q;
  });

  const chapterNotes = notes.filter((note) => note.ch === chapter.n);
  const marginNotes = chapterNotes.filter((note) => note.type === 'note');
  const showMargin = notesEnabled && !compact && marginVisible && marginNotes.length > 0;

  function toggleMarginVisible() {
    if (compact) {
      setNotesOpen(true);
      setTocOpen(false);
      setSetOpen(false);
      return;
    }
    const next = !marginVisible;
    setMarginVisible(next);
    write(storagePrefix, 'margin', next ? '1' : '0');
    if (next && marginNotes.length === 0) {
      showToast('本回暂无批注，选中正文可添加');
    } else {
      showToast(next ? '已显示侧栏批注' : '已隐藏侧栏批注');
    }
  }
  const marginNoteKey = marginNotes.map((note) => note.id).join('|');
  const panelOpen = tocOpen || setOpen || notesOpen;

  useEffect(() => {
    if (!showMargin) {
      setMarginPos([]);
      return;
    }
    const ids = marginNoteKey.split('|').filter(Boolean);
    let raf = 0;
    function measure() {
      const frame = frameRef.current;
      if (!frame) return;
      const frameTop = frame.getBoundingClientRect().top;
      const desired = ids.map((id) => {
        const el = frame.querySelector(`[data-note-id="${CSS.escape(id)}"]`) as HTMLElement | null;
        const top = el ? el.getBoundingClientRect().top - frameTop : 0;
        return { id, top: Math.max(0, top) };
      }).sort((a, b) => a.top - b.top);

      let cursor = 0;
      const next = desired.map((item) => {
        const top = Math.max(item.top, cursor);
        const node = frame.querySelector(`[data-margin-note="${CSS.escape(item.id)}"]`) as HTMLElement | null;
        const height = node?.offsetHeight || 72;
        cursor = top + height + 14;
        return { id: item.id, top };
      });
      setMarginPos((prev) => {
        if (
          prev.length === next.length
          && prev.every((item, i) => item.id === next[i].id && Math.abs(item.top - next[i].top) < 1)
        ) {
          return prev;
        }
        return next;
      });
    }
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measure();
        requestAnimationFrame(measure);
      });
    };
    run();
    const frame = frameRef.current;
    const ro = frame ? new ResizeObserver(run) : null;
    if (frame && ro) ro.observe(frame);
    window.addEventListener('resize', run);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', run);
    };
  }, [showMargin, marginNoteKey, fontSize, lineHeight, readWidth, chapter.n]);

  return (
    <div className={`cr-shell${compact ? ' is-compact' : ''}${showMargin ? ' has-margin' : ''}`}>
      <div className="cr-progress" ref={progressRef} />
      <header className="cr-top">
        <button type="button" className="cr-icon" onClick={() => { setTocOpen(true); setSetOpen(false); setNotesOpen(false); }} title="目录" aria-label="目录">
          <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
        </button>
        <div className="cr-title">
          <div className="cr-ch">
            {chapter.label}
            <span className="cr-pos">{position} / {toc.length}</span>
          </div>
          <h2>{chapter.t1}</h2>
        </div>
        {notesEnabled ? (
          <button
            type="button"
            className={`cr-icon${(!compact && marginVisible) ? ' on' : ''}`}
            onClick={toggleMarginVisible}
            title={compact ? '笔记' : (marginVisible ? '隐藏侧栏批注' : '显示侧栏批注')}
            aria-label={compact ? '笔记' : (marginVisible ? '隐藏侧栏批注' : '显示侧栏批注')}
            aria-pressed={!compact ? marginVisible : undefined}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M15 4v16" />
            </svg>
          </button>
        ) : null}
        <button type="button" className="cr-icon" onClick={() => { setSetOpen(true); setTocOpen(false); setNotesOpen(false); }} title="版式" aria-label="版式">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12H5M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>
        </button>
      </header>

      <div
        className="cr-body"
        ref={bodyRef}
        onScroll={onScroll}
        onClick={onBodyClick}
        onMouseUp={() => {
          // 等浏览器落定选区再出工具条，避免 selectionchange 连环 setState 闪烁
          window.requestAnimationFrame(syncSelBar);
        }}
        onTouchEnd={() => {
          window.setTimeout(syncSelBar, 0);
        }}
      >
        <div className={`cr-read-frame${showMargin ? ' has-margin' : ''}`} ref={frameRef}>
          <article className="cr-chapter">
            <header className="cr-chapter-head">
              <div className="cr-num">{chapter.label}</div>
              <h1>{chapter.t1}</h1>
              <div className="cr-pair">{chapter.t2}</div>
              {headerExtra}
            </header>
            {chapter.paras.map((para, i) => (
              <p
                key={i}
                className={i === 0 ? 'open' : undefined}
                dangerouslySetInnerHTML={{
                  __html: notesEnabled
                    ? annotateParagraph(para, chapterNotes)
                    : para.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                }}
              />
            ))}
            {footer}
            <nav className="cr-nav">
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
          {showMargin ? (
            <aside className="cr-margin" aria-label="本回批注">
              {marginNotes.map((note) => {
                const pos = marginPos.find((item) => item.id === note.id);
                return (
                  <button
                    key={note.id}
                    type="button"
                    data-margin-note={note.id}
                    className={`cr-margin-note${focusedNoteId === note.id ? ' active' : ''}`}
                    style={{ top: pos?.top ?? 0 }}
                    onClick={() => {
                      const el = frameRef.current?.querySelector(
                        `[data-note-id="${CSS.escape(note.id)}"]`,
                      ) as HTMLElement | null;
                      focusNote(note.id, el, false);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <span className="cr-margin-kicker">批</span>
                    <span className="cr-margin-body">
                      {note.comment?.trim() || clipQuote(note.quote, 36)}
                    </span>
                    {note.comment?.trim() ? (
                      <span className="cr-margin-quote">{clipQuote(note.quote, 22)}</span>
                    ) : null}
                  </button>
                );
              })}
            </aside>
          ) : null}
        </div>
      </div>

      {composer ? (
        <div className="cr-composer-wrap" onClick={() => setComposer(null)}>
          <div className="cr-composer" onClick={(e) => e.stopPropagation()}>
            <div className="cr-composer-handle" aria-hidden />
            <div className="cr-composer-head">
              <span className="cr-composer-badge">批注</span>
              <span className="cr-composer-ch">{chapter.label}</span>
            </div>
            <blockquote className="cr-composer-quote">
              <span className="cr-composer-mark" aria-hidden>「</span>
              <p title={composer.quote}>{clipQuote(composer.quote, 96)}</p>
            </blockquote>
            <label className="cr-composer-field">
              <span className="cr-composer-label">批语</span>
              <textarea
                placeholder="写下你的批语，可留空…（⌘/Ctrl + Enter 保存）"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setComposer(null);
                    return;
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    commitComposer();
                  }
                }}
                autoFocus
                rows={4}
              />
            </label>
            <div className="cr-actions">
              <button type="button" className="cr-btn ghost" onClick={() => setComposer(null)}>取消</button>
              <button type="button" className="cr-btn primary" onClick={commitComposer}>
                保存批注
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selBar
        ? selBar.rects.map((r, i) => (
            <div
              key={`sel-ghost-${i}`}
              className="cr-sel-ghost"
              style={{ top: r.top, left: r.left, width: r.width, height: r.height }}
              aria-hidden
            />
          ))
        : null}
      {selBar ? (
        <div
          className={`cr-selbar${compact ? ' bottom' : ''}`}
          style={compact ? undefined : { left: selBar.x, top: selBar.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button type="button" className="cr-sel-act primary" onClick={() => openComposer(selBar.text)}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
              <path d="M13.5 6.5l3 3" />
            </svg>
            <span>批注</span>
          </button>
          <i className="cr-sel-sep" aria-hidden />
          <button type="button" className="cr-sel-act" onClick={() => commitMark(selBar.text)}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M5 19h14" />
              <path d="M7 15l3.2-9h3.6L17 15" />
              <path d="M8.4 12h7.2" />
            </svg>
            <span>划线</span>
          </button>
          <i className="cr-sel-sep" aria-hidden />
          <button
            type="button"
            className="cr-sel-act"
            onClick={() => {
              navigator.clipboard?.writeText(selBar.text);
              setSelBar(null);
              showToast('已复制');
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="8" y="8" width="11" height="12" rx="2" />
              <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>复制</span>
          </button>
        </div>
      ) : null}

      <div className={`cr-overlay${panelOpen ? ' open' : ''}`} onClick={closePanels} />

      <aside className={`cr-drawer${tocOpen ? ' open' : ''}`}>
        <div className="cr-drawer-head">
          <h3>目录</h3>
          <button type="button" className="cr-icon" onClick={() => setTocOpen(false)} aria-label="关闭">×</button>
        </div>
        <div className="cr-drawer-search">
          <input placeholder="搜回目，或输入回数" value={tocFilter} onChange={(e) => setTocFilter(e.target.value)} />
        </div>
        <div className="cr-toc-list" ref={tocListRef}>
          {filtered.map((item) => (
            <Link
              key={item.n}
              href={`/read/${item.n}/`}
              className={`cr-toc-item${item.n === chapter.n ? ' active' : ''}`}
              onClick={() => setTocOpen(false)}
            >
              <span className="n">{item.label}</span>
              <span className="t">{item.t1}</span>
            </Link>
          ))}
        </div>
      </aside>

      <aside className={`cr-drawer right${setOpen ? ' open' : ''}`}>
        <div className="cr-drawer-head">
          <h3>版式</h3>
          <button type="button" className="cr-icon" onClick={() => setSetOpen(false)} aria-label="关闭">×</button>
        </div>
        <div className="cr-settings">
          <div className="cr-row">
            <label>字号 {fontSize}</label>
            <input type="range" min={16} max={26} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
          </div>
          <div className="cr-row">
            <label>行距 {lineHeight.toFixed(2)}</label>
            <input type="range" min={1.6} max={2.4} step={0.05} value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} />
          </div>
          <div className="cr-row">
            <label>行宽 {readWidth}</label>
            <input type="range" min={28} max={52} value={readWidth} onChange={(e) => setReadWidth(Number(e.target.value))} />
          </div>
          <div className="cr-row">
            <label>字体</label>
            <div className="cr-seg">
              <button type="button" className={fontMode === 'song' ? 'active' : ''} onClick={() => setFontMode('song')}>宋体</button>
              <button type="button" className={fontMode === 'kai' ? 'active' : ''} onClick={() => setFontMode('kai')}>楷体</button>
            </div>
          </div>
          <div className="cr-row">
            <label>纸色</label>
            <div className="cr-themes">
              {['paper', 'sepia', 'night'].map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`cr-theme${theme === name ? ' active' : ''}`}
                  data-theme-swatch={name}
                  onClick={() => applyTheme(name)}
                />
              ))}
            </div>
          </div>
          <p className="cr-tip">
            快捷键：← → / j k 翻回，t 换纸色
            {notesEnabled ? (compact ? '，n 笔记' : '，n 侧栏批注，b 笔记总览') : ''}
            ，Esc 关闭，/ 检索
          </p>
        </div>
      </aside>

      {notesEnabled ? (
        <aside className={`cr-drawer right notes${notesOpen ? ' open' : ''}`}>
          <div className="cr-drawer-head">
            <h3>{bookTitle}</h3>
            <button type="button" className="cr-icon" onClick={() => setNotesOpen(false)} aria-label="关闭">×</button>
          </div>
          {!compact ? (
            <p className="cr-notes-hint">
              本回批注可在正文右侧常驻显示（顶栏侧栏按钮或按 n 切换）。此处用于总览、导出与管理全书笔记。
            </p>
          ) : null}
          <div className="cr-notes-tools">
            <button type="button" className="cr-btn" onClick={addBookmark}>书签本回</button>
            <div className="cr-seg">
              {([
                { id: 'all', name: '全部' },
                { id: 'note', name: '批注' },
                { id: 'mark', name: '划线' },
              ] as const).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={noteFilter === item.id ? 'active' : ''}
                  onClick={() => setNoteFilter(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="cr-export">
              <button type="button" className="cr-btn" onClick={() => exportNotes('md')}>MD</button>
              <button type="button" className="cr-btn" onClick={() => exportNotes('txt')}>TXT</button>
              <button type="button" className="cr-btn" onClick={() => exportNotes('json')}>JSON</button>
            </div>
          </div>
          <div className="cr-notes-list" ref={notesListRef}>
            {notes.filter((note) => noteFilter === 'all' || note.type === noteFilter).length === 0 ? (
              <div className="cr-empty">暂无内容<br /><span>选中正文可批注或划线</span></div>
            ) : null}
            {notes
              .filter((note) => noteFilter === 'all' || note.type === noteFilter)
              .map((note) => {
                const active = focusedNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    data-sidebar-note={note.id}
                    className={`cr-note-item${active ? ' active' : ''}${note.ch === chapter.n ? ' here' : ''}`}
                    onClick={() => setFocusedNoteId(note.id)}
                  >
                    <div className="cr-note-top">
                      <span className={`cr-pill${note.type === 'mark' ? ' gold' : ''}`}>
                        {note.type === 'mark' ? '划线' : '批注'}
                      </span>
                      <Link
                        href={`/read/${note.ch}/#note-${encodeURIComponent(note.id)}`}
                        className="cr-note-ch"
                        onClick={(e: ReactMouseEvent) => jumpToNote(note, e)}
                      >
                        第 {note.ch} 回
                      </Link>
                      {note.ch === chapter.n ? <span className="cr-note-here">本回</span> : null}
                    </div>
                    <div className="cr-note-quote">{active ? note.quote : clipQuote(note.quote, 64)}</div>
                    {note.comment ? <div className="cr-note-comment">{note.comment}</div> : null}
                    <div className={`cr-note-foot${active ? ' show' : ''}`}>
                      <Link
                        href={`/read/${note.ch}/#note-${encodeURIComponent(note.id)}`}
                        className="cr-note-jump"
                        onClick={(e: ReactMouseEvent) => jumpToNote(note, e)}
                      >
                        查看正文 →
                      </Link>
                      <button
                        type="button"
                        className="cr-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          delNote(note.id);
                          showToast('已删除');
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </aside>
      ) : null}

      {toast ? <div className="cr-toast">{toast}</div> : null}
    </div>
  );
}
