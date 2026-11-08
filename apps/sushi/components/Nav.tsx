'use client';

import { SiteNav, type SiteNavItem } from '@classic/ui';

const items: SiteNavItem[] = [
  { id: 'home', label: '首页', href: '/', icon: 'home' },
  { id: 'life', label: '生平', href: '/life/', icon: 'scroll' },
  { id: 'works', label: '作品', href: '/works/', icon: 'book' },
  { id: 'topics', label: '专题', href: '/topics/chibi/', icon: 'map' },
  { id: 'circle', label: '交游', href: '/circle/', icon: 'users' },
  { id: 'search', label: '检索', href: '/search/', icon: 'search' },
];

export function Nav() {
  return <SiteNav brand="苏" brandTitle="苏轼" storagePrefix="ss" items={items} />;
}
