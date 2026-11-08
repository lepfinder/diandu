import topicsJson from '@/data/topics.json';
import type { MapAnchor } from '@/lib/map';

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

export type Era = {
  id: string;
  name: string;
  blurb: string;
  stories: string[];
  image?: string;
};

export type Idiom = {
  id: string;
  idiom: string;
  gloss: string;
  story: string;
  chapter: number;
  people: string[];
  map?: MapAnchor;
  era?: string;
};

export type Place = {
  id: string;
  ancient: string;
  modern: string;
  note: string;
  chapter: number;
  map?: MapAnchor;
  era?: string;
};

export type Topics = {
  eras: Era[];
  scenes: Scene[];
  idioms: Idiom[];
  places: Place[];
};

const topics = topicsJson as Topics;

export function getTopics(): Topics {
  return topics;
}

export function getIdiomsByEra(era?: string): Idiom[] {
  if (!era || era === 'all') return topics.idioms;
  return topics.idioms.filter((item) => item.era === era);
}

export function getPlacesByEra(era?: string): Place[] {
  if (!era || era === 'all') return topics.places;
  return topics.places.filter((item) => item.era === era);
}

export const TOPIC_TABS = [
  { id: 'eras', name: '时代', href: '/topics/eras/' },
  { id: 'scenes', name: '名篇', href: '/topics/scenes/' },
  { id: 'idioms', name: '成语', href: '/topics/idioms/' },
  { id: 'places', name: '古今地', href: '/topics/places/' },
] as const;
