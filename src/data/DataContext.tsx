/**
 * Zentraler Daten-Context.
 *
 * Hält den gesamten App-Zustand im Speicher (reaktiv) und schreibt jede
 * Mutation per Write-Through nach AsyncStorage. Alle abgeleiteten Werte
 * (PB, Punkte, Streak …) werden in den Screens aus diesem Zustand berechnet.
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  ladeDaten,
  leererStand,
  loescheAlles,
  speichereDaten,
} from './storage';
import type {
  Attempt,
  Bedingungen,
  Discipline,
  PaceLabData,
  Session,
} from './types';
import { istNeuerPB, pbProDisziplin } from '@/logic/derived';

/** Einfache eindeutige ID (lokal ausreichend). */
function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Eingabe für eine neue Session inkl. ihrer Versuche. */
export interface NeueSessionInput {
  datum: string;
  disciplineId: string;
  werte: number[];
  gesamtdauerMinuten?: number;
  bedingungen?: Bedingungen;
  notiz?: string;
}

export interface SaveSessionResult {
  session: Session;
  /** War der beste Versuch der Session ein neuer PB für die Disziplin? */
  neuerPB: boolean;
  /** Bester Versuchswert der Session. */
  besterWert: number;
}

/** Eingabe für eine eigene Disziplin. */
export type NeueDisziplinInput = Omit<Discipline, 'id' | 'istStandard'>;

interface DataContextValue {
  data: PaceLabData;
  loading: boolean;
  disciplineById: (id: string) => Discipline | undefined;
  addSession: (input: NeueSessionInput) => Promise<SaveSessionResult>;
  deleteSession: (sessionId: string) => Promise<void>;
  addDiscipline: (input: NeueDisziplinInput) => Promise<Discipline>;
  updateDiscipline: (id: string, patch: Partial<NeueDisziplinInput>) => Promise<void>;
  deleteDiscipline: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PaceLabData>(() => leererStand());
  const [loading, setLoading] = useState(true);
  // Referenz auf den jeweils aktuellsten Stand für Mutationen.
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let aktiv = true;
    ladeDaten().then((geladen) => {
      if (!aktiv) return;
      setData(geladen);
      setLoading(false);
    });
    return () => {
      aktiv = false;
    };
  }, []);

  /** Aktualisiert Zustand und persistiert. */
  async function commit(next: PaceLabData): Promise<void> {
    setData(next);
    dataRef.current = next;
    await speichereDaten(next);
  }

  const value = useMemo<DataContextValue>(() => {
    return {
      data,
      loading,

      disciplineById: (id) => dataRef.current.disciplines.find((d) => d.id === id),

      addSession: async (input) => {
        const aktuell = dataRef.current;
        const disc = aktuell.disciplines.find((d) => d.id === input.disciplineId);
        if (!disc) throw new Error('Unbekannte Disziplin');

        // Bisherigen PB ermitteln, BEVOR die neue Session eingefügt wird.
        const pbVorher = pbProDisziplin(aktuell).get(disc.id)?.wert;

        const session: Session = {
          id: makeId('s'),
          datum: input.datum,
          disciplineId: input.disciplineId,
          gesamtdauerMinuten: input.gesamtdauerMinuten,
          bedingungen: input.bedingungen,
          notiz: input.notiz,
          createdAt: new Date().toISOString(),
        };

        const attempts: Attempt[] = input.werte.map((wert, i) => ({
          id: makeId('a'),
          sessionId: session.id,
          wert,
          wiederholung: i + 1,
        }));

        // Bester Versuch dieser Session bestimmen.
        const besterWert = input.werte.reduce((best, w) =>
          disc.direction === 'kleiner_ist_besser' ? Math.min(best, w) : Math.max(best, w),
          input.werte[0],
        );
        const neuerPB = istNeuerPB(disc.direction, besterWert, pbVorher);

        await commit({
          ...aktuell,
          sessions: [...aktuell.sessions, session],
          attempts: [...aktuell.attempts, ...attempts],
        });

        return { session, neuerPB, besterWert };
      },

      deleteSession: async (sessionId) => {
        const aktuell = dataRef.current;
        await commit({
          ...aktuell,
          sessions: aktuell.sessions.filter((s) => s.id !== sessionId),
          attempts: aktuell.attempts.filter((a) => a.sessionId !== sessionId),
        });
      },

      addDiscipline: async (input) => {
        const aktuell = dataRef.current;
        const disc: Discipline = { ...input, id: makeId('d'), istStandard: false };
        await commit({ ...aktuell, disciplines: [...aktuell.disciplines, disc] });
        return disc;
      },

      updateDiscipline: async (id, patch) => {
        const aktuell = dataRef.current;
        await commit({
          ...aktuell,
          disciplines: aktuell.disciplines.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        });
      },

      deleteDiscipline: async (id) => {
        const aktuell = dataRef.current;
        const disc = aktuell.disciplines.find((d) => d.id === id);
        if (!disc || disc.istStandard) {
          throw new Error('Standard-Disziplinen können nicht gelöscht werden.');
        }
        // Zugehörige Sessions + Versuche mitlöschen (Kaskade).
        const sessionIds = new Set(
          aktuell.sessions.filter((s) => s.disciplineId === id).map((s) => s.id),
        );
        await commit({
          ...aktuell,
          disciplines: aktuell.disciplines.filter((d) => d.id !== id),
          sessions: aktuell.sessions.filter((s) => s.disciplineId !== id),
          attempts: aktuell.attempts.filter((a) => !sessionIds.has(a.sessionId)),
        });
      },

      resetAll: async () => {
        await loescheAlles();
        const init = leererStand();
        await commit(init);
      },
    };
  }, [data, loading]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/** Zugriff auf den Daten-Context. */
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData muss innerhalb von <DataProvider> verwendet werden.');
  return ctx;
}
