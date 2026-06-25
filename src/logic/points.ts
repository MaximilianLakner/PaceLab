/**
 * World-Athletics-Punkteberechnung (Männer-Zehnkampf).
 *
 * Zwei Formeln:
 *  - Läufe:        Punkte = A · (B − P)^C   (P = Zeit in Sekunden)
 *  - Sprung/Wurf:  Punkte = A · (P − B)^C   (P = Leistung; Sprünge in cm, Würfe in m)
 *
 * Ergebnis wird abgerundet (floor); negatives Ergebnis → 0 Punkte.
 *
 * Handzeitmessung (kürzere Läufe): vor der Berechnung wird ein Aufschlag auf
 * die Zeit addiert:
 *   - 100 m und 110 m Hürden: +0,24 s
 *   - 400 m:                  +0,14 s
 *   - Läufe ab 800 m:         keine Korrektur
 */

import type { Discipline, Zeitnahme } from '@/data/types';

/** Handzeit-Aufschläge je Disziplin-ID (Sekunden). */
const HANDZEIT_AUFSCHLAG: Record<string, number> = {
  'std-100m': 0.24,
  'std-110mh': 0.24,
  'std-400m': 0.14,
};

/**
 * Wandelt einen erfassten Wert (in der Einheit der Disziplin) in die Einheit
 * um, die die Punkteformel erwartet (pointsUnit).
 * Einzige nötige Umrechnung: Meter → Zentimeter (Sprünge).
 */
function toPointsUnit(discipline: Discipline, wert: number): number {
  const p = discipline.waParams;
  if (!p) return wert;
  if (discipline.unit === 'Meter' && p.pointsUnit === 'Zentimeter') {
    return wert * 100;
  }
  if (discipline.unit === 'Zentimeter' && p.pointsUnit === 'Meter') {
    return wert / 100;
  }
  return wert;
}

/**
 * Berechnet die World-Athletics-Punkte für einen einzelnen Wert.
 *
 * @param discipline  Disziplin inkl. waParams (sonst null – nicht wertbar).
 * @param wert        Leistung in der Einheit der Disziplin.
 * @param zeitnahme   Optionale Zeitnahme-Art; bei 'hand' wird der Aufschlag
 *                    auf kurze Läufe addiert.
 * @returns Punkte (ganzzahlig, ≥ 0) oder null, wenn keine Wertung möglich ist.
 */
export function berechnePunkte(
  discipline: Discipline,
  wert: number,
  zeitnahme?: Zeitnahme,
): number | null {
  const p = discipline.waParams;
  if (!p) return null;
  if (!Number.isFinite(wert)) return null;

  let P = toPointsUnit(discipline, wert);

  // Handzeit-Korrektur nur für Läufe und nur bei Handmessung.
  if (p.type === 'lauf' && zeitnahme === 'hand') {
    const aufschlag = HANDZEIT_AUFSCHLAG[discipline.id] ?? 0;
    P = P + aufschlag;
  }

  let basis: number;
  if (p.type === 'lauf') {
    basis = p.B - P; // bei Läufen: (B − P)
  } else {
    basis = P - p.B; // bei Sprung/Wurf: (P − B)
  }

  // Negative Basis würde mit nicht-ganzzahligem Exponenten NaN ergeben → 0.
  if (basis <= 0) return 0;

  const punkte = p.A * Math.pow(basis, p.C);
  if (!Number.isFinite(punkte) || punkte < 0) return 0;
  return Math.floor(punkte);
}

/**
 * Hilfsfunktion: liefert true, wenn die Disziplin überhaupt WA-wertbar ist.
 */
export function istWertbar(discipline: Discipline): boolean {
  return !!discipline.waParams;
}
