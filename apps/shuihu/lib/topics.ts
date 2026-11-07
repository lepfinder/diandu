import topicsJson from '@/data/topics.json';

export type Station = {
  id: string;
  name: string;
  chapter: number;
  blurb: string;
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

export type Topics = {
  stations: Station[];
  scenes: Scene[];
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
  { id: 'seats', name: '座次', href: '/topics/seats/' },
  { id: 'path', name: '聚义', href: '/topics/path/' },
  { id: 'scenes', name: '名场面', href: '/topics/scenes/' },
] as const;
