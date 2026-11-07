export type Chapter = {
  n: number;
  label: string;
  title: string;
  t1: string;
  t2: string;
  paras: string[];
};

export type BookMeta = {
  title: string;
  author: string;
  edition: string;
  chapterCount: number;
};

export type Book = {
  meta: BookMeta;
  chapters: Chapter[];
};

export type Character = {
  id: string;
  name: string;
  aliases: string[];
  group: string;
  gender: string;
  role: string;
  tag?: string;
  bio: string;
  fate?: string;
  poems?: string[];
  firstCh: number;
  lastCh: number;
  color?: string;
  image?: string;
};

export type Relation = {
  s: string;
  t: string;
  type: 'blood' | 'marriage' | 'master-servant' | 'love' | 'friend' | 'foe' | 'teacher';
  label: string;
  /** 该关系成立的起始回目（可选，用于时间轴动态显隐） */
  fromCh?: number;
  /** 该关系结束的回目（可选） */
  toCh?: number;
};

export type TopicPlace = {
  id: string;
  name: string;
  host: string;
  desc: string;
  tags: string[];
  image?: string;
};

export type TwelveItem = {
  verseFocus?: string;
  verseShared?: string;
  register?: 'zheng' | 'fu' | 'youfu';
  image?: string;
  id: string;
  name: string;
  symbol: string;
  verse: string;
  song?: string;
  read: string;
  chRef: number;
};

export type PoemItem = {
  id: string;
  title: string;
  author: string;
  ch: number;
  lines: string[];
  note: string;
};

export type PoemFullItem = {
  id: string;
  title: string;
  author: string;
  ch: number;
  label?: string;
  type: string;
  lines: string[];
};

export type EssayItem = {
  id: string;
  title: string;
  body: string[];
};

export type TimelineItem = {
  ch: number;
  label: string;
  desc: string;
};
