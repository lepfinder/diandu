import charactersJson from '@/data/characters.json';

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
  star?: string;
  nick?: string;
  seat?: number;
  image?: string;
};

const data = charactersJson as { groups: CharacterGroup[]; list: Person[] };

export function getGroups(): CharacterGroup[] {
  return data.groups;
}

export function getPeople(group?: string): Person[] {
  if (!group || group === 'all') return data.list;
  return data.list.filter((person) => person.group === group);
}

export function getHeroes(): Person[] {
  return data.list
    .filter((person) => typeof person.seat === 'number')
    .sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0));
}

export function getGroup(id: string): CharacterGroup | undefined {
  return data.groups.find((group) => group.id === id);
}
