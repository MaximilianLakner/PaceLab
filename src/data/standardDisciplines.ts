/**
 * Vorausgefüllte Standard-Disziplinen.
 *
 * Enthält die 10 offiziellen Männer-Zehnkampf-Disziplinen mit den
 * verbindlichen World-Athletics-Koeffizienten (A, B, C) sowie häufige
 * Trainingsvarianten ohne offizielle Punktewertung.
 *
 * Einheiten-Hinweis für die Punkteformel:
 *  - Läufe: P = Zeit in Sekunden
 *  - Sprünge/Stab: P in Zentimetern  → unit='Meter', pointsUnit='Zentimeter'
 *  - Würfe: P in Metern              → unit='Meter', pointsUnit='Meter'
 */

import type { Discipline } from './types';

export const STANDARD_DISCIPLINES: Discipline[] = [
  // --- Die 10 offiziellen Zehnkampf-Disziplinen ---
  {
    id: 'std-100m',
    name: '100 m',
    category: 'Sprint',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 25.4347, B: 18, C: 1.81, type: 'lauf', pointsUnit: 'Sekunden' },
  },
  {
    id: 'std-weitsprung',
    name: 'Weitsprung',
    category: 'Sprung',
    unit: 'Meter',
    direction: 'groesser_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 0.14354, B: 220, C: 1.4, type: 'sprung', pointsUnit: 'Zentimeter' },
  },
  {
    id: 'std-kugel',
    name: 'Kugelstoßen',
    category: 'Wurf',
    unit: 'Meter',
    direction: 'groesser_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 51.39, B: 1.5, C: 1.05, type: 'wurf', pointsUnit: 'Meter' },
  },
  {
    id: 'std-hochsprung',
    name: 'Hochsprung',
    category: 'Sprung',
    unit: 'Meter',
    direction: 'groesser_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 0.8465, B: 75, C: 1.42, type: 'sprung', pointsUnit: 'Zentimeter' },
  },
  {
    id: 'std-400m',
    name: '400 m',
    category: 'Sprint',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 1.53775, B: 82, C: 1.81, type: 'lauf', pointsUnit: 'Sekunden' },
  },
  {
    id: 'std-110mh',
    name: '110 m Hürden',
    category: 'Sprint',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 5.74352, B: 28.5, C: 1.92, type: 'lauf', pointsUnit: 'Sekunden' },
  },
  {
    id: 'std-diskus',
    name: 'Diskuswurf',
    category: 'Wurf',
    unit: 'Meter',
    direction: 'groesser_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 12.91, B: 4, C: 1.1, type: 'wurf', pointsUnit: 'Meter' },
  },
  {
    id: 'std-stab',
    name: 'Stabhochsprung',
    category: 'Sprung',
    unit: 'Meter',
    direction: 'groesser_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 0.2797, B: 100, C: 1.35, type: 'sprung', pointsUnit: 'Zentimeter' },
  },
  {
    id: 'std-speer',
    name: 'Speerwurf',
    category: 'Wurf',
    unit: 'Meter',
    direction: 'groesser_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 10.14, B: 7, C: 1.08, type: 'wurf', pointsUnit: 'Meter' },
  },
  {
    id: 'std-1500m',
    name: '1500 m',
    category: 'Ausdauer',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
    istZehnkampf: true,
    waParams: { A: 0.03768, B: 480, C: 1.85, type: 'lauf', pointsUnit: 'Sekunden' },
  },

  // --- Häufige Trainingsvarianten (ohne offizielle WA-Wertung) ---
  {
    id: 'std-60m',
    name: '60 m',
    category: 'Sprint',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
  },
  {
    id: 'std-200m',
    name: '200 m',
    category: 'Sprint',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
  },
  {
    id: 'std-300m',
    name: '300 m',
    category: 'Sprint',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
  },
  {
    id: 'std-3km',
    name: '3 km',
    category: 'Ausdauer',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
  },
  {
    id: 'std-huerden-kurz',
    name: 'Hürdenlauf (kurz)',
    category: 'Sprint',
    unit: 'Sekunden',
    direction: 'kleiner_ist_besser',
    istStandard: true,
  },
];

/** Feste Reihenfolge der 10 Zehnkampf-Disziplinen (für die Gesamtwertung/Anzeige). */
export const ZEHNKAMPF_REIHENFOLGE: string[] = [
  'std-100m',
  'std-weitsprung',
  'std-kugel',
  'std-hochsprung',
  'std-400m',
  'std-110mh',
  'std-diskus',
  'std-stab',
  'std-speer',
  'std-1500m',
];
