import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import '@classic/ui/topic-card.css';
import { Nav } from '@/components/Nav';

const title = '山海经 · 交互精读';
const description =
  '《山海经》十八篇全文阅读、方位图鉴、异兽神祇与名物。正文来自维基文库郭璞注本（公有领域）。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 山海经',
  },
  description,
  alternates: { canonical: absoluteUrl('/shanhai/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/shanhai/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/shanhai.webp'), alt: '山海经 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/shanhai.webp')],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app">
          <Nav />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
