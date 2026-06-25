# PaceLab — Projektdokumentation

> **Einzige Quelle der Wahrheit.** Vor jeder Änderung lesen, nach jeder relevanten Änderung aktualisieren. Kollidiert eine Anforderung mit diesem Dokument → anhalten und nachfragen.

## 1. Zielbild & Scope

PaceLab ist eine **Mobile-App für Leichtathleten** (nicht Trainer), mit der sie ihr Training in den **Zehnkampf- und verwandten Disziplinen** erfassen, ihren Fortschritt visualisieren und gezielt besser werden. Persönliches **Trainings- und Wettkampf-Tagebuch**.

**v1-Scope:** lokal & offline, kein Login, keine Cloud, Männer-Zehnkampf-Wertung.

**Nicht im Scope (v1):** Frauen-Siebenkampf, Cloud-Sync, Trainer-/Mehrnutzer-Funktionen, Export.

## 2. Tech-Stack (exakte Versionen)

| Bereich | Wahl | Version |
|---|---|---|
| Runtime/Framework | Expo SDK | **56.0.12** |
| | React Native | 0.85.3 |
| | React | 19.2.3 |
| Sprache | TypeScript | ~6.0.3 |
| Navigation | expo-router (file-based) | ~56.2.11 |
| Persistenz | @react-native-async-storage/async-storage | via `expo install` |
| Charts | react-native-svg (eigene Chart-Komponente) | via `expo install` |
| Icons | @expo/vector-icons (Ionicons) | via `expo install` |
| Datumswahl | @react-native-community/datetimepicker | via `expo install` |
| State | React Context (`DataProvider`) | — |

Node ≥ 20.19.4 erforderlich. **Alle nativen Pakete ausschließlich über `npx expo install`** installieren (SDK-56-kompatible Versionen). Expo Go unterstützt nur das jeweils neueste SDK.

### Begründung der Schlüssel-Entscheidungen

- **Persistenz = AsyncStorage (ein JSON-Blob)** statt SQLite: Der Datenbestand eines einzelnen Athleten ist klein und passt in den Speicher. Ein einziger Blob erlaubt vollständige React-Reaktivität (alles im Context, Schreiben = State-Update + Persist) ohne SQL-Queries und Migrationsskripte. SQLite wäre überdimensioniert.
- **Charts = react-native-svg + eigene `LineChart`-Komponente** statt Fremd-Chart-Lib: garantierte Kompatibilität mit SDK 56 / RN 0.85 / React 19 und volle Kontrolle über die richtungsbewusste Y-Achse („oben = besser"), PB-Markierung und Trendlinie.
- **Navigation = JS-Tabs (`Tabs`)** statt native Tabs: volle Kontrolle über die Pastell-Palette.
- **Nur helles Farbschema** (`userInterfaceStyle: light`): die abgestimmte Pastell-Palette soll nicht durch einen Dark Mode gebrochen werden.

## 3. Datenmodell

Quelle: `src/data/types.ts`. Kerngedanke: **Trainingseinheit (Session) ≠ einzelne Leistung (Attempt)**. Eine Session enthält 1..n Versuche (z. B. Intervall „8×100 m").

- **Discipline**: `id`, `name`, `category` (Sprint|Lauf|Ausdauer|Sprung|Wurf), `unit` (Sekunden|Meter|Zentimeter|Punkte), `direction` (kleiner_ist_besser|groesser_ist_besser), `istStandard`, `waParams?` (A,B,C,type,pointsUnit), `istZehnkampf?`.
- **Session**: `id`, `datum` (ISO YYYY-MM-DD), `disciplineId`, `gesamtdauerMinuten?` (Dauer der *Einheit*, NICHT die Leistung), `bedingungen?` (ort, windMs, zeitnahme), `notiz?`, `createdAt`.
- **Attempt**: `id`, `sessionId`, `wert` (in der Einheit der Disziplin), `wiederholung`.
- **PaceLabData**: `version`, `disciplines[]`, `sessions[]`, `attempts[]` (kompletter persistierter Zustand).

**Abgeleitet (nicht gespeichert, `src/logic/derived.ts`):** PB je Disziplin (richtungsbewusst), bester Versuch je Session, WA-Punkte, Gesamtprojektion, Form-Kurve, Streak, Aktivität.

## 4. World-Athletics-Punkte (Männer-Zehnkampf)

Quelle: `src/logic/points.ts` + Koeffizienten in `src/data/standardDisciplines.ts`.

- Läufe: `Punkte = A · (B − P)^C` (P = Zeit in s)
- Sprung/Wurf: `Punkte = A · (P − B)^C` (Sprünge in cm, Würfe in m)
- Ergebnis `floor`, negativ → 0.
- Handzeit-Korrektur vor Berechnung: 100 m & 110 m H **+0,24 s**, 400 m **+0,14 s**, ab 800 m keine. Gesteuert über `bedingungen.zeitnahme === 'hand'`.

Koeffizienten (A, B, C): 100 m 25.4347/18/1.81 · 400 m 1.53775/82/1.81 · 1500 m 0.03768/480/1.85 · 110 m H 5.74352/28.5/1.92 · Weit 0.14354/220/1.40 · Hoch 0.8465/75/1.42 · Stab 0.2797/100/1.35 · Kugel 51.39/1.5/1.05 · Diskus 12.91/4/1.10 · Speer 10.14/7/1.08.

## 5. Vorausgefüllte Disziplinen

10 Zehnkampf-Disziplinen (mit WA-Wertung, `istZehnkampf`): 100 m, Weitsprung, Kugelstoßen, Hochsprung, 400 m, 110 m Hürden, Diskuswurf, Stabhochsprung, Speerwurf, 1500 m.

Trainingsvarianten (ohne WA-Wertung): 60 m, 200 m, 300 m, 3 km, Hürdenlauf (kurz).

Liste ist **erweiterbar**: Nutzer können eigene Disziplinen anlegen (Name, Kategorie, Einheit, Richtung, optional WA-Parameter).

## 6. Screens

| Datei | Zweck |
|---|---|
| `app/(tabs)/index.tsx` | **Heute** – Schnellzugriff „Neue Session", Streak, Form-Projektion, letzte Einheiten |
| `app/(tabs)/history.tsx` | **Verlauf** – alle Sessions, Filter nach Disziplin & Zeitraum |
| `app/(tabs)/stats.tsx` | **Statistik** – Form-Kurve + Gesamtpunktzahl, Streak, Aktivitäts-Heatmap, PB-Übersicht |
| `app/session/new.tsx` | **Neue Session** – Disziplinwahl, disziplinabhängige Eingabe, Versuche, Bedingungen, PB-Rückmeldung |
| `app/discipline/[id].tsx` | **Disziplin-Detail** – richtungsbewusste Kurve, PB, Trend, Einheitenliste |
| `app/disciplines/index.tsx` | **Disziplinen verwalten** – Standard + eigene, löschen |
| `app/disciplines/new.tsx` | **Eigene Disziplin anlegen** |

## 7. Design-Tokens

Quelle: `src/theme/colors.ts`. Text/Icons/Achsen/Diagrammlinien dürfen dunkel (`#1A1A1A`) sein. Pastell-Palette nur für Flächen/Karten/Akzente/Buttons/Diagramm-Füllungen.

- Hintergrund `#FCFCFC` / alt `#F8F5EE`
- Flächen `#F2F2F2` · `#E7E7E7`
- Karten `#E1DFD3` · `#EEEBE4`
- Taupe `#CDBEB7` · `#D7C8C5` · `#E2D3D0`
- Blush (Primär/PB) `#E5C9BE` · `#EFD2CA` · `#F9DBD3`
- Grau `#949494` · `#A0A0A0` · `#AAAAAA`
- Diagramm-Serien-Reihenfolge: Taupe → Blush → Salbei → Grau

## 8. Architektur / Verzeichnisse

```
src/
  app/                 # Expo-Router-Screens (file-based)
    _layout.tsx        # Root: DataProvider + Stack
    (tabs)/            # Tab-Navigation (Heute, Verlauf, Statistik)
    session/new.tsx
    discipline/[id].tsx
    disciplines/
  components/           # UI-Bausteine (ui.tsx, LineChart.tsx, SessionCard.tsx)
  data/                # types, standardDisciplines, storage, DataContext
  logic/               # points (WA), format (parse/anzeige), derived (PB/Streak/Form)
  theme/               # colors.ts (Design-Tokens)
```

## 9. Streak-Philosophie (bewusst regenerationsfreundlich)

Der Streak zählt **Wochen mit ≥ Wochenziel Trainingstagen** (Default 3), nicht einzelne Tage. **Ein Ruhetag bricht den Streak nie.** Die laufende Woche bricht den Streak nicht, solange das Ziel noch erreichbar ist. Tägliches Training wird weder erzwungen noch belohnt. Implementierung: `berechneStreak` in `src/logic/derived.ts`.

## 10. Git-Workflow

- Repo: `git@github.com:MaximilianLakner/PaceLab.git` (Push via SSH-Key `id_ed25519`).
- Nach jeder abgeschlossenen Änderung committen und pushen.
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.

## 11. Offene Entscheidungen / TODOs

- [ ] **Frauen-Siebenkampf**: eigene Koeffizienten (100 m H, Hoch, Kugel, 200 m, Weit, Speer, 800 m) ergänzen, falls später gewünscht. Aktuell nur Männer-Zehnkampf.
- [ ] Wochenziel des Streaks konfigurierbar machen (aktuell fix 3).
- [ ] Optionaler Daten-Export/Backup.
- [ ] Wind-/Bedingungs-Marker direkt in der Disziplin-Kurve (aktuell in der Einheitenliste sichtbar).
- [ ] Bearbeiten bestehender Sessions (aktuell nur anlegen/löschen).
