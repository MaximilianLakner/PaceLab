/**
 * Disziplin-Detail.
 * Richtungsbewusste Leistungskurve über die Zeit (oben = besser),
 * PB-Markierung + Trendlinie, WA-Punkte und die Einzel-Sessions.
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChartPoint, LineChart } from '@/components/LineChart';
import { Body, Button, Card, EmptyState, Loading, Muted, PBBadge, SectionTitle } from '@/components/ui';
import { useData } from '@/data/DataContext';
import { besterVersuchWert, pbProDisziplin } from '@/logic/derived';
import { formatDatum, formatWert, formatWertKurz, istZeitDisziplin } from '@/logic/format';
import { berechnePunkte } from '@/logic/points';
import { Colors, FontSize, Radius, Spacing } from '@/theme/colors';

export default function DisziplinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, disciplineById, deleteSession } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const disc = disciplineById(id);

  // Sessions dieser Disziplin, chronologisch.
  const sessions = useMemo(
    () =>
      data.sessions
        .filter((s) => s.disciplineId === id)
        .sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : a.createdAt.localeCompare(b.createdAt))),
    [data.sessions, id],
  );

  const pb = useMemo(() => (disc ? pbProDisziplin(data).get(disc.id) : undefined), [data, disc]);

  // Ein Datenpunkt je Session = bester Versuch der Session.
  const punkte = useMemo<ChartPoint[]>(() => {
    if (!disc) return [];
    const out: ChartPoint[] = [];
    for (const s of sessions) {
      const attempts = data.attempts.filter((a) => a.sessionId === s.id);
      const best = besterVersuchWert(disc.direction, attempts);
      if (best === undefined) continue;
      out.push({
        t: Date.parse(s.datum + 'T12:00:00'),
        value: best,
        highlight: pb?.sessionId === s.id,
      });
    }
    return out;
  }, [sessions, data.attempts, disc, pb]);

  function onDelete(sessionId: string) {
    Alert.alert('Session löschen?', 'Diese Einheit und ihre Versuche werden entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteSession(sessionId) },
    ]);
  }

  if (loading) return <Loading />;
  if (!disc) {
    return <EmptyState title="Disziplin nicht gefunden" />;
  }

  const istZeit = istZeitDisziplin(disc);
  const aktuellePunkte = pb ? berechnePunkte(disc, pb.wert, undefined) : null;

  return (
    <>
      <Stack.Screen options={{ title: disc.name }} />
      <ScrollView
        style={{ backgroundColor: Colors.background }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {/* PB-Kopf */}
        <Card style={styles.pbCard}>
          <View style={styles.pbHeader}>
            <Muted>Persönliche Bestleistung</Muted>
            {pb && <PBBadge small />}
          </View>
          {pb ? (
            <>
              <Body style={styles.pbValue}>{formatWert(disc, pb.wert)}</Body>
              <Muted>
                {formatDatum(pb.datum)}
                {pb.punkte !== null ? `  ·  ${pb.punkte} WA-Punkte` : ''}
              </Muted>
            </>
          ) : (
            <Body style={{ marginTop: 4 }}>Noch keine Leistung erfasst.</Body>
          )}
          <Muted style={{ marginTop: 6 }}>
            {disc.category} · {disc.unit} ·{' '}
            {disc.direction === 'kleiner_ist_besser' ? 'kleiner ist besser' : 'größer ist besser'}
          </Muted>
        </Card>

        {/* Kurve */}
        <SectionTitle style={styles.section}>Verlauf</SectionTitle>
        {punkte.length === 0 ? (
          <EmptyState
            title="Noch keine Daten"
            hint="Erfasse Sessions in dieser Disziplin, um die Leistungskurve zu sehen."
          />
        ) : (
          <Card style={{ paddingHorizontal: Spacing.sm }}>
            <LineChart
              points={punkte}
              width={width - Spacing.md * 2 - Spacing.sm * 2}
              invertY={disc.direction === 'kleiner_ist_besser'}
              formatValue={(v) => formatWertKurz(disc, v)}
              formatDate={(t) => formatDatum(new Date(t).toISOString().slice(0, 10))}
              pbValue={pb?.wert}
              showTrend={punkte.length >= 2}
            />
            <Muted style={styles.chartHint}>
              {istZeit
                ? 'Y-Achse invertiert – oben = schneller (besser).'
                : 'Oben = weiter/höher (besser).'}
              {punkte.length >= 2 ? ' Gepunktet: Trend.' : ''}
            </Muted>
          </Card>
        )}

        {/* WA-Punkte-Info */}
        {disc.waParams && pb && aktuellePunkte !== null && (
          <Card style={styles.section}>
            <Muted>World-Athletics-Punkte (aus PB)</Muted>
            <Body style={styles.pbValue}>{aktuellePunkte} P</Body>
          </Card>
        )}

        {/* Aktion */}
        <Button
          title="＋ Neue Session in dieser Disziplin"
          onPress={() => router.push({ pathname: '/session/new', params: { disciplineId: disc.id } })}
          style={styles.section}
        />

        {/* Sessions */}
        <SectionTitle style={styles.section}>Einheiten ({sessions.length})</SectionTitle>
        <View style={{ gap: Spacing.sm }}>
          {[...sessions].reverse().map((s) => {
            const attempts = data.attempts.filter((a) => a.sessionId === s.id);
            const best = besterVersuchWert(disc.direction, attempts);
            const istPB = pb?.sessionId === s.id;
            const b = s.bedingungen;
            return (
              <View key={s.id} style={styles.sessionRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.sessionTop}>
                    <Body style={{ fontWeight: '700' }}>
                      {best !== undefined ? formatWert(disc, best) : '–'}
                    </Body>
                    {istPB && <PBBadge small />}
                  </View>
                  <Muted>
                    {formatDatum(s.datum)} · {attempts.length}{' '}
                    {attempts.length === 1 ? 'Versuch' : 'Versuche'}
                  </Muted>
                  {/* Versuchswerte */}
                  {attempts.length > 1 && (
                    <Muted style={{ marginTop: 2 }}>
                      {attempts
                        .slice()
                        .sort((x, y) => x.wiederholung - y.wiederholung)
                        .map((a) => formatWert(disc, a.wert))
                        .join('  ·  ')}
                    </Muted>
                  )}
                  {/* Bedingungen */}
                  {(b?.ort || typeof b?.windMs === 'number' || b?.zeitnahme) && (
                    <View style={styles.condRow}>
                      {b?.ort && (
                        <Muted style={styles.cond}>
                          <Ionicons name={b.ort === 'halle' ? 'home-outline' : 'sunny-outline'} size={12} />{' '}
                          {b.ort === 'halle' ? 'Halle' : 'Freiluft'}
                        </Muted>
                      )}
                      {typeof b?.windMs === 'number' && (
                        <Muted style={styles.cond}>
                          🚩 {b.windMs > 0 ? '+' : ''}
                          {b.windMs.toFixed(1)} m/s
                        </Muted>
                      )}
                      {b?.zeitnahme === 'hand' && <Muted style={styles.cond}>Handzeit</Muted>}
                    </View>
                  )}
                  {s.notiz ? <Muted style={{ fontStyle: 'italic', marginTop: 2 }}>{s.notiz}</Muted> : null}
                </View>
                <Pressable onPress={() => onDelete(s.id)} hitSlop={8} style={styles.trash}>
                  <Ionicons name="trash-outline" size={20} color={Colors.gray} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  section: {
    marginTop: Spacing.md,
  },
  pbCard: {
    backgroundColor: Colors.blush3,
    borderColor: '#D9A899',
  },
  pbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pbValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginTop: 2,
  },
  chartHint: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  condRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: 4,
  },
  cond: {
    fontSize: FontSize.xs,
  },
  trash: {
    padding: 4,
  },
});
