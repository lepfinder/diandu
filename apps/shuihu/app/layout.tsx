import type { Metadata } from 'next';
import '@classic/reader/styles.css';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: {
    default: '水浒传 · 交互精读',
    template: '%s · 水浒传',
  },
  description: '《水浒传》一百二十回全文阅读、检索、一百单八将座次与聚义路线。正文来自维基文库公有领域文本。',
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
