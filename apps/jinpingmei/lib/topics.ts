import topicsJson from '@/data/topics.json';
import guidesJson from '@/data/guides.json';

export type TimelineItem = {
  id: string;
  chapter: number;
  title: string;
  text: string;
};

export type Relation = {
  id: string;
  label: string;
  people: string;
  text: string;
  chapter: number;
};

export type Scene = {
  id: string;
  plate: string;
  title: string;
  chapter: number;
  summary: string;
  people: string[];
  image?: string;
};

export type Piece = {
  id: string;
  kind: string;
  title: string;
  chapter: number;
  lines: string[];
  note: string;
  image?: string;
};

export type Good = {
  id: string;
  name: string;
  kind: string;
  chapter: number;
  text: string;
  image?: string;
};

export type EditionEssay = {
  id: string;
  title: string;
  chapter: number;
  paras: string[];
};

export type Topics = {
  timeline: TimelineItem[];
  house: Relation[];
  scenes: Scene[];
  pieces: Piece[];
  goods: Good[];
  editions: EditionEssay[];
  market: Relation[];
};

export type TimelineAct = {
  id: string;
  title: string;
  blurb: string;
  range: [number, number];
  image: string;
};

const topics = {
  ...(topicsJson as Omit<Topics, 'pieces' | 'goods' | 'editions' | 'market'>),
  ...(guidesJson as Pick<Topics, 'pieces' | 'goods' | 'editions' | 'market'>),
} as Topics;

export function getTopics(): Topics {
  return topics;
}

/** 年表分四幕，对应红楼情节年表的结构。 */
export const TL_ACTS: TimelineAct[] = [
  {
    id: 'rise',
    title: '起 · 清河发端',
    blurb: '结义、打虎、鸩杀。金莲还没进门，路已经铺开了。',
    range: [1, 18],
    image: '/scenes/curtain.webp',
  },
  {
    id: 'expand',
    title: '承 · 六房铺开',
    blurb: '瓶儿进府，蕙莲自尽。西门庆的家，从这一段真正立住。',
    range: [19, 29],
    image: '/scenes/wall.webp',
  },
  {
    id: 'peak',
    title: '转 · 极盛而衰',
    blurb: '生子加官到顶点，官哥夭折，瓶儿随去。热闹里开始散。',
    range: [30, 78],
    image: '/scenes/son-office.webp',
  },
  {
    id: 'fall',
    title: '合 · 树倒雾散',
    blurb: '西门庆死，金莲被卖，武松报仇，孝哥出家。一百回到此收住。',
    range: [79, 100],
    image: '/scenes/deliver.webp',
  },
];

export function actForChapter(chapter: number): TimelineAct {
  return TL_ACTS.find((act) => chapter >= act.range[0] && chapter <= act.range[1]) || TL_ACTS[TL_ACTS.length - 1];
}

export function relationNames(people: string): string[] {
  return people
    .split(/\s*·\s*/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export const TOPIC_TABS = [
  { id: 'timeline', name: '年表', href: '/topics/timeline/' },
  { id: 'house', name: '府内', href: '/topics/house/' },
  { id: 'scenes', name: '名场面', href: '/topics/scenes/' },
  { id: 'pieces', name: '名篇', href: '/topics/pieces/' },
  { id: 'goods', name: '物产', href: '/topics/goods/' },
  { id: 'editions', name: '版本', href: '/topics/editions/' },
  { id: 'market', name: '市井官场', href: '/topics/market/' },
] as const;
