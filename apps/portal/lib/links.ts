import type { BookEntry } from '@classic/catalog';

const assemble = process.env.NEXT_PUBLIC_SITE_MODE === 'assemble';

/** 组装部署走同域 basePath；本地开发跳各书独立端口。 */
export function bookHref(book: BookEntry) {
  if (assemble) return `${book.basePath}/`;
  return `http://localhost:${book.port}/`;
}
