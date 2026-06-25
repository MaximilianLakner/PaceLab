/**
 * Zentrale Design-Tokens für PaceLab.
 *
 * Grundsatz aus der Spezifikation:
 *  - Text, Icons, Diagrammlinien und Achsen DÜRFEN dunkel/fast schwarz sein
 *    (Lesbarkeit hat Vorrang).
 *  - Die Pastell-Palette gilt ausschließlich für gestalterische Flächen:
 *    Hintergründe, Karten, Akzente, Buttons und Diagramm-Füllungen.
 *
 * Es gibt bewusst nur ein helles Farbschema (kein Dark Mode in v1), damit die
 * abgestimmte Pastell-Palette nicht gebrochen wird.
 */

export const Colors = {
  // Hintergründe
  background: '#FCFCFC',
  backgroundAlt: '#F8F5EE',

  // Flächen / Sektionen
  surface: '#F2F2F2',
  surfaceStrong: '#E7E7E7',

  // Karten
  card: '#EEEBE4',
  cardStrong: '#E1DFD3',

  // Sekundär-Akzent (Taupe)
  taupe: '#CDBEB7',
  taupe2: '#D7C8C5',
  taupe3: '#E2D3D0',

  // Primär-Akzent / Highlights / PB (Blush)
  blush: '#E5C9BE',
  blush2: '#EFD2CA',
  blush3: '#F9DBD3',

  // Neutrale Trenner / dezente Elemente (Grau)
  gray: '#949494',
  gray2: '#A0A0A0',
  gray3: '#AAAAAA',

  // Text & Linien (dunkel – für Lesbarkeit erlaubt)
  text: '#1A1A1A',
  textMuted: '#5A5A5A',
  axis: '#1A1A1A',
  grid: '#D8D8D8',

  // Funktionsfarben (dezent gehalten, im Pastell-Rahmen)
  border: '#E0DDD4',
} as const;

/**
 * Farbreihenfolge für Diagramm-Serien (mehrere Disziplinen).
 * Reihenfolge laut Spezifikation: Taupe → Blush → Salbei → Grau.
 */
export const ChartSeriesColors = [
  '#CDBEB7', // Taupe
  '#E5C9BE', // Blush
  '#E1DFD3', // Salbei
  '#A0A0A0', // Grau
] as const;

/** Akzentfarbe für die Primäraktion (Blush) und die PB-Hervorhebung. */
export const Accent = Colors.blush;
export const AccentStrong = '#D9A899'; // dunkleres Blush nur für dünne Rahmen/Markierungen

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
} as const;
