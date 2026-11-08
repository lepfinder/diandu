import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import '@classic/reader/styles.css';
import './globals.css';
import '@classic/ui/topic-card.css';
import { Nav } from '@/components/Nav';

const title = '史记 · 交互精读';
const description =
  '司马迁《史记》本纪、表、书、世家、列传阅读与人物谱。正文底本计划取自维基文库公有领域文本；可外链江山时序舆图。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s · 史记',
  },
  description,
  alternates: { canonical: absoluteUrl('/shiji/') },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/shiji/'),
    siteName: '典读',
    title,
    description,
    images: [{ url: absoluteUrl('/covers/shiji.webp'), alt: '史记 · 典读' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/shiji.webp')],
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
