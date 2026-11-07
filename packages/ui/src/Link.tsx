import NextLink from 'next/link';
import type { ComponentProps } from 'react';

/** 静态导出站点统一关闭 prefetch，避免多余请求。 */
export function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}

export default Link;
