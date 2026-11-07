import type { Metadata } from 'next';
import { Ma_Shan_Zheng, Noto_Serif_SC } from 'next/font/google';
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

export const metadata: Metadata = {
  title: {
    default: '典读',
    template: '%s · 典读',
  },
  description: '典读 · 中国古典交互精读。红楼梦、三国演义、水浒传、西游记、金瓶梅、聊斋志异。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
