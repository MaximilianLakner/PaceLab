/**
 * Kern-Datenmodell von PaceLab.
 *
 * Wichtigste Designentscheidung: Es wird sauber zwischen einer
 * Trainingseinheit (Session) und der einzelnen Leistung (Attempt/Versuch)
 * getrennt. Eine Einheit kann mehrere Versuche enthalten
 * (z. B. Intervall "8×100 m" = 8 Versuche in einer Session).
 *
 * Abgeleitete Werte (PB, bester Versuch, World-Athletics-Punkte) werden NICHT
 * gespeichert, sondern bei Bedarf berechnet (siehe src/logic).
 */

/** Grobe Kategorie einer Disziplin. */
export type DisciplineCategory =
  | 'Sprint'
  | 'Lauf'
  | 'Ausdauer'
  | 'Sprung'
  | 'Wurf';

/** Maßeinheit, in der die Leistung erfasst wird. */
export type DisciplineUnit =
  | 'Sekunden'
  | 'Meter'
  | 'Zentimeter'
  | 'Punkte';

/**
 * Wertung der Richtung:
 *  - 'kleiner_ist_besser' → Läufe (weniger Zeit ist besser)
 *  - 'groesser_ist_besser' → Sprünge/Würfe (mehr Weite/Höhe ist besser)
 */
export type Direction = 'kleiner_ist_besser' | 'groesser_ist_besser';

/**
 * World-Athletics-Punkte-Parameter für die Normierung (Männer-Zehnkampf).
 * Formel siehe src/logic/points.ts.
 *  - Läufe:        Punkte = A · (B − P)^C   (P = Zeit in s)
 *  - Sprünge/Würfe: Punkte = A · (P − B)^C  (P = Leistung; Einheit s. unten)
 *
 * `pointsUnit` legt fest, in welcher Einheit P in die Formel eingeht
 * (Sprünge in cm, Würfe in m). Das ist unabhängig von der Erfassungseinheit
 * der Disziplin, wird aber bei den Standarddisziplinen konsistent gehalten.
 */
export interface WorldAthleticsParams {
  A: number;
  B: number;
  C: number;
  /** Typ der Formel. */
  type: 'lauf' | 'sprung' | 'wurf';
  /** Einheit, in der P in die Formel eingeht. */
  pointsUnit: 'Sekunden' | 'Meter' | 'Zentimeter';
}

/** Eine Disziplin (Standard oder selbst angelegt). */
export interface Discipline {
  id: string;
  name: string;
  category: DisciplineCategory;
  unit: DisciplineUnit;
  direction: Direction;
  /** true = vorausgefüllt, false = vom Nutzer angelegt. */
  istStandard: boolean;
  /** WA-Punkte-Parameter; nur für die 10 Zehnkampf-Disziplinen verbindlich. */
  waParams?: WorldAthleticsParams;
  /** Markiert die offiziellen 10 Zehnkampf-Disziplinen für die Gesamtwertung. */
  istZehnkampf?: boolean;
}

/** Zeitnahme-Art – relevant für die Handzeit-Korrektur bei kurzen Läufen. */
export type Zeitnahme = 'elektronisch' | 'hand';

/** Ort der Einheit. */
export type Ort = 'halle' | 'freiluft';

/** Bedingungen einer Trainingseinheit (alle optional). */
export interface Bedingungen {
  ort?: Ort;
  /** Wind in m/s (positiv = Rückenwind), nur sinnvoll im Freien. */
  windMs?: number;
  zeitnahme?: Zeitnahme;
}

/** Eine Trainingseinheit. */
export interface Session {
  id: string;
  /** ISO-Datum (YYYY-MM-DD). */
  datum: string;
  disciplineId: string;
  /** Dauer der EINHEIT in Minuten – NICHT die Leistung. Optional. */
  gesamtdauerMinuten?: number;
  bedingungen?: Bedingungen;
  notiz?: string;
  /** Erstellungszeitpunkt (ISO) zur stabilen Sortierung. */
  createdAt: string;
}

/** Ein einzelner Versuch innerhalb einer Session. */
export interface Attempt {
  id: string;
  sessionId: string;
  /** Wert in der Einheit der Disziplin (s, m oder cm). */
  wert: number;
  /** Laufende Versuchsnummer innerhalb der Session (1, 2, 3 …). */
  wiederholung: number;
}

/** Gesamter persistierter Zustand der App. */
export interface PaceLabData {
  /** Schema-Version für spätere Migrationen. */
  version: number;
  disciplines: Discipline[];
  sessions: Session[];
  attempts: Attempt[];
}
