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
  if (!chapter) notFound();
  const list = getChapterList();
  const prev = n > 1 ? list[n - 2] : null;
  const next = n < 120 ? list[n] : null;
  return <ReaderChrome chapter={chapter} prev={prev} next={next} toc={list} />;
}
