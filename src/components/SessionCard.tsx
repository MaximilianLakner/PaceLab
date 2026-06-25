/**
 * Kompakte Karten-Darstellung einer Trainingseinheit.
 * Zeigt Disziplin, Datum, besten Versuch, Versuchszahl, Bedingungen und – falls
 * der beste Versuch der Session den aktuellen PB hält – ein PB-Badge.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useData } from '@/data/DataContext';
import type { Session } from '@/data/types';
import { besterVersuchWert, pbProDisziplin } from '@/logic/derived';
import { formatDatum, formatWert } from '@/logic/format';
import { Colors, FontSize, Radius, Spacing } from '@/theme/colors';
import { Body, Muted, PBBadge } from './ui';

export function SessionCard({ session }: { session: Session }) {
  const { data, disciplineById } = useData();
  const router = useRouter();
  const disc = disciplineById(session.disciplineId);
  if (!disc) return null;

  const attempts = data.attempts.filter((a) => a.sessionId === session.id);
  const best = besterVersuchWert(disc.direction, attempts);
  const pb = pbProDisziplin(data).get(disc.id);
  const istPB = pb?.sessionId === session.id;

  const b = session.bedingungen;

  return (
    <Pressable
      onPress={() => router.push(`/discipline/${disc.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.headerRow}>
        <Body style={styles.name}>{disc.name}</Body>
        {istPB && <PBBadge small />}
      </View>

      <View style={styles.row}>
        <Muted>{formatDatum(session.datum)}</Muted>
        {best !== undefined && (
          <Body style={styles.value}>{formatWert(disc, best)}</Body>
        )}
      </View>

      <View style={styles.metaRow}>
        <Muted>
          {attempts.length} {attempts.length === 1 ? 'Versuch' : 'Versuche'}
        </Muted>
        {b?.ort && (
          <View style={styles.metaItem}>
            <Ionicons
              name={b.ort === 'halle' ? 'home-outline' : 'sunny-outline'}
              size={13}
              color={Colors.textMuted}
            />
            <Muted style={styles.metaText}>{b.ort === 'halle' ? 'Halle' : 'Freiluft'}</Muted>
          </View>
        )}
        {typeof b?.windMs === 'number' && (
          <View style={styles.metaItem}>
            <Ionicons name="flag-outline" size={13} color={Colors.textMuted} />
            <Muted style={styles.metaText}>
              {b.windMs > 0 ? '+' : ''}
              {b.windMs.toFixed(1)} m/s
            </Muted>
          </View>
        )}
        {b?.zeitnahme === 'hand' && (
          <View style={styles.metaItem}>
            <Ionicons name="hand-left-outline" size={13} color={Colors.textMuted} />
            <Muted style={styles.metaText}>Hand</Muted>
          </View>
        )}
      </View>

      {session.notiz ? <Muted style={styles.notiz}>{session.notiz}</Muted> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
  },
  notiz: {
    fontStyle: 'italic',
  },
});
