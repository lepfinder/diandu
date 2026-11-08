/** 史记五体 */
export type CorpusKind = 'benji' | 'biao' | 'shu' | 'shijia' | 'liezhuan';

export const CORPUS_LABEL: Record<CorpusKind, string> = {
  benji: '本纪',
  biao: '表',
  shu: '书',
  shijia: '世家',
  liezhuan: '列传',
};

export type MapAnchor = {
  /** 公元纪年，公元前为负；无确切年可省略 */
  year?: number;
  /** 古地名，交给江山地图解析 */
  place?: string;
  /** 江山人物 id 或中文名 */
  person?: string;
};

export type Chapter = {
  n: number;
  label: string;
  title: string;
  t1: string;
  t2: string;
  /** 五体分类 */
  kind: CorpusKind;
  /** 篇序（该体内第几篇），可选 */
  seq?: number;
  yearStart?: number;
  yearEnd?: number;
  /** 篇级默认舆图锚点 */
  map?: MapAnchor;
  paras: string[];
};

export type BookMeta = {
  title: string;
  author: string;
  edition: string;
  source: string;
  exported: string;
  chapterCount: number;
  note?: string;
};

export type Book = {
  meta: BookMeta;
  chapters: Chapter[];
};

export type TocItem = {
  n: number;
  label: string;
  title: string;
  t1: string;
  t2: string;
  kind?: CorpusKind;
};
