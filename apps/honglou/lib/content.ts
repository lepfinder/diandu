import type { Character, Relation, TopicPlace, TwelveItem, PoemItem, PoemFullItem, EssayItem, TimelineItem } from './types';
import content from '@/data/content.json';
import { RELATION_PATCHES } from './relation-patches';
import extraCharacters from '@/data/extra-characters.json';

type Content = {
  groups: { id: string; name: string; color: string }[];
  list: Character[];
  relations: Relation[];
  topics: {
    places: { title: string; intro: string; items: TopicPlace[] };
    twelve: {
      title: string;
      intro: string;
      items: TwelveItem[];
      fuCe?: TwelveItem[];
      fuCeIntro?: string;
      youFuCe?: TwelveItem[];
      youFuCeIntro?: string;
    };
    qu?: {
      title: string;
      intro: string;
      items: {
        id: string;
        title: string;
        person: string;
        personId: string | null;
        image: string;
        text: string;
        read: string;
      }[];
    };
    poems: { title: string; intro: string; items: PoemItem[]; full?: PoemFullItem[] };
    background: { title: string; intro: string; essays: EssayItem[] };
    timeline: TimelineItem[];
  };
};

const data = content as Content;

/** 合并次级人物（有名有戏的配角） */
function mergeCharacters(base: Character[]): Character[] {
  const map = new Map<string, Character>();
  for (const c of base) map.set(c.id, c);
  for (const c of extraCharacters as Character[]) {
    if (!map.has(c.id)) map.set(c.id, c);
  }
  // 校正别名/显示名
  const zhou = map.get('jiaxuan');
  if (zhou) {
    zhou.name = '周瑞家的';
    zhou.role = '王夫人陪房';
    zhou.tag = '送宫花';
  }
  return [...map.values()];
}

const allCharacters = mergeCharacters(data.list);

/** 合并正文校订的关系边：同 (s,t,type) 覆盖，不同类型可并存 */
function mergeRelations(base: Relation[]): Relation[] {
  const key = (r: Relation) => `${r.s}|${r.t}|${r.type}`;
  const map = new Map<string, Relation>();
  for (const r of base) map.set(key(r), r);
  for (const p of RELATION_PATCHES) {
    const k = key(p as Relation);
    map.set(k, { ...(map.get(k) || {}), ...p } as Relation);
  }
  return [...map.values()];
}

const relations = mergeRelations(data.relations);

export function getGroups() {
  return data.groups;
}

export function getCharacters(filter?: string): Character[] {
  if (!filter || filter === 'all') return allCharacters;
  return allCharacters.filter((c) => c.group === filter);
}

export function getCharacter(id: string): Character | null {
  return allCharacters.find((c) => c.id === id) ?? null;
}

export function getRelationsFor(id: string): (Relation & { other: Character })[] {
  return relations
    .filter((r) => r.s === id || r.t === id)
    .map((r) => {
      const otherId = r.s === id ? r.t : r.s;
      const other = data.list.find((c) => c.id === otherId)!;
      return { ...r, other };
    })
    .filter((r) => r.other);
}

export function getAllRelations() {
  return relations.filter((r) => {
    return allCharacters.some((c) => c.id === r.s) && allCharacters.some((c) => c.id === r.t);
  });
}

export function getCharactersByIds(ids: string[]) {
  return allCharacters.filter((c) => ids.includes(c.id));
}

export function getTopics() {
  return data.topics;
}

export function getAllCharacters() {
  return allCharacters;
}

/** 主要人物名单（图谱默认展示） */
export const GRAPH_FOCUS = [
  'baoyu', 'daiyu', 'baochai', 'xifeng', 'xiangyun', 'jiamu', 'jiazheng', 'wangfuren',
  'jialian', 'xueyima', 'xuepan', 'linruhai', 'jiamin', 'liwan', 'tanchun', 'yingchun',
  'xichun', 'yuanchun', 'keqing', 'miaoyu', 'qiaojie', 'xiren', 'qingwen', 'pinger',
  'yuanyang', 'zijuan', 'xiangling', 'liulaolao', 'youerjie', 'yousanjie', 'liuxianglian',
  'jiazhen', 'youshi', 'jiashe', 'xingshi', 'zhaoyiniang', 'jiahuan', 'baoqin', 'xueke',
];

export const PLACE_IMAGES: Record<string, string> = {
  yiHong: '/images/place-yihong.webp',
  xiaoXiang: '/images/place-xiaoxiang.webp',
  hengWu: '/images/place-hengwu.webp',
  qiuShuang: '/images/place-qiushuang.webp',
  daoXiang: '/images/place-daoxiang.webp',
  ouXiang: '/images/place-nuanxiang.webp',
  longCui: '/images/place-longcui.webp',
  luXue: '/images/place-luxue.webp',
  tuanYuan: '/images/place-qinfang.webp',
  diCui: '/images/place-dicui.webp',
  mangXiang: '/images/place-mangxiang.webp',
  aoXiang: '/images/place-aojing.webp',
  huaShu: '/images/place-lixang.webp',
  ningGuo: '/images/place-huifang.webp',
};

export const TWELVE_IMAGES: Record<string, string> = {
  daiyu: '/images/chai-daiyu.webp',
  baochai: '/images/chai-baochai.webp',
  yuanchun: '/images/chai-yuanchun.webp',
  yingchun: '/images/chai-yingchun.webp',
  tanchun: '/images/chai-tanchun.webp',
  xichun: '/images/chai-xichun.webp',
  xifeng: '/images/chai-xifeng.webp',
  keqing: '/images/chai-keqing.webp',
  miaoyu: '/images/chai-miaoyu.webp',
  xiangyun: '/images/chai-xiangyun.webp',
  liwan: '/images/chai-liwan.webp',
  qiaojie: '/images/chai-qiaojie.webp',
};

export const POEM_IMAGES: Record<string, string> = {
  fusheng: '/images/poem-fusheng.webp',
  huangtang: '/images/poem-huangtang.webp',
  wucai: '/images/poem-wucai.webp',
  haoliaoge: '/images/poem-haoliaoge.webp',
  haoliaoge_zhu: '/images/poem-haoliaoge-zhu.webp',
  xijiangyue: '/images/poem-xijiangyue.webp',
  zanghua: '/images/poem-zanghua.webp',
  hongdou: '/images/poem-hongdou.webp',
  tipa: '/images/poem-jueci.webp',
  qiuchuang: '/images/poem-qiuchuang.webp',
  baitang: '/images/poem-baitang.webp',
  yongju: '/images/poem-yongju.webp',
  wenju: '/images/poem-wenju.webp',
  pangxie: '/images/poem-pangxie.webp',
  xiangling1: '/images/poem-xiangling.webp',
  xiangling3: '/images/poem-xiangling.webp',
  hongmei: '/images/poem-hongmei.webp',
  guaijiu: '/images/poem-guaijiu.webp',
  wumei: '/images/poem-wumei.webp',
  taohua: '/images/poem-taohua.webp',
  nankezi: '/images/poem-nankezi.webp',
  tangduoling: '/images/poem-tangduoling.webp',
  xijiangyue_liuxu: '/images/poem-nankezi.webp',
  linjiang: '/images/poem-linjiang.webp',
  liuxu: '/images/poem-liuxu.webp',
  guihua: '/images/poem-guihua.webp',
  furong: '/images/poem-furong.webp',
  zilingzhou: '/images/poem-zilingzhou.webp',
  guibi: '/images/poem-guibi.webp',
  jieshu: '/images/poem-jieshu.webp',
};

export const BG_IMAGES: Record<string, string> = {
  author: '/images/bg-author.webp',
  versions: '/images/bg-versions.webp',
  xue: '/images/bg-xue.webp',
  symbol: '/images/bg-symbol.webp',
  reading: '/images/bg-reading.webp',
};

/** 情节年表幕次：按回目区间归入五幕 */
export const TL_ACTS = [
  { id: 'open', title: '第一幕 · 神话缘起', range: [1, 5], image: '/images/tl-open.webp', blurb: '石头下凡、还泪之说，太虚幻境唱尽命册。' },
  { id: 'garden', title: '第二幕 · 入园盛景', range: [6, 56], image: '/images/tl-garden.webp', blurb: '刘姥姥打抽丰，众钗入住大观园，诗社与宴饮。' },
  { id: 'turn', title: '第三幕 · 裂痕初现', range: [57, 78], image: '/images/tl-turn.webp', blurb: '尤氏姐妹悲剧、抄检大观园、晴雯夭亡。' },
  { id: 'fall', title: '第四幕 · 大厦倾颓', range: [79, 110], image: '/images/tl-fall.webp', blurb: '黛死钗嫁、锦衣军查抄、贾母归西。' },
  { id: 'end', title: '第五幕 · 归彼大荒', range: [111, 120], image: '/images/tl-end.webp', blurb: '宝玉却尘缘出家，甄贾归结红楼梦。' },
];

export function actForChapter(ch: number) {
  return TL_ACTS.find((a) => ch >= a.range[0] && ch <= a.range[1]) || TL_ACTS[TL_ACTS.length - 1];
}
