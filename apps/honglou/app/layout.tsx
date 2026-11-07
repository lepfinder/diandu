import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: {
    default: '红楼梦 · 交互精读',
    template: '%s · 红楼梦',
  },
  description:
    '现代化《红楼梦》交互精读站：一百二十回全文、人物星图、大观园图鉴、金陵十二钗判词与红学专题。',
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
