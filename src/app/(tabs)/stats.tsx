/**
 * Statistiken.
 *  - Kombinierte Form-Kurve (WA-normiert) + hochgerechnete Gesamtpunktzahl
 *  - Regenerationsfreundlicher Streak
 *  - Trainingsaktivität (Heatmap + Wochenschnitt)
 *  - PB-Übersicht je Disziplin
 */

import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LineChart } from '@/components/LineChart';
import { Body, Card, EmptyState, Loading, Muted, SectionTitle } from '@/components/ui';
import { ZEHNKAMPF_REIHENFOLGE } from '@/data/standardDisciplines';
import { useData } from '@/data/DataContext';
import {
  berechneStreak,
  einheitenProWoche,
  formKurve,
  gesamtProjektion,
  montagDerWoche,
  pbProDisziplin,
  sessionsProTag,
} from '@/logic/derived';
import { formatDatum, formatWert } from '@/logic/format';
import { Colors, FontSize, Radius, Spacing } from '@/theme/colors';

const HEATMAP_WOCHEN = 16;
const HEAT_COLORS = ['#F2F2F2', '#E2D3D0', '#CDBEB7', '#E5C9BE']; // 0,1,2,3+

export default function StatistikScreen() {
  const { data, loading, disciplineById } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const streak = useMemo(() => berechneStreak(data.sessions), [data.sessions]);
  const projektion = useMemo(() => gesamtProjektion(data), [data]);
  const kurve = useMemo(() => formKurve(data), [data]);
  const pbs = useMemo(() => pbProDisziplin(data), [data]);
  const proTag = useMemo(() => sessionsProTag(data.sessions), [data.sessions]);
  const proWoche = useMemo(() => einheitenProWoche(data.sessions), [data.sessions]);

  // Heatmap-Spalten (letzte N Wochen, Montag-basiert).
  const heatmap = useMemo(() => {
    const heute = new Date();
    const startMontag = new Date(montagDerWoche(heute.toISOString().slice(0, 10)) + 'T00:00:00');
    startMontag.setDate(startMontag.getDate() - (HEATMAP_WOCHEN - 1) * 7);
    const wochen: { tage: { iso: string; count: number }[] }[] = [];
    for (let w = 0; w < HEATMAP_WOCHEN; w++) {
      const tage = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(startMontag);
        day.setDate(startMontag.getDate() + w * 7 + d);
        const iso = day.toISOString().slice(0, 10);
        tage.push({ iso, count: proTag.get(iso) ?? 0 });
      }
      wochen.push({ tage });
    }
    return wochen;
  }, [proTag]);

  const wochenSchnitt = useMemo(() => {
    if (proWoche.length === 0) return 0;
    const summe = proWoche.reduce((s, w) => s + w.anzahl, 0);
    return summe / proWoche.length;
  }, [proWoche]);

  if (loading) return <Loading />;

  if (data.sessions.length === 0) {
    return (
      <EmptyState
        title="Noch keine Statistik"
        hint="Erfasse Trainingseinheiten, dann erscheinen hier deine Form-Kurve, dein Streak und deine Bestleistungen."
      />
    );
  }

  const kurvenPunkte = kurve.map((p) => ({ t: Date.parse(p.datum + 'T12:00:00'), value: p.punkte }));
  const cellSize = Math.max(10, Math.floor((width - Spacing.md * 2 - Spacing.md * 2 - 6 * (HEATMAP_WOCHEN - 1)) / HEATMAP_WOCHEN));

  return (
    <ScrollView
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
      {/* Kombinierte Form-Kurve */}
      <SectionTitle>Gesamtform</SectionTitle>
      <Card>
        <Muted>Hochgerechnete Zehnkampf-Punktzahl (aus den jeweils besten Werten)</Muted>
        <Body style={styles.bigValue}>{projektion.punkte} Punkte</Body>
        <Muted>{projektion.abgedeckt}/10 Disziplinen erfasst</Muted>

        {kurvenPunkte.length >= 2 ? (
          <View style={{ marginTop: Spacing.md }}>
            <LineChart
              points={kurvenPunkte}
              width={width - Spacing.md * 2 - Spacing.md * 2}
              formatValue={(v) => String(Math.round(v))}
              formatDate={(t) => formatDatum(new Date(t).toISOString().slice(0, 10))}
              showTrend
              seriesColor={Colors.blush}
            />
            <Muted style={{ marginTop: Spacing.sm }}>
              Die Kurve steigt, wenn deine Gesamtform wächst – auch wenn einzelne Disziplinen mal
              schwanken.
            </Muted>
          </View>
        ) : (
          <Muted style={{ marginTop: Spacing.sm }}>
            Sobald du in mehreren Zehnkampf-Disziplinen Werte erfasst, entsteht hier die Form-Kurve.
          </Muted>
        )}
      </Card>

      {/* Streak */}
      <SectionTitle style={styles.section}>Streak</SectionTitle>
      <Card>
        <Body style={styles.bigValue}>
          {streak.wochen} {streak.wochen === 1 ? 'Woche' : 'Wochen'} in Folge
        </Body>
        <Muted>
          Diese Woche {streak.dieseWoche}/{streak.ziel} Trainingstage
          {streak.dieseWocheGeschafft ? ' – geschafft ✓' : ''}
        </Muted>
        <Muted style={{ marginTop: Spacing.sm }}>
          Gezählt werden Wochen mit mindestens {streak.ziel} Trainingstagen. Ruhetage brechen den
          Streak nicht – Regeneration gehört dazu.
        </Muted>
      </Card>

      {/* Aktivität / Heatmap */}
      <SectionTitle style={styles.section}>Aktivität</SectionTitle>
      <Card>
        <Muted>Ø {wochenSchnitt.toFixed(1)} Trainingstage / Woche</Muted>
        <View style={styles.heatmap}>
          {heatmap.map((w, wi) => (
            <View key={wi} style={styles.heatCol}>
              {w.tage.map((t, di) => (
                <View
                  key={di}
                  style={[
                    styles.heatCell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: HEAT_COLORS[Math.min(t.count, 3)],
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <Muted style={{ fontSize: 11 }}>weniger</Muted>
          {HEAT_COLORS.map((c, i) => (
            <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
          ))}
          <Muted style={{ fontSize: 11 }}>mehr</Muted>
        </View>
        <Muted style={{ marginTop: 4, fontSize: 11 }}>Letzte {HEATMAP_WOCHEN} Wochen</Muted>
      </Card>

      {/* PB-Übersicht */}
      <SectionTitle style={styles.section}>Bestleistungen</SectionTitle>
      <View style={styles.list}>
        {erfasstePBs(pbs).map(({ id }) => {
          const d = disciplineById(id);
          const pb = pbs.get(id);
          if (!d || !pb) return null;
          return (
            <Pressable
              key={id}
              onPress={() => router.push(`/discipline/${id}`)}
              style={({ pressed }) => [styles.pbRow, pressed && { opacity: 0.9 }]}>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '700' }}>{d.name}</Body>
                <Muted>
                  {formatDatum(pb.datum)}
                  {pb.punkte !== null ? `  ·  ${pb.punkte} P` : ''}
                </Muted>
              </View>
              <Body style={{ fontWeight: '800', fontSize: FontSize.lg }}>{formatWert(d, pb.wert)}</Body>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** PBs in sinnvoller Reihenfolge: erst Zehnkampf-Reihenfolge, dann der Rest. */
function erfasstePBs(pbs: Map<string, { wert: number }>): { id: string }[] {
  const ids = Array.from(pbs.keys());
  const zk = ZEHNKAMPF_REIHENFOLGE.filter((id) => pbs.has(id));
  const rest = ids.filter((id) => !ZEHNKAMPF_REIHENFOLGE.includes(id));
  return [...zk, ...rest].map((id) => ({ id }));
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  section: {
    marginTop: Spacing.md,
  },
  bigValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginVertical: 2,
  },
  heatmap: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.sm,
  },
  heatCol: {
    gap: 3,
  },
  heatCell: {
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  list: {
    gap: Spacing.sm,
  },
  pbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
});
