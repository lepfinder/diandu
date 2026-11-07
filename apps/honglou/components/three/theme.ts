/** 3D 场景共用的配色与主题读取 */

export type ThemeName = 'paper' | 'sepia' | 'night';

export type ScenePalette = {
  bg: number;
  bgCss: string;
  ink: number;
  inkSoft: number;
  paper: number;
  accent: number;
  gold: number;
  jade: number;
  water: number;
  wood: number;
  roof: number;
  leaf: number;
  leafAutumn: number;
  snow: number;
  starCore: number;
  starHalo: number;
};

const PALETTES: Record<ThemeName, ScenePalette> = {
  paper: {
    bg: 0x0b0e14,
    bgCss: '#0b0e14',
    ink: 0x1c1814,
    inkSoft: 0x6b5f52,
    paper: 0xf3ede2,
    accent: 0xb5442e,
    gold: 0xc4a35a,
    jade: 0x4a6b5d,
    water: 0x3d6b8a,
    wood: 0x6b5344,
    roof: 0x3a4a42,
    leaf: 0x5f8f6a,
    leafAutumn: 0xc4783a,
    snow: 0xe8e4dc,
    starCore: 0xf0e2b8,
    starHalo: 0xc4a35a,
  },
  sepia: {
    bg: 0x120e0a,
    bgCss: '#120e0a',
    ink: 0x2a1f12,
    inkSoft: 0x6b5432,
    paper: 0xe8d5b5,
    accent: 0xa13c28,
    gold: 0xa8843c,
    jade: 0x4d6348,
    water: 0x5a6a52,
    wood: 0x5c4030,
    roof: 0x3d3228,
    leaf: 0x6a7a48,
    leafAutumn: 0xb86a30,
    snow: 0xe0d4b8,
    starCore: 0xe8d4a0,
    starHalo: 0xa8843c,
  },
  night: {
    bg: 0x050608,
    bgCss: '#050608',
    ink: 0x1a1814,
    inkSoft: 0x4a4338,
    paper: 0xe8e0d4,
    accent: 0xd4785f,
    gold: 0xd4b87a,
    jade: 0x7fa391,
    water: 0x2a4a5c,
    wood: 0x4a3830,
    roof: 0x2a322c,
    leaf: 0x3a5a42,
    leafAutumn: 0x8a4a28,
    snow: 0xc8c4bc,
    starCore: 0xffe8b0,
    starHalo: 0xd4b87a,
  },
};

export function readTheme(): ThemeName {
  if (typeof document === 'undefined') return 'paper';
  const t = document.documentElement.getAttribute('data-theme');
  return (t as ThemeName) || 'paper';
}

export function palette(theme: ThemeName = readTheme()): ScenePalette {
  return PALETTES[theme] || PALETTES.paper;
}

export function observeTheme(cb: (p: ScenePalette, theme: ThemeName) => void): () => void {
  const emit = () => {
    const t = readTheme();
    cb(palette(t), t);
  };
  emit();
  const mo = new MutationObserver(emit);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
}
