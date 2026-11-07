/** 1987 央视版《红楼梦》影视对照（王扶林导演）。
 *  演员与曲目为公开事实；剧照/音频受版权保护，站内不直接托管。 */

export type TV87Role = {
  /** 对应站内人物 id */
  charId: string;
  actor: string;
  /** 可选备注，如换角 */
  note?: string;
};

export type TV87Song = {
  id: string;
  title: string;
  /** 对应站内诗词 id（如有） */
  poemId?: string;
  lyricSource?: string;
  composer: string;
  singer: string;
  role: '主题曲' | '插曲';
  listenQuery: string;
};

export const TV87_META = {
  title: '红楼梦',
  year: 1987,
  director: '王扶林',
  network: '中央电视台',
  composer: '王立平',
  note: '87 版央视电视剧。人物对照用于「银幕形象」导读，音乐曲目挂靠对应诗词。',
};

export const TV87_ROLES: TV87Role[] = [
  { charId: 'baoyu', actor: '欧阳奋强' },
  { charId: 'daiyu', actor: '陈晓旭' },
  { charId: 'baochai', actor: '张莉' },
  { charId: 'xifeng', actor: '邓婕' },
  { charId: 'xiangyun', actor: '郭霄珍' },
  { charId: 'yuanchun', actor: '成梅' },
  { charId: 'yingchun', actor: '金莉莉', note: '后由牟一接演' },
  { charId: 'tanchun', actor: '东方闻樱' },
  { charId: 'xichun', actor: '胡泽红' },
  { charId: 'keqing', actor: '张蕾' },
  { charId: 'miaoyu', actor: '姬玉' },
  { charId: 'liwan', actor: '孙梦泉' },
  { charId: 'qiaojie', actor: '李端' },
  { charId: 'xiangling', actor: '陈剑月' },
  { charId: 'baoqin', actor: '王羊' },
  { charId: 'xiuyan', actor: '李伊' },
  { charId: 'youerjie', actor: '张明明' },
  { charId: 'yousanjie', actor: '周月' },
  { charId: 'qingwen', actor: '张静林', note: '安雯' },
  { charId: 'xiren', actor: '袁玫' },
  { charId: 'pinger', actor: '沈琳' },
  { charId: 'yuanyang', actor: '郑铮' },
  { charId: 'zijuan', actor: '徐丽霞' },
  { charId: 'jinchuan', actor: '张迎春' },
  { charId: 'lingguan', actor: '程荣' },
  { charId: 'jiazheng', actor: '马加奇' },
  { charId: 'wangfuren', actor: '周贤珍' },
  { charId: 'jiamu', actor: '李婷' },
  { charId: 'jiashe', actor: '李颉' },
  { charId: 'xingshi', actor: '夏明辉' },
  { charId: 'zhaoyiniang', actor: '苏秋冬', note: '一说战爱霞' },
  { charId: 'jialian', actor: '高宏亮' },
  { charId: 'xuepan', actor: '陈洪海' },
];

export const TV87_SONGS: TV87Song[] = [
  {
    id: 'wangningmei',
    title: '枉凝眉',
    poemId: undefined,
    lyricSource: '《红楼梦》曲 · 枉凝眉',
    composer: '王立平',
    singer: '陈力',
    role: '主题曲',
    listenQuery: '87版红楼梦 枉凝眉 陈力 王立平',
  },
  {
    id: 'zanghua',
    title: '葬花吟',
    poemId: 'zanghua',
    lyricSource: '葬花吟',
    composer: '王立平',
    singer: '陈力',
    role: '插曲',
    listenQuery: '87版红楼梦 葬花吟 陈力',
  },
  {
    id: 'hongdou',
    title: '红豆曲',
    poemId: 'hongdou',
    lyricSource: '红豆曲',
    composer: '王立平',
    singer: '陈力',
    role: '插曲',
    listenQuery: '87版红楼梦 红豆曲 陈力',
  },
  {
    id: 'haoliaoge',
    title: '好了歌',
    poemId: 'haoliaoge',
    lyricSource: '好了歌',
    composer: '王立平',
    singer: '王立平',
    role: '插曲',
    listenQuery: '87版红楼梦 好了歌 王立平',
  },
  {
    id: 'qingwenge',
    title: '晴雯歌',
    poemId: undefined,
    lyricSource: '咏晴雯',
    composer: '王立平',
    singer: '陈力',
    role: '插曲',
    listenQuery: '87版红楼梦 晴雯歌 陈力',
  },
  {
    id: 'tanxiangling',
    title: '叹香菱',
    poemId: undefined,
    lyricSource: '叹香菱',
    composer: '王立平',
    singer: '陈力',
    role: '插曲',
    listenQuery: '87版红楼梦 叹香菱 陈力',
  },
  {
    id: 'fenguru',
    title: '分骨肉',
    poemId: undefined,
    lyricSource: '分骨肉 · 探春',
    composer: '王立平',
    singer: '陈力',
    role: '插曲',
    listenQuery: '87版红楼梦 分骨肉 陈力',
  },
];

export function getTV87Role(charId: string): TV87Role | null {
  return TV87_ROLES.find((r) => r.charId === charId) ?? null;
}

export function getTV87SongByPoem(poemId: string): TV87Song | null {
  return TV87_SONGS.find((s) => s.poemId === poemId) ?? null;
}

export function tv87ListenUrl(song: TV87Song): string {
  return `https://music.163.com/#/search/m/?s=${encodeURIComponent(song.listenQuery)}`;
}
