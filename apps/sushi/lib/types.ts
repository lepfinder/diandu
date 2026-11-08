export type Person = {
  id: string;
  name: string;
  courtesy: string;
  hao: string;
  years: string;
  dynasty: string;
  birthplace: string;
  kicker: string;
  lead: string[];
  blurb: string;
  edition: string;
};

export type TimelineEvent = {
  id: string;
  year: number;
  yearLabel: string;
  age: number;
  title: string;
  place: string;
  phase: string;
  blurb: string;
  image?: string;
  workIds: string[];
};

export type Work = {
  id: string;
  title: string;
  genre: 'ci' | 'shi' | 'wen' | string;
  genreLabel: string;
  year: number;
  yearLabel: string;
  place: string;
  featured: boolean;
  timelineId: string | null;
  blurb: string;
  background?: string;
  why?: string;
  glosses?: string[];
  relatedWorkIds?: string[];
  image?: string;
  lines: string[];
  note?: string;
};

export type TopicTab = {
  id: string;
  name: string;
  href: string;
};

export type TopicBlock = {
  title: string;
  lead: string;
  image?: string;
  essay?: string;
  items: { workId: string; note: string }[];
};

export type CirclePerson = {
  id: string;
  name: string;
  seal: string;
  relation: string;
  blurb: string;
  image?: string;
  workIds: string[];
};

export type CircleData = {
  title: string;
  lead: string;
  banner?: string;
  people: CirclePerson[];
};
