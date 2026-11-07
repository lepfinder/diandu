import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import { Nav } from '@/components/Nav';

const title = '三国演义 · 交互精读';
const description =
  '毛宗岗本《三国演义》一百二十回全文阅读与检索。正文来自维基文库公有领域文本。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 三国演义',
  },
  description,
  alternates: { canonical: absoluteUrl('/sanguo/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/sanguo/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/sanguo.webp'), alt: '三国演义 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/sanguo.webp')],
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
