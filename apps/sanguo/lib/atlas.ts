export type AtlasSlice = {
  from: number;
  to: number;
  year: number;
  place: string;
  label: string;
};

/** 回目对应的历史年份，只用来题图。色块跟着城池归属走。 */
const SLICES: AtlasSlice[] = [
  { from: 1, to: 4, year: 184, place: '洛阳', label: '黄巾起事前后的东汉' },
  { from: 5, to: 13, year: 192, place: '洛阳', label: '董卓与关东诸侯' },
  { from: 14, to: 21, year: 198, place: '许昌', label: '献帝迁许' },
  { from: 22, to: 29, year: 199, place: '官渡', label: '袁曹相持' },
  { from: 30, to: 33, year: 200, place: '官渡', label: '官渡之战与平河北' },
  { from: 34, to: 40, year: 207, place: '襄阳', label: '刘备寄寓荆州' },
  { from: 41, to: 48, year: 208, place: '赤壁', label: '曹操南下' },
  { from: 49, to: 51, year: 208, place: '赤壁', label: '赤壁之战' },
  { from: 52, to: 57, year: 209, place: '荆州', label: '孙刘争荆州' },
  { from: 58, to: 59, year: 211, place: '长安', label: '马超战关中' },
  { from: 60, to: 64, year: 212, place: '成都', label: '刘备取蜀' },
  { from: 65, to: 65, year: 214, place: '成都', label: '刘备入成都' },
  { from: 66, to: 74, year: 217, place: '汉中', label: '汉中之争' },
  { from: 75, to: 77, year: 219, place: '荆州', label: '吕蒙袭荆州' },
  { from: 78, to: 82, year: 221, place: '成都', label: '刘备称帝' },
  { from: 83, to: 85, year: 222, place: '白帝城', label: '夷陵与白帝托孤' },
  { from: 86, to: 90, year: 225, place: '成都', label: '诸葛亮平定南中' },
  { from: 91, to: 104, year: 228, place: '祁山', label: '诸葛亮北伐' },
  { from: 105, to: 115, year: 258, place: '汉中', label: '姜维屡伐中原' },
  { from: 116, to: 117, year: 263, place: '汉中', label: '钟会伐蜀' },
  { from: 118, to: 118, year: 263, place: '成都', label: '后主出降' },
  { from: 119, to: 119, year: 265, place: '洛阳', label: '司马炎受禅' },
  { from: 120, to: 120, year: 280, place: '建业', label: '孙皓归晋' },
];

export function atlasSlice(chapter: number): AtlasSlice {
  return SLICES.find((slice) => chapter >= slice.from && chapter <= slice.to) ?? SLICES[0];
}

