import booksJson from '../books.json';

export type BookEntry = {
  id: string;
  title: string;
  author: string;
  basePath: string;
  port: number;
  kicker: string;
  lead: string[];
  highlight: string;
  packageName: string;
};

/** 典读书目：聚合站与拼装部署共用。 */
export const BOOKS = booksJson as BookEntry[];

export function getBook(id: string) {
  return BOOKS.find((b) => b.id === id);
}
