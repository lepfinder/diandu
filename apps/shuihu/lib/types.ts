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
  source: string;
  exported: string;
  chapterCount: number;
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
};
