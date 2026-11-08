import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import '@classic/ui/topic-card.css';
import { Nav } from '@/components/Nav';

const title = '水浒传 · 交互精读';
const description =
  '《水浒传》一百二十回全文阅读、检索、一百单八将座次与聚义路线。正文来自维基文库公有领域文本。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 水浒传',
  },
  description,
  alternates: { canonical: absoluteUrl('/shuihu/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/shuihu/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/shuihu.webp'), alt: '水浒传 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/shuihu.webp')],
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
