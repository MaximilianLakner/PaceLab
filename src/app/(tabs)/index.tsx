/**
 * Start / Heute.
 * Schnellzugriff "Neue Session", Streak-Status, aktuelle Form-Projektion und
 * die letzten Einheiten.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/SessionCard';
import { Body, Button, Card, EmptyState, Loading, Muted, SectionTitle } from '@/components/ui';
import { useData } from '@/data/DataContext';
import { berechneStreak, gesamtProjektion } from '@/logic/derived';
import { Colors, FontSize, Radius, Spacing } from '@/theme/colors';

export default function HeuteScreen() {
  const { data, loading } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const streak = useMemo(() => berechneStreak(data.sessions), [data.sessions]);
  const projektion = useMemo(() => gesamtProjektion(data), [data]);

  const letzteSessions = useMemo(
    () =>
      [...data.sessions]
        .sort((a, b) => (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : b.createdAt.localeCompare(a.createdAt)))
        .slice(0, 5),
    [data.sessions],
  );

  if (loading) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
      {/* Schnellzugriff */}
      <Button title="＋  Neue Session" onPress={() => router.push('/session/new')} />

      {/* Kennzahlen */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="flame-outline" size={18} color={Colors.text} />
            <Muted style={styles.statLabel}>Streak</Muted>
          </View>
          <Body style={styles.statValue}>
            {streak.wochen} {streak.wochen === 1 ? 'Woche' : 'Wochen'}
          </Body>
          <Muted>
            Diese Woche {streak.dieseWoche}/{streak.ziel} Tage
            {streak.dieseWocheGeschafft ? ' ✓' : ''}
          </Muted>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="trophy-outline" size={18} color={Colors.text} />
            <Muted style={styles.statLabel}>Projektion</Muted>
          </View>
          <Body style={styles.statValue}>{projektion.punkte} P</Body>
          <Muted>{projektion.abgedeckt}/10 Disziplinen</Muted>
        </Card>
      </View>

      {/* Letzte Einheiten */}
      <View style={styles.sectionHeader}>
        <SectionTitle>Letzte Einheiten</SectionTitle>
        {data.sessions.length > 0 && (
          <Body style={styles.link} onPress={() => router.push('/history')}>
            Alle
          </Body>
        )}
      </View>

      {letzteSessions.length === 0 ? (
        <EmptyState
          title="Noch keine Einheiten"
          hint="Erfasse deine erste Trainingseinheit und beginne, deinen Fortschritt zu verfolgen."
          action={<Button title="Erste Session anlegen" onPress={() => router.push('/session/new')} />}
        />
      ) : (
        <View style={styles.list}>
          {letzteSessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </View>
      )}

      {/* Disziplinen verwalten */}
      <Button
        title="Disziplinen verwalten"
        variant="secondary"
        onPress={() => router.push('/disciplines')}
        style={{ marginTop: Spacing.sm }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: FontSize.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  link: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  list: {
    gap: Spacing.sm,
  },
});
