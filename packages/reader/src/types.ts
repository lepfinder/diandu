import type { ComponentProps, ElementType, MouseEvent as ReactMouseEvent, ReactNode } from 'react';

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

/** 只读社群划线（如微信读书热门），不进 localStorage */
export type ReaderSocialHighlight = {
  id: string;
  ch: number;
  /** 已对齐到本站底本、用于正文命中的原文 */
  quote: string;
  totalCount: number;
  /** 原始划线文案（可选，列表展示用） */
  markText?: string;
};

export type ReaderSocialReview = {
  id?: string;
  authorName?: string;
  content: string;
  star?: number;
  createTime?: number;
};

export type ReaderSocialLayer = {
  /** 来源短名，如「微信读书」 */
  sourceLabel?: string;
  sourceUrl?: string;
  bookTitle?: string;
  highlights: ReaderSocialHighlight[];
  reviews?: ReaderSocialReview[];
};

export type ReaderLinkProps = ComponentProps<'a'> & {
  href: string;
};

export type ReaderAnnotateOptions = {
  /**
   * 对未划线/批注覆盖的纯文本片段做二次装饰（须自行 escape）。
   * 用于站内人名链等。
   */
  decoratePlain?: (plain: string) => string;
};

export type ReadRelatedHeader = {
  href: string;
  label: string;
  badge?: string;
};

export type ReadRelatedCard = {
  id: string;
  href: string;
  title: string;
  text: string;
};

export type ReadRelatedScene = {
  id: string;
  title: string;
  summary: string;
  /** 已解析好的图片 URL（含 basePath） */
  imageSrc?: string;
  plate?: string;
};

export type ReadRelatedPerson = {
  id: string;
  name: string;
  href: string;
  note?: string;
};

export type ReadRelatedBlock =
  | { type: 'cards'; label: string; items: ReadRelatedCard[] }
  | { type: 'scenes'; label: string; items: ReadRelatedScene[] }
  | { type: 'people'; label: string; items: ReadRelatedPerson[] };

export type ReadRelatedProps = {
  mode?: 'header' | 'footer' | 'all';
  linkComponent?: ElementType<{ href: string; className?: string; children?: ReactNode }>;
  header?: ReadRelatedHeader | null;
  blocks?: ReadRelatedBlock[];
  /** 页脚标题，默认「读到这里」 */
  title?: string;
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
  /** 目录抽屉顶部（如「继续阅读」） */
  tocLead?: ReactNode;
  /** 壳外浮层（人物卡、专题弹层等） */
  overlays?: ReactNode;
  /** 微信读书等社群层：热门划线 + 精选书评 */
  social?: ReaderSocialLayer;
  /**
   * 正文 annotate 后的纯文本片段装饰（人名链等）。
   * 入参为未转义原文，返回值必须是安全 HTML。
   */
  decoratePlain?: (plain: string) => string;
  /**
   * 正文点击钩子；返回 true 表示已处理，阅读壳不再继续默认逻辑。
   */
  onBodyClick?: (e: ReactMouseEvent<HTMLDivElement>) => boolean;
  features?: {
    notes?: boolean;
  };
  bookTitle?: string;
};
