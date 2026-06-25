/**
 * Abgeleitete Berechnungen (nichts davon wird gespeichert):
 *  - Persönliche Bestleistung (PB) je Disziplin (richtungsbewusst)
 *  - Bester Versuch je Session
 *  - World-Athletics-Gesamtprojektion (Summe der PB-Punkte)
 *  - Kombinierte Form-Kurve (PB-Projektion über die Zeit)
 *  - Regenerationsfreundlicher Streak (wochenbasiert, Ruhetage erlaubt)
 *  - Trainingsaktivität (pro Tag/Woche)
 */

import type {
  Attempt,
  Direction,
  Discipline,
  PaceLabData,
  Session,
} from '@/data/types';
import { ZEHNKAMPF_REIHENFOLGE } from '@/data/standardDisciplines';
import { berechnePunkte } from './points';

/** Ist Wert a besser als b unter Beachtung der Richtung? */
export function istBesser(direction: Direction, a: number, b: number): boolean {
  return direction === 'kleiner_ist_besser' ? a < b : a > b;
}

/** Bester Wert aus einer Liste unter Beachtung der Richtung. */
export function besterAusWerten(direction: Direction, werte: number[]): number | undefined {
  if (werte.length === 0) return undefined;
  return werte.reduce((best, w) => (istBesser(direction, w, best) ? w : best), werte[0]);
}

/** Gruppiert Versuche nach Session-ID. */
export function attemptsBySession(attempts: Attempt[]): Map<string, Attempt[]> {
  const m = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const list = m.get(a.sessionId);
    if (list) list.push(a);
    else m.set(a.sessionId, [a]);
  }
  return m;
}

/** Bester Versuchswert einer Session. */
export function besterVersuchWert(
  direction: Direction,
  attempts: Attempt[],
): number | undefined {
  return besterAusWerten(direction, attempts.map((a) => a.wert));
}

export interface PBInfo {
  wert: number;
  datum: string;
  sessionId: string;
  /** WA-Punkte für diesen PB (falls Disziplin wertbar). */
  punkte: number | null;
}

/**
 * Persönliche Bestleistung je Disziplin über alle Sessions/Versuche.
 * Liefert eine Map disciplineId → PBInfo.
 */
export function pbProDisziplin(data: PaceLabData): Map<string, PBInfo> {
  const result = new Map<string, PBInfo>();
  const sessionsById = new Map(data.sessions.map((s) => [s.id, s]));
  const discById = new Map(data.disciplines.map((d) => [d.id, d]));

  for (const a of data.attempts) {
    const session = sessionsById.get(a.sessionId);
    if (!session) continue;
    const disc = discById.get(session.disciplineId);
    if (!disc) continue;

    const current = result.get(disc.id);
    if (!current || istBesser(disc.direction, a.wert, current.wert)) {
      result.set(disc.id, {
        wert: a.wert,
        datum: session.datum,
        sessionId: session.id,
        punkte: berechnePunkte(disc, a.wert, session.bedingungen?.zeitnahme),
      });
    }
  }
  return result;
}

/**
 * Prüft, ob ein neuer Wert ein neuer PB gegenüber dem bisherigen Bestwert ist.
 * @param bisherigerPB undefined = es gab noch keinen Wert → automatisch PB.
 */
export function istNeuerPB(
  direction: Direction,
  neuerWert: number,
  bisherigerPB: number | undefined,
): boolean {
  if (bisherigerPB === undefined) return true;
  return istBesser(direction, neuerWert, bisherigerPB);
}

export interface GesamtProjektion {
  /** Summe der PB-Punkte über die 10 Zehnkampf-Disziplinen. */
  punkte: number;
  /** Wie viele der 10 Disziplinen haben bereits Daten. */
  abgedeckt: number;
  /** Punkte je Zehnkampf-Disziplin (id → Punkte, 0 wenn keine Daten). */
  jeDisziplin: { disciplineId: string; punkte: number; hatDaten: boolean }[];
}

/**
 * Hochgerechnete Zehnkampf-Gesamtpunktzahl aus dem jeweils besten Wert.
 */
export function gesamtProjektion(data: PaceLabData): GesamtProjektion {
  const pbs = pbProDisziplin(data);
  let summe = 0;
  let abgedeckt = 0;
  const jeDisziplin = ZEHNKAMPF_REIHENFOLGE.map((id) => {
    const pb = pbs.get(id);
    const punkte = pb?.punkte ?? 0;
    const hatDaten = !!pb;
    if (hatDaten) abgedeckt++;
    summe += punkte;
    return { disciplineId: id, punkte, hatDaten };
  });
  return { punkte: summe, abgedeckt, jeDisziplin };
}

export interface FormPunkt {
  datum: string;
  punkte: number;
}

/**
 * Kombinierte Form-Kurve: Für jeden Tag, an dem trainiert wurde, die
 * hochgerechnete Zehnkampf-Gesamtpunktzahl aus dem jeweils besten Wert
 * BIS ZU DIESEM TAG (kumulativer Bestwert je Disziplin).
 *
 * Bewusst kumulativ: Ein schwächerer Einzelversuch senkt die Gesamtform nicht –
 * das passt zur regenerationsfreundlichen Philosophie. Die Kurve zeigt, ob die
 * Gesamtform über die Zeit steigt, auch wenn einzelne Disziplinen schwanken.
 */
export function formKurve(data: PaceLabData): FormPunkt[] {
  const sessionsById = new Map(data.sessions.map((s) => [s.id, s]));
  const discById = new Map(data.disciplines.map((d) => [d.id, d]));

  // Alle Versuche mit Datum + Disziplin sammeln, nach Datum sortieren.
  type Eintrag = { datum: string; disc: Discipline; wert: number; zeitnahme?: 'elektronisch' | 'hand' };
  const eintraege: Eintrag[] = [];
  for (const a of data.attempts) {
    const session = sessionsById.get(a.sessionId);
    if (!session) continue;
    const disc = discById.get(session.disciplineId);
    if (!disc || !disc.istZehnkampf) continue; // nur die 10 offiziellen
    eintraege.push({
      datum: session.datum,
      disc,
      wert: a.wert,
      zeitnahme: session.bedingungen?.zeitnahme,
    });
  }
  eintraege.sort((x, y) => x.datum.localeCompare(y.datum));

  const besteJeDisziplin = new Map<string, number>(); // id → Punkte
  const kurve: FormPunkt[] = [];
  let lastDatum = '';

  for (let i = 0; i < eintraege.length; i++) {
    const e = eintraege[i];
    const punkte = berechnePunkte(e.disc, e.wert, e.zeitnahme) ?? 0;
    const aktuell = besteJeDisziplin.get(e.disc.id);
    if (aktuell === undefined || punkte > aktuell) {
      besteJeDisziplin.set(e.disc.id, punkte);
    }
    // Nur einen Punkt pro Datum ausgeben (den letzten Stand des Tages).
    const summe = Array.from(besteJeDisziplin.values()).reduce((s, v) => s + v, 0);
    if (e.datum === lastDatum && kurve.length > 0) {
      kurve[kurve.length - 1].punkte = summe;
    } else {
      kurve.push({ datum: e.datum, punkte: summe });
      lastDatum = e.datum;
    }
  }
  return kurve;
}

// ---------------------------------------------------------------------------
// Wochen-Helfer (Montag als Wochenstart)
// ---------------------------------------------------------------------------

/** Montag der Woche eines ISO-Datums, als ISO-Datum. */
export function montagDerWoche(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const day = (d.getDay() + 6) % 7; // Mo=0 … So=6
  d.setDate(d.getDate() - day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export interface StreakInfo {
  /** Anzahl aufeinanderfolgender Wochen, in denen das Wochenziel erreicht wurde. */
  wochen: number;
  /** Wochenziel (Einheiten pro Woche). */
  ziel: number;
  /** Trainingstage in der aktuellen (laufenden) Woche. */
  dieseWoche: number;
  /** Ist die aktuelle Woche bereits geschafft? */
  dieseWocheGeschafft: boolean;
}

/**
 * Regenerationsfreundlicher Streak.
 *
 * Gezählt werden WOCHEN, in denen mindestens `ziel` Trainingstage erreicht
 * wurden – NICHT einzelne Tage. Ein Ruhetag bricht den Streak also nie.
 * Die laufende Woche bricht den Streak nicht, solange das Ziel noch erreichbar
 * ist; ist es bereits erreicht, zählt sie mit.
 */
export function berechneStreak(sessions: Session[], ziel = 3, heute = new Date()): StreakInfo {
  // Trainingstage je Woche (Set aus Datum, damit mehrere Sessions/Tag = 1 Tag).
  const tageJeWoche = new Map<string, Set<string>>();
  for (const s of sessions) {
    const woche = montagDerWoche(s.datum);
    const set = tageJeWoche.get(woche) ?? new Set<string>();
    set.add(s.datum);
    tageJeWoche.set(woche, set);
  }

  const heuteISO = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(
    heute.getDate(),
  ).padStart(2, '0')}`;
  const aktuelleWoche = montagDerWoche(heuteISO);

  const dieseWoche = tageJeWoche.get(aktuelleWoche)?.size ?? 0;
  const dieseWocheGeschafft = dieseWoche >= ziel;

  let wochen = 0;
  // Startpunkt: aktuelle Woche, wenn geschafft – sonst eine Woche zurück
  // (laufende, noch nicht erreichte Woche bricht den Streak nicht).
  const start = new Date(aktuelleWoche + 'T00:00:00');
  if (!dieseWocheGeschafft) start.setDate(start.getDate() - 7);

  const cursor = new Date(start);
  // Maximal 520 Wochen zurück (10 Jahre) – Sicherheitsgrenze.
  for (let i = 0; i < 520; i++) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const dd = String(cursor.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${dd}`;
    const anzahl = tageJeWoche.get(key)?.size ?? 0;
    if (anzahl >= ziel) {
      wochen++;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      break;
    }
  }

  return { wochen, ziel, dieseWoche, dieseWocheGeschafft };
}

/** Anzahl Trainingstage (eindeutige Daten) je Kalenderwoche, sortiert. */
export function einheitenProWoche(sessions: Session[]): { woche: string; anzahl: number }[] {
  const m = new Map<string, Set<string>>();
  for (const s of sessions) {
    const w = montagDerWoche(s.datum);
    const set = m.get(w) ?? new Set<string>();
    set.add(s.datum);
    m.set(w, set);
  }
  return Array.from(m.entries())
    .map(([woche, set]) => ({ woche, anzahl: set.size }))
    .sort((a, b) => a.woche.localeCompare(b.woche));
}

/** Anzahl Sessions je Tag (für Heatmap/Kalender). */
export function sessionsProTag(sessions: Session[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sessions) {
    m.set(s.datum, (m.get(s.datum) ?? 0) + 1);
  }
  return m;
}
