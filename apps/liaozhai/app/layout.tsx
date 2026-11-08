import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import '@classic/ui/topic-card.css';
import { Nav } from '@/components/Nav';

const title = '聊斋志异 · 交互精读';
const description =
  '蒲松龄《聊斋志异》十二卷全文阅读与检索。正文来自维基文库公有领域文本。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 聊斋志异',
  },
  description,
  alternates: { canonical: absoluteUrl('/liaozhai/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/liaozhai/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/liaozhai.webp'), alt: '聊斋志异 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/liaozhai.webp')],
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
