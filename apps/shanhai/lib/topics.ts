import topicsJson from '@/data/topics.json';

export type Region = {
  id: string;
  name: string;
  quadrant: string;
  corpus: string;
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

export type Topics = {
  regions: Region[];
  scenes: Scene[];
};

const topics = topicsJson as Topics;

export function getTopics(): Topics {
  return topics;
}

export function regionAt(chapter: number): Region {
  const reached = topics.regions.filter((region) => region.chapter <= chapter);
  return reached[reached.length - 1] ?? topics.regions[0];
}

export const TOPIC_TABS = [
  { id: 'regions', name: '方位', href: '/topics/regions/' },
  { id: 'scenes', name: '名物', href: '/topics/scenes/' },
] as const;
