/**
 * Eigene Disziplin anlegen.
 * Name, Kategorie, Einheit, Richtung – optional die WA-Punkte-Parameter
 * (A, B, C) für eine Punktewertung.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Chip, Muted, SectionTitle } from '@/components/ui';
import { useData } from '@/data/DataContext';
import type {
  Direction,
  DisciplineCategory,
  DisciplineUnit,
  WorldAthleticsParams,
} from '@/data/types';
import { Colors, FontSize, Radius, Spacing } from '@/theme/colors';

const KATEGORIEN: DisciplineCategory[] = ['Sprint', 'Lauf', 'Ausdauer', 'Sprung', 'Wurf'];
const EINHEITEN: DisciplineUnit[] = ['Sekunden', 'Meter', 'Zentimeter', 'Punkte'];

/** Vorschlag für Einheit/Richtung anhand der Kategorie. */
function defaultsFuer(cat: DisciplineCategory): { unit: DisciplineUnit; direction: Direction } {
  if (cat === 'Sprung') return { unit: 'Meter', direction: 'groesser_ist_besser' };
  if (cat === 'Wurf') return { unit: 'Meter', direction: 'groesser_ist_besser' };
  return { unit: 'Sekunden', direction: 'kleiner_ist_besser' }; // Sprint/Lauf/Ausdauer
}

export default function NeueDisziplinScreen() {
  const { addDiscipline } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<DisciplineCategory>('Sprint');
  const [unit, setUnit] = useState<DisciplineUnit>('Sekunden');
  const [direction, setDirection] = useState<Direction>('kleiner_ist_besser');

  const [waOffen, setWaOffen] = useState(false);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');

  function waehleKategorie(cat: DisciplineCategory) {
    setCategory(cat);
    const def = defaultsFuer(cat);
    setUnit(def.unit);
    setDirection(def.direction);
  }

  async function onSpeichern() {
    if (!name.trim()) {
      Alert.alert('Name fehlt', 'Bitte einen Namen für die Disziplin eingeben.');
      return;
    }

    let waParams: WorldAthleticsParams | undefined;
    if (waOffen && (a.trim() || b.trim() || c.trim())) {
      const A = Number(a.replace(',', '.'));
      const B = Number(b.replace(',', '.'));
      const C = Number(c.replace(',', '.'));
      if (![A, B, C].every(Number.isFinite)) {
        Alert.alert('WA-Parameter', 'A, B und C müssen Zahlen sein (oder alle leer lassen).');
        return;
      }
      const type = unit === 'Sekunden' ? 'lauf' : direction === 'groesser_ist_besser' && unit === 'Meter' ? 'wurf' : 'sprung';
      const pointsUnit = unit === 'Sekunden' ? 'Sekunden' : unit === 'Zentimeter' ? 'Zentimeter' : 'Meter';
      waParams = { A, B, C, type, pointsUnit };
    }

    await addDiscipline({ name: name.trim(), category, unit, direction, waParams });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <SectionTitle>Name</SectionTitle>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="z. B. 500 m, Medizinball-Wurf"
          placeholderTextColor={Colors.gray}
        />

        <SectionTitle style={styles.section}>Kategorie</SectionTitle>
        <View style={styles.chipWrap}>
          {KATEGORIEN.map((k) => (
            <Chip key={k} label={k} selected={category === k} onPress={() => waehleKategorie(k)} />
          ))}
        </View>

        <SectionTitle style={styles.section}>Einheit</SectionTitle>
        <View style={styles.chipWrap}>
          {EINHEITEN.map((u) => (
            <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />
          ))}
        </View>

        <SectionTitle style={styles.section}>Richtung</SectionTitle>
        <View style={styles.chipWrap}>
          <Chip
            label="kleiner ist besser"
            selected={direction === 'kleiner_ist_besser'}
            onPress={() => setDirection('kleiner_ist_besser')}
          />
          <Chip
            label="größer ist besser"
            selected={direction === 'groesser_ist_besser'}
            onPress={() => setDirection('groesser_ist_besser')}
          />
        </View>

        {/* WA-Parameter (optional, eingeklappt) */}
        <SectionTitle style={styles.section}>Punktewertung (optional)</SectionTitle>
        {!waOffen ? (
          <Button title="WA-Parameter hinzufügen" variant="secondary" onPress={() => setWaOffen(true)} />
        ) : (
          <Card style={{ gap: Spacing.sm }}>
            <Muted>
              Formel: Lauf = A·(B−P)^C, Sprung/Wurf = A·(P−B)^C. Sprünge gehen in cm, Würfe in m in die
              Formel ein.
            </Muted>
            <View style={styles.waRow}>
              <View style={styles.waField}>
                <Muted>A</Muted>
                <TextInput style={styles.input} value={a} onChangeText={setA} keyboardType="numbers-and-punctuation" placeholder="A" placeholderTextColor={Colors.gray} />
              </View>
              <View style={styles.waField}>
                <Muted>B</Muted>
                <TextInput style={styles.input} value={b} onChangeText={setB} keyboardType="numbers-and-punctuation" placeholder="B" placeholderTextColor={Colors.gray} />
              </View>
              <View style={styles.waField}>
                <Muted>C</Muted>
                <TextInput style={styles.input} value={c} onChangeText={setC} keyboardType="numbers-and-punctuation" placeholder="C" placeholderTextColor={Colors.gray} />
              </View>
            </View>
          </Card>
        )}

        <Button title="Disziplin speichern" onPress={onSpeichern} style={styles.section} />
      </ScrollView>
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
  input: {
    minHeight: 48,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  waRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  waField: {
    flex: 1,
    gap: 4,
  },
});
