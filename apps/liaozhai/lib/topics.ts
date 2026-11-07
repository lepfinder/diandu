import topicsJson from '@/data/topics.json';

export type Scene = {
  id: string;
  plate: string;
  title: string;
  chapter: number;
  summary: string;
  people: string[];
  image?: string;
};

export type Kind = {
  id: string;
  name: string;
  blurb: string;
  stories: string[];
  image?: string;
};

export type Topics = {
  kinds: Kind[];
  scenes: Scene[];
};

const topics = topicsJson as Topics;

export function getTopics(): Topics {
  return topics;
}

export const TOPIC_TABS = [
  { id: 'kinds', name: '品类', href: '/topics/kinds/' },
  { id: 'scenes', name: '名篇', href: '/topics/scenes/' },
] as const;
