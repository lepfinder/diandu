import characterArtJson from '@/data/character-art.json';

type CharacterArt = { portrait: string; avatar: string };
const characterArt: Record<string, CharacterArt> = characterArtJson;

export function getCharacterArt(id: string): CharacterArt | undefined {
  return characterArt[id];
}
