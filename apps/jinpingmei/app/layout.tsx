import type { Metadata } from 'next';
import '@classic/reader/styles.css';
import './globals.css';
import { Nav } from '@/components/Nav';
import { AgeGate } from '@/components/AgeGate';

export const metadata: Metadata = {
  title: {
    default: '金瓶梅 · 交互精读',
    template: '%s · 金瓶梅',
  },
  description: '兰陵笑笑生《金瓶梅》崇祯本一百回全文阅读与检索。正文来自维基文库公有领域文本。含情欲描写，仅供成年读者。',
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
