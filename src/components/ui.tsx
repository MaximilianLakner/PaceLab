/**
 * Kleine, wiederverwendbare UI-Bausteine im PaceLab-Design.
 *
 * Designprinzip: Pastellflächen für Karten/Buttons, dunkler Text/Rahmen für
 * tragende Information (Pastelltöne untereinander haben wenig Kontrast).
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
} from 'react-native';

import { Accent, AccentStrong, Colors, FontSize, Radius, Spacing } from '@/theme/colors';

/** Überschrift einer Sektion. */
export function SectionTitle({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[styles.sectionTitle, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Großer Bildschirmtitel. */
export function ScreenTitle({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[styles.screenTitle, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Standard-Fließtext. */
export function Body({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[styles.body, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Dezenter Hilfstext. */
export function Muted({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[styles.muted, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Karte mit heller Pastellfläche und dezentem Rahmen. */
export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewProps['style'];
}

/** Button. Primär = Blush-Akzent mit dunklem Text und Rahmen. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: ButtonProps) {
  const bg =
    variant === 'primary' ? Accent : variant === 'secondary' ? Colors.cardStrong : 'transparent';
  const borderColor = variant === 'ghost' ? 'transparent' : AccentStrong;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && styles.buttonGhost,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={Colors.text} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

/** Auswahl-Chip (z. B. für Disziplinen, Filter). */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? Accent : Colors.surface, borderColor: selected ? AccentStrong : Colors.border },
      ]}>
      <Text style={[styles.chipText, selected && { fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

/** Leerer Zustand mit Hinweistext und optionaler Aktion. */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
      {action ? <View style={{ marginTop: Spacing.md }}>{action}</View> : null}
    </View>
  );
}

/** Ladeanzeige zentriert. */
export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Colors.text} />
    </View>
  );
}

/** Markierung „PB" als kleines Badge. */
export function PBBadge({ small }: { small?: boolean }) {
  return (
    <View style={[styles.pbBadge, small && { paddingHorizontal: 6, paddingVertical: 1 }]}>
      <Text style={styles.pbBadgeText}>PB</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  body: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  muted: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  button: {
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  buttonGhost: {
    borderWidth: 0,
    minHeight: 40,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pbBadge: {
    backgroundColor: Colors.blush3,
    borderColor: AccentStrong,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pbBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.text,
  },
});
