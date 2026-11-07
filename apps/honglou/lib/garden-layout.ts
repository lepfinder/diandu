/** 大观园微缩沙盘：手绘布局坐标（俯视 XZ 平面，Y 为高度） */
export type GardenKind = 'house' | 'nunnery' | 'cottage' | 'farm' | 'pavilion' | 'bridge' | 'mound' | 'hall' | 'garden';

export type GardenSpot = {
  id: string;
  name: string;
  host: string;
  desc: string;
  tags: string[];
  kind: GardenKind;
  /** 世界坐标 */
  x: number;
  z: number;
  /** 建筑朝向（弧度） */
  rot?: number;
  /** 季节/幕次高亮 */
  acts?: number[];
};

/** 五幕（用于园林气候与星图时间轴） */
export const GARDEN_ACTS = [
  { id: 'open', n: 0, title: '神话缘起', range: [1, 5] as [number, number], season: '冬', tone: 0.15 },
  { id: 'garden', n: 1, title: '入园盛景', range: [6, 56] as [number, number], season: '春', tone: 0.85 },
  { id: 'turn', n: 2, title: '裂痕初现', range: [57, 78] as [number, number], season: '秋', tone: 0.55 },
  { id: 'fall', n: 3, title: '大厦倾颓', range: [79, 110] as [number, number], season: '暮秋', tone: 0.3 },
  { id: 'end', n: 4, title: '归彼大荒', range: [111, 120] as [number, number], season: '雪', tone: 0.08 },
];

/**
 * 布局意象（对经典大观园图做自由简化）：
 * 北高南低，沁芳溪自东北斜贯西南；
 * 怡红近门、潇湘多竹、蘅芜冷香、稻香田园、栊翠孤庵。
 */
export const GARDEN_SPOTS: GardenSpot[] = [
  {
    id: 'longCui', name: '栊翠庵', host: '妙玉', kind: 'nunnery', x: -26, z: -22, rot: 0.3,
    desc: '园中庵堂，红梅映雪。妙玉品茶、折梅，刘姥姥用过的成窑杯被她嫌脏丢弃。',
    tags: ['妙玉居所', '红梅', '品茶'], acts: [1, 2, 4],
  },
  {
    id: 'hengWu', name: '蘅芜苑', host: '薛宝钗', kind: 'house', x: -16, z: -12, rot: -0.2,
    desc: '奇草仙藤，雪洞一般。宝钗「不见花柳繁华」的冷香，在此体现得淋漓尽致。',
    tags: ['宝钗居所', '雪洞', '冷香'], acts: [1, 2],
  },
  {
    id: 'ouXiang', name: '暖香坞', host: '贾惜春', kind: 'house', x: -6, z: -16, rot: 0.1,
    desc: '温暖向阳，惜春在此作画。芦雪庵联诗后制春灯谜亦在此。',
    tags: ['惜春居所', '作画'], acts: [1, 2],
  },
  {
    id: 'luXue', name: '芦雪庵', host: '诗社众人', kind: 'cottage', x: 4, z: -18, rot: 0,
    desc: '傍山临水，茅檐土壁，推窗垂钓。琉璃世界白雪红梅，割腥啖膻、即景联诗的名场面发生地。',
    tags: ['联诗', '烤鹿肉', '红梅'], acts: [1],
  },
  {
    id: 'daoXiang', name: '稻香村', host: '李纨', kind: 'farm', x: 22, z: -14, rot: 0.4,
    desc: '茅檐土壁，槿篱竹牖，一派田园气象。李纨居此守节教子，诗社中号「稻香老农」。',
    tags: ['李纨居所', '田园'], acts: [1, 2, 3],
  },
  {
    id: 'tuanYuan', name: '沁芳亭 · 沁芳桥', host: '—', kind: 'bridge', x: 0, z: 0,
    desc: '园中水系要冲，落花逐水。宝玉题「沁芳」，暗合「花落水流红」的宿命。',
    tags: ['水景', '落花'], acts: [1, 2, 3, 4],
  },
  {
    id: 'diCui', name: '滴翠亭', host: '—', kind: 'pavilion', x: 14, z: 2,
    desc: '四面环水，翠绿滴翠。宝钗在此扑蝶，无意听到小红私情，借「金蝉脱壳」。',
    tags: ['扑蝶', '滴翠亭杨妃'], acts: [1],
  },
  {
    id: 'aoXiang', name: '凹晶溪馆 · 凸碧堂', host: '—', kind: 'pavilion', x: 20, z: 12, rot: -0.5,
    desc: '中秋赏月，凸碧堂品笛，凹晶馆联诗。黛玉湘云「寒塘渡鹤影，冷月葬花魂」于此写成。',
    tags: ['中秋', '联诗', '冷月葬花魂'], acts: [2],
  },
  {
    id: 'qiuShuang', name: '秋爽斋', host: '贾探春', kind: 'house', x: -22, z: 4, rot: 0.2,
    desc: '阔朗疏爽，大理石大案，宝砚林立。探春发起海棠诗社于此，是大观园的「议事厅」。',
    tags: ['探春居所', '海棠社'], acts: [1, 2, 3],
  },
  {
    id: 'xiaoXiang', name: '潇湘馆', host: '林黛玉', kind: 'house', x: -12, z: 16, rot: 0.5,
    desc: '千百竿翠竹遮映，凤尾森森，龙吟细细。黛玉在此还泪、葬花、焚稿，是全书最诗意也最凄清的空间。',
    tags: ['黛玉居所', '翠竹', '还泪'], acts: [1, 2, 3],
  },
  {
    id: 'mangXiang', name: '埋香冢', host: '—', kind: 'mound', x: -2, z: 24,
    desc: '花冢。黛玉在此吟出《葬花吟》——「一朝春尽红颜老，花落人亡两不知」。',
    tags: ['葬花吟', '名场面'], acts: [1],
  },
  {
    id: 'yiHong', name: '怡红院', host: '贾宝玉', kind: 'house', x: 16, z: 18, rot: -0.3,
    desc: '院中海棠芭蕉，富丽精雅。宝玉题「红香绿玉」，元春改「怡红快绿」。是全书情感的风暴眼。',
    tags: ['宝玉居所', '红香绿玉'], acts: [1, 2, 3, 4],
  },
  {
    id: 'huaShu', name: '梨香院', host: '薛家', kind: 'hall', x: -34, z: 14, rot: 0.8,
    desc: '薛家初进贾府所居，后为梨香院戏班驻地。龄官划蔷、十二女伶排演于此。',
    tags: ['梨香院', '戏班'], acts: [1, 2],
  },
  {
    id: 'ningGuo', name: '会芳园（宁国府）', host: '贾珍', kind: 'garden', x: 30, z: -20, rot: -0.6,
    desc: '宁府花园。贾瑞起淫心、秦可卿丧礼前后多在此展开。与荣府形成对照的荒淫暗面。',
    tags: ['宁府', '会芳园'], acts: [0, 1, 2, 3],
  },
];

/** 沁芳溪折线（自东北向西南） */
export const STREAM_POINTS: [number, number][] = [
  [28, -20],
  [18, -10],
  [10, -4],
  [2, 2],
  [-6, 8],
  [-14, 14],
  [-24, 22],
];
