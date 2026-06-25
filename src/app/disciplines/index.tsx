/**
 * Disziplinen verwalten.
 * Übersicht aller Standard- und eigenen Disziplinen; eigene können gelöscht
 * werden. Tippen öffnet das Disziplin-Detail.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, Button, Muted, SectionTitle } from '@/components/ui';
import { useData } from '@/data/DataContext';
import type { Discipline } from '@/data/types';
import { Colors, FontSize, Radius, Spacing } from '@/theme/colors';

export default function DisziplinenScreen() {
  const { data, deleteDiscipline } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const standard = data.disciplines.filter((d) => d.istStandard);
  const eigene = data.disciplines.filter((d) => !d.istStandard);

  function onDelete(d: Discipline) {
    const anzahl = data.sessions.filter((s) => s.disciplineId === d.id).length;
    Alert.alert(
      'Disziplin löschen?',
      anzahl > 0
        ? `"${d.name}" und ${anzahl} zugehörige ${anzahl === 1 ? 'Einheit' : 'Einheiten'} werden gelöscht.`
        : `"${d.name}" wird gelöscht.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => deleteDiscipline(d.id) },
      ],
    );
  }

  const Row = ({ d, loeschbar }: { d: Discipline; loeschbar?: boolean }) => (
    <Pressable
      onPress={() => router.push(`/discipline/${d.id}`)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Body style={{ fontWeight: '700' }}>{d.name}</Body>
          {d.waParams && (
            <View style={styles.waBadge}>
              <Body style={styles.waBadgeText}>WA</Body>
            </View>
          )}
        </View>
        <Muted>
          {d.category} · {d.unit} ·{' '}
          {d.direction === 'kleiner_ist_besser' ? 'kleiner ist besser' : 'größer ist besser'}
        </Muted>
      </View>
      {loeschbar ? (
        <Pressable onPress={() => onDelete(d)} hitSlop={8} style={styles.trash}>
          <Ionicons name="trash-outline" size={20} color={Colors.gray} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
      )}
    </Pressable>
  );

  return (
    <ScrollView
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
      <Button title="＋ Eigene Disziplin anlegen" onPress={() => router.push('/disciplines/new')} />

      {eigene.length > 0 && (
        <>
          <SectionTitle style={styles.section}>Eigene</SectionTitle>
          <View style={styles.list}>
            {eigene.map((d) => (
              <Row key={d.id} d={d} loeschbar />
            ))}
          </View>
        </>
      )}

      <SectionTitle style={styles.section}>Standard</SectionTitle>
      <Muted>Vorausgefüllt – die 10 Zehnkampf-Disziplinen tragen zur Gesamtwertung bei.</Muted>
      <View style={styles.list}>
        {standard.map((d) => (
          <Row key={d.id} d={d} />
        ))}
      </View>
    </ScrollView>
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
  list: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  waBadge: {
    backgroundColor: Colors.cardStrong,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  waBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text,
  },
  trash: {
    padding: 4,
  },
});
