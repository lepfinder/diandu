import type { Metadata } from 'next';
import { Ma_Shan_Zheng, Noto_Serif_SC } from 'next/font/google';
import { absoluteUrl, getSiteUrl } from '@classic/ui';
import './globals.css';

const display = Ma_Shan_Zheng({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const serif = Noto_Serif_SC({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const siteUrl = getSiteUrl();
const title = '典读';
const description =
  '典读 · 中国古典交互精读。红楼梦、三国演义、水浒传、西游记、金瓶梅、聊斋志异：全文阅读、人物图谱、专题与检索。';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s · 典读',
  },
  description,
  applicationName: '典读',
  keywords: [
    '典读',
    '中国古典',
    '红楼梦',
    '三国演义',
    '水浒传',
    '西游记',
    '金瓶梅',
    '聊斋志异',
    '交互精读',
  ],
  authors: [{ name: '典读' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: absoluteUrl('/'),
    siteName: '典读',
    title,
    description,
    images: [
      {
        url: absoluteUrl('/covers/honglou.webp'),
        width: 1200,
        height: 630,
        alt: '典读 · 中国古典交互精读',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/covers/honglou.webp')],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
