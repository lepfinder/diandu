'use client';

type Track = {
  id: number;
  no: number;
  title: string;
  singer: string;
  kind: string;
  person: string;
  note: string;
};

export function Music87Board({
  tracks,
  intro,
  album,
}: {
  tracks: Track[];
  intro: string;
  album: { name: string; id: number; url: string };
}) {
  return (
    <>
      <p className="sub" style={{ margin: '-10px 0 18px', maxWidth: '68ch', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.8 }}>
        {intro}
      </p>
      <div className="meta-row" style={{ marginBottom: 18 }}>
        <span className="pill gold">作曲：王立平</span>
        <span className="pill">演唱：陈力 / 王洁实</span>
        <a className="pill accent" href={album.url} target="_blank" rel="noreferrer">
          网易云专辑 · {album.name}
        </a>
      </div>

      <div className="poem-list">
        {tracks.map((t) => (
          <article key={t.id} className="poem-card" style={{ padding: 0 }}>
            <div className="poem-body" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--serif)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {t.no}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ margin: 0 }}>
                    {t.title}
                    <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--sans)', fontWeight: 400 }}>
                      {t.singer} · {t.kind} · {t.person}
                    </span>
                  </h3>
                  <p style={{ margin: '8px 0 0', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.7 }}>{t.note}</p>
                </div>
                <div className="meta-row" style={{ marginLeft: 'auto' }}>
                  <a
                    className="btn accent sm"
                    href={`https://music.163.com/#/song?id=${t.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    打开歌曲页
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
