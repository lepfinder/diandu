'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Link from '@/components/Link';
import { TwelveDetailModal } from '@/components/TwelveDetailModal';
import { getCharacter, getRelationsFor } from '@/lib/content';
import { toCN } from '@/lib/cn';
import { getTwelveDetail, TWELVE_DETAIL, type TwelveDetail } from '@/lib/twelve-detail';
import type { Character } from '@/lib/types';
import { asset } from '@classic/ui';

export function useHonglouBodyClick() {
  const [modalChar, setModalChar] = useState<Character | null>(null);
  const [twelveDetail, setTwelveDetail] = useState<TwelveDetail | null>(null);

  const openChar = useCallback((c: Character) => {
    setModalChar(c);
    setTwelveDetail(null);
  }, []);

  const onBodyClick = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest('.mark') as HTMLElement | null;
    if (!el) return false;
    const id = el.dataset.char;
    const c = id ? getCharacter(id) : null;
    if (!c) return false;
    openChar(c);
    return true;
  }, [openChar]);

  useEffect(() => {
    if (!modalChar || twelveDetail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setModalChar(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalChar, twelveDetail]);

  const twelveSiblings = useMemo(() => {
    if (!twelveDetail) return undefined;
    return TWELVE_DETAIL.filter((x) => x.register === twelveDetail.register).map((x) => x.id);
  }, [twelveDetail]);

  const overlays = (
    <>
      {modalChar ? (() => {
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
                <button type="button" className="icon-btn" onClick={() => setModalChar(null)}>×</button>
              </div>
              <div className="modal-body">
                <p>{modalChar.bio}</p>
                {modalChar.fate ? <div className="meta-row"><span className="pill accent">结局：{modalChar.fate}</span></div> : null}
                <div className="meta-row">
                  {twelve ? (
                    <button type="button" className="btn accent sm" onClick={() => setTwelveDetail(twelve)}>
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
                      <button key={i} type="button" className="pill" onClick={() => openChar(r.other)}>
                        {r.other.name}<span style={{ opacity: 0.65 }}>·{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })() : null}
      <TwelveDetailModal
        detail={twelveDetail}
        onClose={() => setTwelveDetail(null)}
        siblings={twelveSiblings}
        onNavigate={(id) => setTwelveDetail(getTwelveDetail(id))}
      />
    </>
  );

  return { onBodyClick, overlays };
}
