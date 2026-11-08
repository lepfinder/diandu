import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import '@classic/ui/topic-card.css';
import { Nav } from '@/components/Nav';

const title = '东周列国志 · 交互精读';
const description =
  '冯梦龙 / 蔡元放《东周列国志》一百零八回全文阅读与检索。正文来自维基文库公有领域文本。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 东周列国志',
  },
  description,
  alternates: { canonical: absoluteUrl('/lieguo/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/lieguo/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/lieguo.webp'), alt: '东周列国志 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/lieguo.webp')],
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
