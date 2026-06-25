/**
 * Formatierung und Eingabe-Parsing je nach Disziplin-Einheit.
 *
 * Läufe werden als Zeit erfasst/angezeigt:
 *   - unter 1 Minute:  "10,84 s"
 *   - ab 1 Minute:     "4:05,30"  (mm:ss,SS)
 *   Eingabe akzeptiert: "10,84", "10.84", "4:05,30", "4:05.3"
 *
 * Sprünge/Würfe werden als Distanz erfasst/angezeigt: "7,85 m" bzw. "205 cm".
 *   Eingabe akzeptiert Komma oder Punkt als Dezimaltrenner.
 */

import type { Discipline } from '@/data/types';

export interface ParseResult {
  ok: boolean;
  value?: number;
  error?: string;
}

/** Ist die Disziplin zeitbasiert (Lauf)? */
export function istZeitDisziplin(d: Discipline): boolean {
  return d.unit === 'Sekunden';
}

/** Sekunden → Anzeige-String ("10,84 s" oder "4:05,30"). */
export function formatZeit(sekunden: number): string {
  if (!Number.isFinite(sekunden)) return '–';
  if (sekunden < 60) {
    return `${sekunden.toFixed(2).replace('.', ',')} s`;
  }
  const min = Math.floor(sekunden / 60);
  const rest = sekunden - min * 60;
  // rest mit führender Null und 2 Nachkommastellen
  const restStr = rest.toFixed(2).replace('.', ',').padStart(5, '0');
  return `${min}:${restStr}`;
}

/** Distanzwert in der Einheit der Disziplin → Anzeige-String. */
export function formatDistanz(wert: number, unit: Discipline['unit']): string {
  if (!Number.isFinite(wert)) return '–';
  if (unit === 'Zentimeter') {
    return `${Math.round(wert)} cm`;
  }
  // Meter mit 2 Nachkommastellen
  return `${wert.toFixed(2).replace('.', ',')} m`;
}

/** Generische Anzeige eines Wertes je nach Disziplin. */
export function formatWert(d: Discipline, wert: number): string {
  if (istZeitDisziplin(d)) return formatZeit(wert);
  if (d.unit === 'Punkte') return `${Math.round(wert)} P`;
  return formatDistanz(wert, d.unit);
}

/** Kurzform ohne Einheit (für Achsenbeschriftung). */
export function formatWertKurz(d: Discipline, wert: number): string {
  if (istZeitDisziplin(d)) {
    if (wert < 60) return wert.toFixed(2).replace('.', ',');
    const min = Math.floor(wert / 60);
    const rest = wert - min * 60;
    return `${min}:${rest.toFixed(1).replace('.', ',').padStart(4, '0')}`;
  }
  if (d.unit === 'Zentimeter') return String(Math.round(wert));
  return wert.toFixed(2).replace('.', ',');
}

/**
 * Parst eine Zeiteingabe in Sekunden.
 * Akzeptiert "ss,SS", "ss.SS", "mm:ss,SS".
 */
export function parseZeit(text: string): ParseResult {
  const t = text.trim().replace(',', '.');
  if (!t) return { ok: false, error: 'Bitte eine Zeit eingeben.' };

  if (t.includes(':')) {
    const teile = t.split(':');
    if (teile.length !== 2) {
      return { ok: false, error: 'Format mm:ss,SS erwartet.' };
    }
    const min = Number(teile[0]);
    const sek = Number(teile[1]);
    if (!Number.isInteger(min) || min < 0 || !Number.isFinite(sek) || sek < 0 || sek >= 60) {
      return { ok: false, error: 'Ungültige Zeit (Sekunden 0–59).' };
    }
    return { ok: true, value: min * 60 + sek };
  }

  const sek = Number(t);
  if (!Number.isFinite(sek) || sek <= 0) {
    return { ok: false, error: 'Ungültige Zeit.' };
  }
  return { ok: true, value: sek };
}

/** Parst eine Distanzeingabe in der Einheit der Disziplin. */
export function parseDistanz(text: string, unit: Discipline['unit']): ParseResult {
  const t = text.trim().replace(',', '.');
  if (!t) return { ok: false, error: 'Bitte einen Wert eingeben.' };
  const wert = Number(t);
  if (!Number.isFinite(wert) || wert <= 0) {
    return { ok: false, error: 'Ungültiger Wert.' };
  }
  if (unit === 'Zentimeter' && !Number.isInteger(wert)) {
    return { ok: true, value: Math.round(wert) };
  }
  return { ok: true, value: wert };
}

/** Disziplinabhängiges Parsing einer Eingabe in einen numerischen Wert. */
export function parseEingabe(d: Discipline, text: string): ParseResult {
  if (istZeitDisziplin(d)) return parseZeit(text);
  return parseDistanz(text, d.unit);
}

/** Platzhaltertext für das Eingabefeld je Disziplin. */
export function eingabePlatzhalter(d: Discipline): string {
  if (istZeitDisziplin(d)) return 'z. B. 10,84 oder 4:05,30';
  if (d.unit === 'Zentimeter') return 'z. B. 205';
  return 'z. B. 7,85';
}

/** ISO-Datum (YYYY-MM-DD) → "25.06.2026". */
export function formatDatum(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

/** Date → ISO-Datum (YYYY-MM-DD) in lokaler Zeit. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
