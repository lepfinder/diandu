import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import './globals.css';
import '@classic/ui/topic-card.css';
import { Nav } from '@/components/Nav';

const title = '苏轼 · 交互精读';
const description =
  '苏轼（东坡）生平时间线、名篇精读与赤壁专题。诗、词、文选篇阅读与检索；正文取公有领域通行文本。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 苏轼',
  },
  description,
  alternates: { canonical: absoluteUrl('/sushi/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/sushi/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/sushi.webp'), alt: '苏轼 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/sushi.webp')],
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
