import type { ComponentProps, ElementType, ReactNode } from 'react';

export type ReaderChapter = {
  n: number;
  label: string;
  t1: string;
  t2: string;
  paras: string[];
};

export type ReaderTocItem = {
  n: number;
  label: string;
  t1: string;
  t2?: string;
};

export type ReaderNote = {
  id: string;
  type: 'note' | 'mark';
  ch: number;
  quote: string;
  comment: string;
};

export type ReaderLinkProps = ComponentProps<'a'> & {
  href: string;
};

export type ReaderChromeProps = {
  /** localStorage 前缀，如 sh / hl / sg，站点隔离 */
  storagePrefix: string;
  chapter: ReaderChapter;
  /** 初始目录；可与 tocUrl 配合，先渲染当前章再拉取全量 */
  toc: ReaderTocItem[];
  /** 全量目录 JSON（组装部署下为 /书名/data/toc.json），用于减小章节 HTML */
  tocUrl?: string;
  prev: Pick<ReaderTocItem, 'n' | 'label' | 't1'> | null;
  next: Pick<ReaderTocItem, 'n' | 'label' | 't1'> | null;
  /** 站内 Link；不传则用原生 a */
  linkComponent?: ElementType<ReaderLinkProps>;
  /** 章末站特有内容（聚义、名场面等） */
  footer?: ReactNode;
  /** 章首标题下的补充信息 */
  headerExtra?: ReactNode;
  features?: {
    notes?: boolean;
  };
  bookTitle?: string;
};
