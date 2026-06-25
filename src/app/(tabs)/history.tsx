/**
 * Verlauf.
 * Liste aller Sessions mit Filter nach Disziplin und Zeitraum.
 */

import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/SessionCard';
import { Button, Chip, EmptyState, Loading, Muted } from '@/components/ui';
import { useData } from '@/data/DataContext';
import { Colors, Spacing } from '@/theme/colors';

type Zeitraum = 'alle' | '30' | '90' | '365';

const ZEITRAEUME: { key: Zeitraum; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: '30', label: '30 Tage' },
  { key: '90', label: '90 Tage' },
  { key: '365', label: '1 Jahr' },
];

export default function VerlaufScreen() {
  const { data, loading } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [discFilter, setDiscFilter] = useState<string | 'alle'>('alle');
  const [zeitraum, setZeitraum] = useState<Zeitraum>('alle');

  // Nur Disziplinen, zu denen es Sessions gibt, als Filter anbieten.
  const benutzteDisziplinen = useMemo(() => {
    const ids = new Set(data.sessions.map((s) => s.disciplineId));
    return data.disciplines.filter((d) => ids.has(d.id));
  }, [data.sessions, data.disciplines]);

  const gefiltert = useMemo(() => {
    let list = [...data.sessions];
    if (discFilter !== 'alle') list = list.filter((s) => s.disciplineId === discFilter);
    if (zeitraum !== 'alle') {
      const tage = Number(zeitraum);
      const grenze = new Date();
      grenze.setDate(grenze.getDate() - tage);
      const grenzeISO = grenze.toISOString().slice(0, 10);
      list = list.filter((s) => s.datum >= grenzeISO);
    }
    return list.sort((a, b) =>
      a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : b.createdAt.localeCompare(a.createdAt),
    );
  }, [data.sessions, discFilter, zeitraum]);

  if (loading) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
      {data.sessions.length === 0 ? (
        <EmptyState
          title="Noch keine Einheiten"
          hint="Sobald du Sessions erfasst, erscheinen sie hier – filterbar nach Disziplin und Zeitraum."
          action={<Button title="Neue Session" onPress={() => router.push('/session/new')} />}
        />
      ) : (
        <>
          {/* Disziplin-Filter */}
          <Muted style={styles.filterLabel}>Disziplin</Muted>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <Chip label="Alle" selected={discFilter === 'alle'} onPress={() => setDiscFilter('alle')} />
            {benutzteDisziplinen.map((d) => (
              <Chip
                key={d.id}
                label={d.name}
                selected={discFilter === d.id}
                onPress={() => setDiscFilter(d.id)}
              />
            ))}
          </ScrollView>

          {/* Zeitraum-Filter */}
          <Muted style={styles.filterLabel}>Zeitraum</Muted>
          <View style={styles.filterRow}>
            {ZEITRAEUME.map((z) => (
              <Chip
                key={z.key}
                label={z.label}
                selected={zeitraum === z.key}
                onPress={() => setZeitraum(z.key)}
              />
            ))}
          </View>

          {/* Ergebnisliste */}
          <Muted style={styles.count}>
            {gefiltert.length} {gefiltert.length === 1 ? 'Einheit' : 'Einheiten'}
          </Muted>
          {gefiltert.length === 0 ? (
            <Muted style={{ textAlign: 'center', marginTop: Spacing.lg }}>
              Keine Einheiten im gewählten Filter.
            </Muted>
          ) : (
            <View style={styles.list}>
              {gefiltert.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterLabel: {
    marginTop: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  count: {
    marginTop: Spacing.sm,
  },
  list: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
