import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import { Nav } from '@/components/Nav';
import { AgeGate } from '@/components/AgeGate';

const title = '金瓶梅 · 交互精读';
const description =
  '兰陵笑笑生《金瓶梅》崇祯本一百回全文阅读与检索。正文来自维基文库公有领域文本。含情欲描写，仅供成年读者。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 金瓶梅',
  },
  description,
  alternates: { canonical: absoluteUrl('/jinpingmei/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/jinpingmei/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/jinpingmei.webp'), alt: '金瓶梅 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/jinpingmei.webp')],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AgeGate>
          <div className="app">
            <Nav />
            <main className="main">{children}</main>
          </div>
        </AgeGate>
      </body>
    </html>
  );
}
