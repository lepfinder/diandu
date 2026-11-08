import personJson from '@/data/person.json';
import timelineJson from '@/data/timeline.json';
import worksJson from '@/data/works.json';
import topicsJson from '@/data/topics.json';
import circleJson from '@/data/circle.json';
import type {
  CircleData,
  CirclePerson,
  Person,
  TimelineEvent,
  TopicBlock,
  TopicTab,
  Work,
} from './types';

export function getPerson(): Person {
  return personJson as Person;
}

export function getTimeline(): TimelineEvent[] {
  return (timelineJson as { events: TimelineEvent[] }).events;
}

export function getWorks(): Work[] {
  return (worksJson as { works: Work[] }).works;
}

export function getWork(id: string) {
  return getWorks().find((w) => w.id === id);
}

export function getFeaturedWorks() {
  return getWorks().filter((w) => w.featured);
}

export function getWorksByGenre(genre: string) {
  return getWorks().filter((w) => w.genre === genre);
}

export function getRelatedWorks(work: Work) {
  return (work.relatedWorkIds || [])
    .map((id) => getWork(id))
    .filter(Boolean) as Work[];
}

export function getEvent(id: string) {
  return getTimeline().find((e) => e.id === id);
}

export function getTopicTabs(): TopicTab[] {
  return (topicsJson as { tabs: TopicTab[] }).tabs;
}

export function getTopic(slug: string): TopicBlock | null {
  const data = topicsJson as Record<string, unknown>;
  const block = data[slug];
  if (!block || typeof block !== 'object' || !('title' in block)) return null;
  return block as TopicBlock;
}

export function getCircleData(): CircleData {
  return circleJson as CircleData;
}

export function getCircle(): CirclePerson[] {
  return getCircleData().people;
}

export const GENRE_ORDER = [
  { id: 'ci', label: '词' },
  { id: 'shi', label: '诗' },
  { id: 'wen', label: '文' },
] as const;

export const HOME_TOPICS = [
  { id: 'chibi', icon: '壁', href: '/topics/chibi/' },
  { id: 'wutai', icon: '狱', href: '/topics/wutai/' },
  { id: 'ziyou', icon: '弟', href: '/topics/ziyou/' },
  { id: 'sanzhou', icon: '州', href: '/topics/sanzhou/' },
  { id: 'hainan', icon: '海', href: '/topics/hainan/' },
  { id: 'huangzhou', icon: '黄', href: '/topics/huangzhou/' },
  { id: 'rain', icon: '雨', href: '/topics/rain/' },
] as const;

export const HOME_CIRCLE_CARD = {
  href: '/circle/',
  icon: '人',
  title: '交游人物',
  desc: '家人、座师、门人与方外友，按关系速查，再跳回相关作品。',
  image: '/topics/topic-circle.webp',
} as const;
