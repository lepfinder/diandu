import charactersJson from '@/data/characters.json';
import type { MapAnchor } from './types';

export type CharacterGroup = {
  id: string;
  name: string;
  color: string;
};

export type Person = {
  id: string;
  name: string;
  group: string;
  role: string;
  firstCh: number;
  lastCh: number;
  bio: string;
  /** 江山地图人物 / 行迹锚点 */
  map?: MapAnchor;
  /** 多站行迹（人物页可列） */
  anchors?: MapAnchor[];
};

const data = charactersJson as { groups: CharacterGroup[]; list: Person[] };

export function getGroups(): CharacterGroup[] {
  return data.groups;
}

export function getPeople(group?: string): Person[] {
  if (!group || group === 'all') return data.list;
  return data.list.filter((person) => person.group === group);
}

export function getGroup(id: string): CharacterGroup | undefined {
  return data.groups.find((group) => group.id === id);
}

export function getPerson(id: string): Person | undefined {
  return data.list.find((person) => person.id === id);
}
