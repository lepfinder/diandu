import { notFound } from 'next/navigation';
import { getChapter, getChapterList } from '@/lib/book';
import { ReaderChrome } from '@/components/ReaderChrome';

export function generateStaticParams() {
  return getChapterList().map((c) => ({ n: String(c.n) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const ch = getChapter(Number(n));
  return { title: ch ? `${ch.label} ${ch.t1}` : '阅读' };
}

export default async function ReadPage({ params }: { params: Promise<{ n: string }> }) {
  const { n: ns } = await params;
  const n = Number(ns);
  const chapter = getChapter(n);
  if (!chapter || Number.isNaN(n)) notFound();
  const list = getChapterList();
  const index = list.findIndex((item) => item.n === n);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;
  return <ReaderChrome chapter={chapter} prev={prev} next={next} toc={list} />;
}
