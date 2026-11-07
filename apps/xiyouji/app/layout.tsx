import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import { Nav } from '@/components/Nav';

const title = '西游记 · 交互精读';
const description =
  '《西游记》一百回全文阅读、检索、人物与西行路线。正文来自维基文库公有领域文本。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 西游记',
  },
  description,
  alternates: { canonical: absoluteUrl('/xiyouji/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/xiyouji/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/xiyouji.webp'), alt: '西游记 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/xiyouji.webp')],
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
