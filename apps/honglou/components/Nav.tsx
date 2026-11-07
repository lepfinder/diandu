'use client';

import { SiteNav, type SiteNavItem } from '@classic/ui';

const items: SiteNavItem[] = [
  { id: 'home', label: '首页', href: '/', icon: 'home' },
  { id: 'taixu', label: '太虚', href: '/taixu/', icon: 'star', openInNewTab: true },
  { id: 'zanghua', label: '葬花', href: '/zanghua/', icon: 'scroll', openInNewTab: true },
  { id: 'read', label: '阅读', href: '/read/1/', icon: 'book', continueReading: true },
  { id: 'chars', label: '人物', href: '/characters/', icon: 'users' },
  { id: 'starmap', label: '关系', href: '/star/', icon: 'graph' },
  { id: 'garden', label: '园林', href: '/garden/', icon: 'garden' },
  { id: 'topics', label: '专题', href: '/topics/places/', icon: 'scroll' },
  { id: 'search', label: '检索', href: '/search/', icon: 'search' },
];

export function Nav() {
  return (
    <SiteNav
      brand="梦"
      brandTitle="红楼梦"
      storagePrefix="hl"
      items={items}
      themeTitle="切换主题（T）"
    />
  );
}
