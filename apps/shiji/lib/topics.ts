import topicsJson from '@/data/topics.json';
import type { MapAnchor } from './types';

export type Scene = {
  id: string;
  plate: string;
  title: string;
  chapter: number;
  summary: string;
  people: string[];
  image?: string;
  map?: MapAnchor;
};

export type CorpusTopic = {
  id: string;
  name: string;
  blurb: string;
  stories: string[];
  image?: string;
};

export type Topics = {
  corpus: CorpusTopic[];
  scenes: Scene[];
};

const topics = topicsJson as Topics;

export function getTopics(): Topics {
  return topics;
}

export const TOPIC_TABS = [
  { id: 'corpus', name: '体例', href: '/topics/corpus/' },
  { id: 'scenes', name: '名篇', href: '/topics/scenes/' },
] as const;
