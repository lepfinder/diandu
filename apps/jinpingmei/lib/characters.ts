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

export function getPersonByName(name: string): Person | undefined {
  return data.list.find((person) => person.name === name || person.name.includes(name) || name.includes(person.name));
}
