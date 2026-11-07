import topicsJson from '@/data/topics.json';

export type Faction = {
  id: string;
  name: string;
  short: string;
  color: string;
};

export type City = {
  id: string;
  name: string;
  x: number;
  y: number;
  blurb: string;
};

export type Hold = {
  city: string;
  from: number;
  to: number;
  faction: string;
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

export type Essay = {
  id: string;
  title: string;
  chapter: number;
  novel: string;
  history: string;
  reading: string;
};

export type Piece = {
  id: string;
  kind: string;
  title: string;
  author: string;
  chapter: number;
  note: string;
  lines?: string[];
  paras?: string[];
  image?: string;
};

export type EventItem = {
  id: string;
  year?: number;
  chapter: number;
  title: string;
  blurb: string;
};

export type Relic = {
  id: string;
  kind: string;
  name: string;
  owner: string;
  chapter: number;
  blurb: string;
  image?: string;
};

export type Topics = {
  factions: Faction[];
  cities: City[];
  holds: Hold[];
  scenes: Scene[];
  essays: Essay[];
  pieces: Piece[];
  events: EventItem[];
  relics: Relic[];
};

const topics = topicsJson as Topics;

export function getTopics(): Topics {
  return topics;
}

export function getFaction(id: string): Faction {
  const found = topics.factions.find((f) => f.id === id);
  if (!found) throw new Error(`未知势力：${id}`);
  return found;
}

export function holdAt(cityId: string, chapter: number): Hold {
  const found = topics.holds.find((h) => h.city === cityId && chapter >= h.from && chapter <= h.to);
  if (!found) throw new Error(`第 ${chapter} 回没有 ${cityId} 的归属`);
  return found;
}

export function holdsFor(cityId: string): Hold[] {
  return topics.holds.filter((h) => h.city === cityId);
}

export type TimelineAct = {
  id: string;
  title: string;
  blurb: string;
  range: [number, number];
  image: string;
};

/** 大事分四幕，结构和金瓶梅年表一致。 */
export const TL_ACTS: TimelineAct[] = [
  {
    id: 'rise',
    title: '起 · 群雄逐鹿',
    blurb: '桃园、迁许、官渡。董卓乱后，中原先定出曹操这一头。',
    range: [1, 33],
    image: '/topics/act-rise.webp',
  },
  {
    id: 'split',
    title: '承 · 赤壁三分',
    blurb: '三顾、赤壁、入成都。孙刘联手之后，天下分成三块。',
    range: [34, 74],
    image: '/topics/act-split.webp',
  },
  {
    id: 'shu',
    title: '转 · 蜀汉兴衰',
    blurb: '袭荆州、夷陵、托孤、北伐。蜀汉从顶峰滑向五丈原。',
    range: [75, 104],
    image: '/topics/act-shu.webp',
  },
  {
    id: 'unite',
    title: '合 · 三分归一',
    blurb: '姜维屡伐、后主出降、司马受禅、孙皓归晋。一百二十回到此收住。',
    range: [105, 120],
    image: '/topics/act-unite.webp',
  },
];

export function actForChapter(chapter: number): TimelineAct {
  return TL_ACTS.find((act) => chapter >= act.range[0] && chapter <= act.range[1]) || TL_ACTS[TL_ACTS.length - 1];
}

export const TOPIC_TABS = [
  { id: 'map', name: '形势', href: '/topics/map/' },
  { id: 'events', name: '大事', href: '/topics/events/' },
  { id: 'scenes', name: '名场面', href: '/topics/scenes/' },
  { id: 'pieces', name: '名篇', href: '/topics/pieces/' },
  { id: 'history', name: '史实对照', href: '/topics/history/' },
  { id: 'relics', name: '兵器坐骑', href: '/topics/relics/' },
] as const;
