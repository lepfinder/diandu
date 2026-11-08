/** 按叙事阶段给单行回目补一句短注，避免目录卡只有标题显得干。 */
const PHASES: { until: number; label: string }[] = [
  { until: 11, label: '朝歌失德' },
  { until: 14, label: '哪吒出世' },
  { until: 24, label: '子牙归周' },
  { until: 34, label: '飞虎反商' },
  { until: 52, label: '西岐大战' },
  { until: 66, label: '东征前夜' },
  { until: 84, label: '破关破阵' },
  { until: 97, label: '牧野灭商' },
  { until: 100, label: '封神建国' },
];

export function phaseLabel(chapter: number): string {
  for (const phase of PHASES) {
    if (chapter <= phase.until) return phase.label;
  }
  return PHASES[PHASES.length - 1].label;
}
