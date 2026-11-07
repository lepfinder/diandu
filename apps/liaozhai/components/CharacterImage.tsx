'use client';

import { useState } from 'react';
import { asset } from '@classic/ui';
import { getCharacterArt } from '@/lib/character-art';
import type { Person } from '@/lib/characters';

type Props = { person: Person; variant: 'avatar' | 'portrait'; color?: string };

export default function CharacterImage({ person, variant, color }: Props) {
  const [failed, setFailed] = useState(false);
  const art = getCharacterArt(person.id);
  if (!art || failed) {
    return variant === 'portrait' ? null : (
      <span className="avatar" style={{ background: color }}>{person.name.slice(0, 1)}</span>
    );
  }
  return (
    <img
      className={variant === 'avatar' ? 'avatar avatar-image' : 'character-portrait'}
      src={asset(art[variant])}
      alt={`${person.name}${variant === 'avatar' ? '头像' : '人物像'}`}
      width={variant === 'avatar' ? 240 : 720}
      height={variant === 'avatar' ? 240 : 960}
      loading={variant === 'avatar' ? 'lazy' : 'eager'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
