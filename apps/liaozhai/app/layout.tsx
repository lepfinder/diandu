import type { Metadata } from 'next';
import '@classic/reader/styles.css';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: {
    default: '聊斋志异 · 交互精读',
    template: '%s · 聊斋志异',
  },
  description: '蒲松龄《聊斋志异》十二卷全文阅读与检索。正文来自维基文库公有领域文本。',
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
