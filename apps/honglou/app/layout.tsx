import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import { Nav } from '@/components/Nav';

const title = '红楼梦 · 交互精读';
const description =
  '现代化《红楼梦》交互精读站：一百二十回全文、人物星图、大观园图鉴、金陵十二钗判词与红学专题。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 红楼梦',
  },
  description,
  alternates: { canonical: absoluteUrl('/honglou/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/honglou/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/honglou.webp'), alt: '红楼梦 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/honglou.webp')],
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
        <div id="modal-root" />
      </body>
    </html>
  );
}
