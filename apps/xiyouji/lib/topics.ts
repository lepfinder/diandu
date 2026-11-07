import topicsJson from '@/data/topics.json';

export type Station = {
  id: string;
  name: string;
  chapter: number;
  blurb: string;
  image?: string;
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
  stations: Station[];
  scenes: Scene[];
  relics: Relic[];
};

const topics = topicsJson as Topics;

export function getTopics(): Topics {
  return topics;
}

export function stationAt(chapter: number): Station {
  const reached = topics.stations.filter((station) => station.chapter <= chapter);
  return reached[reached.length - 1] ?? topics.stations[0];
}

export const TOPIC_TABS = [
  { id: 'route', name: '西行', href: '/topics/route/' },
  { id: 'scenes', name: '名场面', href: '/topics/scenes/' },
  { id: 'relics', name: '器物', href: '/topics/relics/' },
] as const;
