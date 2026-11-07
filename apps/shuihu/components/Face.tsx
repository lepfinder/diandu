'use client';

import { useState } from 'react';

export function Face({
  name,
  image,
  color,
  className = 'avatar',
}: {
  name: string;
  image?: string;
  color?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={`${className} portrait`} src={image} alt="" onError={() => setFailed(true)} />
    );
  }
  return (
    <span className={className} style={{ background: color }}>
      {name.slice(0, 1)}
    </span>
  );
}
