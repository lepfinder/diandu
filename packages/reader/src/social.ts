import type { ReaderSocialLayer } from './types';

export type WereadSocialHighlight = {
  bookmarkId: string;
  markText: string;
  quote?: string;
  totalCount: number;
  ch?: number;
  status: string;
};

export type WereadSocialReview = {
  reviewId?: string;
  star?: number;
  content: string;
  createTime?: number;
  authorName?: string;
};

export type WereadSocialPayload = {
  source: {
    provider?: string;
    bookId?: string;
    title: string;
    readerLink: string;
    note?: string;
  };
  highlights: WereadSocialHighlight[];
  reviews?: WereadSocialReview[];
};

/** 把 weread-social.json 转成 ReaderChrome 的 social prop */
export function buildSocialLayer(
  data: WereadSocialPayload,
  opts?: { sourceLabel?: string },
): ReaderSocialLayer {
  return {
    sourceLabel: opts?.sourceLabel ?? '微信读书',
    sourceUrl: data.source.readerLink,
    bookTitle: data.source.title,
    highlights: data.highlights
      .filter((h) => h.status === 'matched' && h.ch != null && h.quote)
      .map((h) => ({
        id: `social:${h.bookmarkId}`,
        ch: h.ch!,
        quote: h.quote!,
        totalCount: h.totalCount,
        markText: h.markText,
      })),
    reviews: (data.reviews || []).map((r) => ({
      id: r.reviewId,
      authorName: r.authorName,
      content: r.content,
      star: r.star,
      createTime: r.createTime,
    })),
  };
}
