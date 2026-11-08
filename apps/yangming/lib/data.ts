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
  { id: 'yu', label: '语录' },
  { id: 'wen', label: '文' },
  { id: 'shi', label: '诗' },
] as const;

export const HOME_TOPICS = [
  { id: 'longchang', icon: '悟', href: '/topics/longchang/' },
  { id: 'zhixing', icon: '一', href: '/topics/zhixing/' },
  { id: 'liangzhi', icon: '知', href: '/topics/liangzhi/' },
  { id: 'bingshi', icon: '功', href: '/topics/bingshi/' },
  { id: 'tianquan', icon: '泉', href: '/topics/tianquan/' },
] as const;

export const HOME_CIRCLE_CARD = {
  href: '/circle/',
  icon: '人',
  title: '交游人物',
  desc: '家人、弟子与讲友。心学是一群人一起走出来的路。',
  image: '/topics/topic-circle.webp',
} as const;
