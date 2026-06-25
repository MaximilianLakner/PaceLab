/**
 * Lokale, offline-first Persistenz über AsyncStorage.
 *
 * Begründung der Wahl (auch in PROJECT.md dokumentiert):
 *  - Der Datenbestand eines einzelnen Athleten ist klein und passt problemlos
 *    in den Arbeitsspeicher.
 *  - Ein einziger JSON-Blob erlaubt vollständige Reaktivität über React-State
 *    (alles im Context, Schreiben = State-Update + Persist), ohne den Overhead
 *    von SQL-Queries und Migrationsskripten.
 *  - Kein Login, keine Cloud – AsyncStorage genügt vollständig.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { STANDARD_DISCIPLINES } from './standardDisciplines';
import type { PaceLabData } from './types';

const STORAGE_KEY = 'pacelab:data:v1';
const SCHEMA_VERSION = 1;

/** Leerer Anfangszustand mit eingesäten Standard-Disziplinen. */
export function leererStand(): PaceLabData {
  return {
    version: SCHEMA_VERSION,
    // Kopie, damit der Konstanten-Export nicht mutiert wird.
    disciplines: STANDARD_DISCIPLINES.map((d) => ({ ...d })),
    sessions: [],
    attempts: [],
  };
}

/**
 * Lädt den Zustand. Beim allerersten Start (kein Eintrag) werden die
 * Standard-Disziplinen eingesät und gespeichert.
 */
export async function ladeDaten(): Promise<PaceLabData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = leererStand();
      await speichereDaten(init);
      return init;
    }
    const parsed = JSON.parse(raw) as PaceLabData;
    return migriere(parsed);
  } catch (e) {
    console.warn('[PaceLab] Laden fehlgeschlagen, starte mit leerem Stand.', e);
    return leererStand();
  }
}

/** Persistiert den kompletten Zustand. */
export async function speichereDaten(data: PaceLabData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Stellt sicher, dass neu hinzugekommene Standard-Disziplinen auch bei
 * bestehenden Installationen ergänzt werden (idempotent über die feste id).
 */
function migriere(data: PaceLabData): PaceLabData {
  const vorhandeneIds = new Set(data.disciplines.map((d) => d.id));
  const fehlende = STANDARD_DISCIPLINES.filter((d) => !vorhandeneIds.has(d.id)).map((d) => ({ ...d }));
  return {
    version: SCHEMA_VERSION,
    disciplines: [...data.disciplines, ...fehlende],
    sessions: data.sessions ?? [],
    attempts: data.attempts ?? [],
  };
}

/** Setzt alle Daten zurück (für Debug / Einstellungen). */
export async function loescheAlles(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
