/**
 * Neue Session.
 * Disziplin wählen → passende Eingabemaske, ein oder mehrere Versuche,
 * optional Datum/Dauer/Bedingungen/Notiz. Beim Speichern PB-Rückmeldung.
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, Button, Card, Chip, Muted, SectionTitle } from '@/components/ui';
import { useData } from '@/data/DataContext';
import type { Bedingungen, Ort, Zeitnahme } from '@/data/types';
import { eingabePlatzhalter, formatDatum, istZeitDisziplin, parseEingabe, toISODate } from '@/logic/format';
import { Colors, FontSize, Radius, Spacing } from '@/theme/colors';

export default function NeueSessionScreen() {
  const { data, addSession } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ disciplineId?: string }>();

  const [disciplineId, setDisciplineId] = useState<string | undefined>(params.disciplineId);
  const [datum, setDatum] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [werte, setWerte] = useState<string[]>(['']);
  const [dauer, setDauer] = useState('');
  const [ort, setOrt] = useState<Ort | undefined>(undefined);
  const [wind, setWind] = useState('');
  const [zeitnahme, setZeitnahme] = useState<Zeitnahme | undefined>(undefined);
  const [notiz, setNotiz] = useState('');
  const [speichern, setSpeichern] = useState(false);

  const disc = useMemo(
    () => data.disciplines.find((d) => d.id === disciplineId),
    [data.disciplines, disciplineId],
  );

  const istZeit = disc ? istZeitDisziplin(disc) : false;
  // Handzeit-Korrektur ist nur bei kurzen Läufen mit WA-Wertung relevant.
  const zeigeZeitnahme = istZeit;

  function setWert(i: number, v: string) {
    setWerte((prev) => prev.map((w, idx) => (idx === i ? v : w)));
  }
  function addWert() {
    setWerte((prev) => [...prev, '']);
  }
  function removeWert(i: number) {
    setWerte((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function onSpeichern() {
    if (!disc) {
      Alert.alert('Disziplin fehlt', 'Bitte zuerst eine Disziplin wählen.');
      return;
    }

    // Versuche parsen + validieren.
    const parsed: number[] = [];
    for (const raw of werte) {
      if (!raw.trim()) continue;
      const r = parseEingabe(disc, raw);
      if (!r.ok || r.value === undefined) {
        Alert.alert('Ungültiger Versuch', `"${raw}": ${r.error ?? 'Eingabe prüfen.'}`);
        return;
      }
      parsed.push(r.value);
    }
    if (parsed.length === 0) {
      Alert.alert('Kein Versuch', 'Bitte mindestens einen gültigen Versuch eingeben.');
      return;
    }

    const dauerMin = dauer.trim() ? Number(dauer.replace(',', '.')) : undefined;
    if (dauerMin !== undefined && (!Number.isFinite(dauerMin) || dauerMin < 0)) {
      Alert.alert('Ungültige Dauer', 'Die Gesamtdauer muss eine Zahl in Minuten sein.');
      return;
    }

    const windMs = wind.trim() ? Number(wind.replace(',', '.')) : undefined;
    if (windMs !== undefined && !Number.isFinite(windMs)) {
      Alert.alert('Ungültiger Wind', 'Wind bitte als Zahl in m/s angeben (z. B. -1,2).');
      return;
    }

    const bedingungen: Bedingungen | undefined =
      ort || windMs !== undefined || zeitnahme
        ? { ort, windMs: ort === 'freiluft' ? windMs : undefined, zeitnahme }
        : undefined;

    setSpeichern(true);
    try {
      const res = await addSession({
        datum: toISODate(datum),
        disciplineId: disc.id,
        werte: parsed,
        gesamtdauerMinuten: dauerMin,
        bedingungen,
        notiz: notiz.trim() || undefined,
      });

      if (res.neuerPB) {
        Alert.alert('🎉 Neuer PB!', `Neue Bestleistung in ${disc.name} gespeichert.`, [
          { text: 'Super', onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    } finally {
      setSpeichern(false);
    }
  }

  // Disziplinen nach Standard/eigene gruppieren.
  const standard = data.disciplines.filter((d) => d.istStandard);
  const eigene = data.disciplines.filter((d) => !d.istStandard);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        {/* Disziplin */}
        <SectionTitle>Disziplin</SectionTitle>
        <View style={styles.chipWrap}>
          {standard.map((d) => (
            <Chip
              key={d.id}
              label={d.name}
              selected={d.id === disciplineId}
              onPress={() => setDisciplineId(d.id)}
            />
          ))}
        </View>
        {eigene.length > 0 && (
          <>
            <Muted style={{ marginTop: 4 }}>Eigene</Muted>
            <View style={styles.chipWrap}>
              {eigene.map((d) => (
                <Chip
                  key={d.id}
                  label={d.name}
                  selected={d.id === disciplineId}
                  onPress={() => setDisciplineId(d.id)}
                />
              ))}
            </View>
          </>
        )}

        {disc && (
          <>
            {/* Datum */}
            <SectionTitle style={styles.section}>Datum</SectionTitle>
            <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Body>{formatDatum(toISODate(datum))}</Body>
              <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={datum}
                mode="date"
                maximumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, d) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (d) setDatum(d);
                }}
              />
            )}

            {/* Versuche */}
            <SectionTitle style={styles.section}>
              Versuche {istZeit ? '(Zeit)' : disc.unit === 'Zentimeter' ? '(cm)' : '(m)'}
            </SectionTitle>
            <Muted>{eingabePlatzhalter(disc)}</Muted>
            <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
              {werte.map((w, i) => (
                <View key={i} style={styles.attemptRow}>
                  <View style={styles.attemptIndex}>
                    <Body style={{ fontWeight: '700' }}>{i + 1}</Body>
                  </View>
                  <TextInput
                    style={[styles.input, styles.attemptInput]}
                    value={w}
                    onChangeText={(t) => setWert(i, t)}
                    placeholder={eingabePlatzhalter(disc)}
                    placeholderTextColor={Colors.gray}
                    keyboardType={istZeit ? 'numbers-and-punctuation' : 'decimal-pad'}
                    inputMode={istZeit ? 'text' : 'decimal'}
                  />
                  {werte.length > 1 && (
                    <Pressable onPress={() => removeWert(i)} hitSlop={8} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={24} color={Colors.gray} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
            <Button title="＋ Versuch" variant="ghost" onPress={addWert} style={{ alignSelf: 'flex-start' }} />

            {/* Bedingungen */}
            <SectionTitle style={styles.section}>Bedingungen (optional)</SectionTitle>
            <Card style={{ gap: Spacing.md }}>
              <View>
                <Muted style={styles.fieldLabel}>Ort</Muted>
                <View style={styles.chipWrap}>
                  <Chip label="Halle" selected={ort === 'halle'} onPress={() => setOrt(ort === 'halle' ? undefined : 'halle')} />
                  <Chip
                    label="Freiluft"
                    selected={ort === 'freiluft'}
                    onPress={() => setOrt(ort === 'freiluft' ? undefined : 'freiluft')}
                  />
                </View>
              </View>

              {ort === 'freiluft' && (
                <View>
                  <Muted style={styles.fieldLabel}>Wind (m/s, + = Rückenwind)</Muted>
                  <TextInput
                    style={styles.input}
                    value={wind}
                    onChangeText={setWind}
                    placeholder="z. B. -1,2"
                    placeholderTextColor={Colors.gray}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              )}

              {zeigeZeitnahme && (
                <View>
                  <Muted style={styles.fieldLabel}>Zeitnahme</Muted>
                  <View style={styles.chipWrap}>
                    <Chip
                      label="Elektronisch"
                      selected={zeitnahme === 'elektronisch'}
                      onPress={() => setZeitnahme(zeitnahme === 'elektronisch' ? undefined : 'elektronisch')}
                    />
                    <Chip
                      label="Hand"
                      selected={zeitnahme === 'hand'}
                      onPress={() => setZeitnahme(zeitnahme === 'hand' ? undefined : 'hand')}
                    />
                  </View>
                  <Muted style={{ marginTop: 4 }}>
                    Handzeit wird bei 100 m / 110 m H (+0,24 s) und 400 m (+0,14 s) für die Punkte korrigiert.
                  </Muted>
                </View>
              )}
            </Card>

            {/* Dauer + Notiz */}
            <SectionTitle style={styles.section}>Einheit (optional)</SectionTitle>
            <Muted style={styles.fieldLabel}>Gesamtdauer der Einheit (Minuten)</Muted>
            <TextInput
              style={styles.input}
              value={dauer}
              onChangeText={setDauer}
              placeholder="z. B. 90"
              placeholderTextColor={Colors.gray}
              keyboardType="number-pad"
            />
            <Muted style={[styles.fieldLabel, { marginTop: Spacing.sm }]}>Notiz</Muted>
            <TextInput
              style={[styles.input, styles.notizInput]}
              value={notiz}
              onChangeText={setNotiz}
              placeholder="z. B. Wettkampf, Gefühl, Technik …"
              placeholderTextColor={Colors.gray}
              multiline
            />
          </>
        )}
      </ScrollView>

      {/* Speichern-Leiste */}
      <View style={[styles.saveBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <Button
          title="Session speichern"
          onPress={onSpeichern}
          loading={speichern}
          disabled={!disc}
        />
      </View>
    </KeyboardAvoidingView>
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  input: {
    minHeight: 48,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  attemptIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cardStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attemptInput: {
    flex: 1,
  },
  removeBtn: {
    padding: 2,
  },
  fieldLabel: {
    marginBottom: 4,
  },
  notizInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
});
