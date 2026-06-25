# PaceLab

Trainings- und Wettkampf-Tagebuch für Leichtathleten in den **Zehnkampf- und verwandten Disziplinen**. Erfasse Einheiten und Versuche, verfolge deine Bestleistungen und sieh über die World-Athletics-Normierung deine **Gesamtform** über die Zeit.

> Die vollständige Projektdokumentation (Datenmodell, Architektur, Entscheidungen, TODOs) steht in **[PROJECT.md](./PROJECT.md)** – die einzige Quelle der Wahrheit.

## Features

- **Sessions & Versuche** – eine Trainingseinheit kann mehrere Versuche enthalten (z. B. Intervall „8×100 m").
- **Disziplinen** – die 10 offiziellen Zehnkampf-Disziplinen + Trainingsvarianten, erweiterbar um eigene.
- **Richtungsbewusste Kurven** – „oben = besser", auch bei Läufen (invertierte Y-Achse), mit PB-Markierung und Trend.
- **World-Athletics-Punkte** – offizielle Formel inkl. Handzeit-Korrektur.
- **Kombinierte Form-Kurve** – alle Disziplinen normiert auf eine Gesamtpunktzahl.
- **Regenerationsfreundlicher Streak** – zählt Wochen mit erreichtem Ziel; Ruhetage brechen den Streak nie.
- **Offline-first** – alle Daten lokal, kein Login, keine Cloud.

## Tech-Stack

Expo SDK 56 · React Native 0.85 · React 19.2 · TypeScript · Expo Router · AsyncStorage · react-native-svg.

## Start

```bash
npm install        # Abhängigkeiten
npx expo start     # Dev-Server (Expo Go: nur SDK 56)
```

Native Pakete immer mit `npx expo install <paket>` hinzufügen, damit die Versionen zu SDK 56 passen.

## Projektstruktur

```
src/
  app/        Expo-Router-Screens (file-based)
  components/ UI-Bausteine (ui, LineChart, SessionCard)
  data/       types, standardDisciplines, storage, DataContext
  logic/      points (WA), format, derived (PB/Streak/Form)
  theme/      colors (Design-Tokens)
```
