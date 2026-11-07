import type { Metadata } from 'next';
import '@classic/reader/styles.css';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: {
    default: '西游记 · 交互精读',
    template: '%s · 西游记',
  },
  description: '《西游记》一百回全文阅读、检索、人物与西行路线。正文来自维基文库公有领域文本。',
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
