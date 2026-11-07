'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from './Link';

export type SiteNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  /** 是否按「继续阅读」解析章节号 */
  continueReading?: boolean;
  openInNewTab?: boolean;
  match?: (pathname: string) => boolean;
};

export type SiteNavProps = {
  brand: ReactNode;
  brandTitle: string;
  /** localStorage 前缀，如 hl / sg / sh */
  storagePrefix: string;
  items: SiteNavItem[];
  /** 主题切换按钮 title */
  themeTitle?: string;
  /**
   * 返回聚合站。默认自动推断：
   * assemble 部署为 `/`，本地为 `http://localhost:3400/`。
   * 传 `null` 可关闭。
   */
  portalHref?: string | null;
  portalLabel?: string;
};

/** 子站返回典读主站的地址（需用原生 a，以跳出 Next basePath）。 */
export function getPortalHref() {
  if (process.env.NEXT_PUBLIC_SITE_MODE === 'assemble') return '/';
  return process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3400/';
}

function Icon({ name }: { name: string }) {
  const common = { viewBox: '0 0 24 24' };
  if (name === 'home')
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  if (name === 'book')
    return (
      <svg {...common}>
        <path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3z" />
        <path d="M5 4.5V23" />
        <path d="M8 20h11" />
      </svg>
    );
  if (name === 'map')
    return (
      <svg {...common}>
        <path d="M4 6.5 9 4.5l6 2 5-2v13l-5 2-6-2-5 2z" />
        <path d="M9 4.5v13M15 6.5v13" />
      </svg>
    );
  if (name === 'users')
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5S14 16 14.5 19" />
        <path d="M14.5 14.2c1.8.2 3.4 1.4 4 3.3" />
      </svg>
    );
  if (name === 'graph')
    return (
      <svg {...common}>
        <circle cx="6" cy="7" r="2.2" />
        <circle cx="18" cy="6" r="2.2" />
        <circle cx="12" cy="17" r="2.2" />
        <path d="M8 8.2 10.5 15M16.2 7.8 13.5 15M8.1 7h7.8" />
      </svg>
    );
  if (name === 'star')
    return (
      <svg {...common}>
        <path d="m12 3.5 2.4 5 5.5.7-4 3.8 1 5.4L12 15.8 7.1 18.4l1-5.4-4-3.8 5.5-.7z" />
      </svg>
    );
  if (name === 'garden')
    return (
      <svg {...common}>
        <path d="M4 20h16" />
        <path d="M6 20V10l6-5 6 5v10" />
        <path d="M10 20v-5h4v5" />
        <path d="M3 10c2-1 3-3 3-5" />
        <path d="M21 10c-2-1-3-3-3-5" />
      </svg>
    );
  if (name === 'scroll')
    return (
      <svg {...common}>
        <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7" />
        <path d="M7 4a2 2 0 0 0-2 2v2h2" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </svg>
    );
  if (name === 'portal')
    return (
      <svg {...common}>
        <path d="M4 7.5 12 3l8 4.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
        <path d="M9 21v-7h6v7" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function defaultMatch(id: string, pathname: string) {
  if (id === 'home') return pathname === '/' || pathname === '';
  if (id === 'read') return pathname.startsWith('/read');
  if (id === 'chars') return pathname.startsWith('/characters');
  if (id === 'topics') return pathname.startsWith('/topics');
  if (id === 'search') return pathname.startsWith('/search');
  if (id === 'starmap') return pathname.startsWith('/star') || pathname.startsWith('/graph');
  return pathname.startsWith(`/${id}`);
}

export function SiteNav({
  brand,
  brandTitle,
  storagePrefix,
  items,
  themeTitle = '切换主题',
  portalHref,
  portalLabel = '典读',
}: SiteNavProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState('paper');
  const [continueCh, setContinueCh] = useState(1);
  const backHref = portalHref === null ? null : portalHref ?? getPortalHref();

  useEffect(() => {
    const saved = localStorage.getItem(`${storagePrefix}:theme`) || 'paper';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
    const stored = localStorage.getItem(`${storagePrefix}:chapter`);
    const chapter = stored == null ? 1 : Number(stored);
    setContinueCh(Number.isFinite(chapter) && chapter > 0 ? chapter : 1);
  }, [pathname, storagePrefix]);

  function cycleTheme() {
    const order = ['paper', 'sepia', 'night'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    localStorage.setItem(`${storagePrefix}:theme`, next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <aside className="rail">
      <Link href="/" className="brand" title={brandTitle}>
        {brand}
      </Link>
      <nav className="rail-nav">
        {backHref ? (
          <a href={backHref} className="rail-btn rail-portal" title={`返回${portalLabel}`}>
            <Icon name="portal" />
            <span>{portalLabel}</span>
          </a>
        ) : null}
        {items.map((it) => {
          const href =
            it.continueReading || it.id === 'read' ? `/read/${continueCh}/` : it.href;
          const active = it.match
            ? it.match(pathname)
            : defaultMatch(it.id, pathname);
          return (
            <Link
              key={it.id}
              href={href}
              className={`rail-btn ${active ? 'active' : ''}`}
              title={it.label}
              {...(it.openInNewTab ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              <Icon name={it.icon} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="rail-foot">
        <button className="icon-btn" onClick={cycleTheme} title={themeTitle}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
