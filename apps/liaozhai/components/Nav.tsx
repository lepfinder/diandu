'use client';

import { SiteNav, type SiteNavItem } from '@classic/ui';

const items: SiteNavItem[] = [
  { id: 'home', label: '首页', href: '/', icon: 'home' },
  { id: 'read', label: '阅读', href: '/read/1/', icon: 'book', continueReading: true },
  { id: 'chars', label: '人物', href: '/characters/', icon: 'users' },
  { id: 'topics', label: '专题', href: '/topics/kinds/', icon: 'map' },
  { id: 'search', label: '检索', href: '/search/', icon: 'search' },
];

export function Nav() {
  return <SiteNav brand="聊" brandTitle="聊斋志异" storagePrefix="lz" items={items} />;
}
