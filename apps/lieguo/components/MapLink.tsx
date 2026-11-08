import { jiangshanLabel, jiangshanUrl, type MapAnchor } from '@/lib/map';

export function MapLink({
  anchor,
  className = 'btn ghost sm',
}: {
  anchor?: MapAnchor | null;
  className?: string;
}) {
  if (!anchor) return null;
  const href = jiangshanUrl(anchor);
  if (!href) return null;
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {jiangshanLabel(anchor)} ↗
    </a>
  );
}
