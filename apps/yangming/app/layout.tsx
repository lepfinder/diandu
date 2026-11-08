import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import './globals.css';
import '@classic/ui/topic-card.css';
import { Nav } from '@/components/Nav';

const title = '王阳明 · 交互精读';
const description =
  '王阳明（王守仁）生平时间线、传习录精读与心学专题。龙场悟道、知行合一、致良知；正文取公有领域通行文本。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 王阳明',
  },
  description,
  alternates: { canonical: absoluteUrl('/yangming/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/yangming/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/yangming.webp'), alt: '王阳明 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/yangming.webp')],
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
