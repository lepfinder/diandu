import booksJson from '../books.json';
import peopleJson from '../people.json';

export type BookEntry = {
  id: string;
  title: string;
  author: string;
  basePath: string;
  port: number;
  kicker: string;
  lead: string[];
  highlight: string;
  cover: string;
  packageName: string;
};

export type PersonEntry = {
  id: string;
  name: string;
  courtesy?: string;
  hao?: string;
  basePath: string;
  port: number;
  kicker: string;
  lead: string[];
  highlight: string;
  cover: string;
  packageName: string;
};

/** 典读书目：聚合站与拼装部署共用。 */
export const BOOKS = booksJson as BookEntry[];

/** 人物精读站：与书目并列。 */
export const PEOPLE = peopleJson as PersonEntry[];

export function getBook(id: string) {
  return BOOKS.find((b) => b.id === id);
}

export function getPerson(id: string) {
  return PEOPLE.find((p) => p.id === id);
}
