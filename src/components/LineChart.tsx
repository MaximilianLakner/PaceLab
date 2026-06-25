/**
 * Schlankes Liniendiagramm auf SVG-Basis (react-native-svg).
 *
 * Eigenentwicklung statt Fremd-Chart-Lib, weil:
 *  - garantierte Kompatibilität mit SDK 56 / RN 0.85 / React 19,
 *  - volle Kontrolle über die richtungsbewusste Y-Achse ("oben = besser"),
 *    PB-Markierung und Trendlinie.
 *
 * Wichtigster Kniff: Bei `invertY` (Läufe, kleiner_ist_besser) wird die
 * Y-Achse so gespiegelt, dass die BESSERE (kleinere) Leistung oben liegt.
 * Eine Verbesserung steigt damit optisch nach oben – wie man es erwartet.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { Colors } from '@/theme/colors';

export interface ChartPoint {
  /** X-Wert (z. B. Zeitstempel in ms). */
  t: number;
  value: number;
  /** Hebt den Punkt hervor (z. B. PB). */
  highlight?: boolean;
}

interface LineChartProps {
  points: ChartPoint[];
  width: number;
  height?: number;
  /** true = kleiner ist besser → Achse invertieren (oben = besser). */
  invertY?: boolean;
  formatValue: (v: number) => string;
  formatDate?: (t: number) => string;
  /** Horizontale PB-Linie. */
  pbValue?: number;
  /** Lineare Trendlinie einzeichnen. */
  showTrend?: boolean;
  /** Linien-/Punktfarbe der Serie. */
  seriesColor?: string;
}

const PAD = { top: 16, right: 14, bottom: 28, left: 52 };

export function LineChart({
  points,
  width,
  height = 240,
  invertY = false,
  formatValue,
  formatDate,
  pbValue,
  showTrend = false,
  seriesColor = Colors.taupe,
}: LineChartProps) {
  if (points.length === 0) return null;

  const plotLeft = PAD.left;
  const plotRight = width - PAD.right;
  const plotTop = PAD.top;
  const plotBottom = height - PAD.bottom;
  const plotWidth = Math.max(1, plotRight - plotLeft);
  const plotHeight = Math.max(1, plotBottom - plotTop);

  const sorted = [...points].sort((a, b) => a.t - b.t);

  // Wertebereich inkl. PB, mit etwas Polsterung.
  const werte = sorted.map((p) => p.value);
  if (pbValue !== undefined) werte.push(pbValue);
  let vMin = Math.min(...werte);
  let vMax = Math.max(...werte);
  if (vMin === vMax) {
    // Einzelwert: künstliche Spanne, damit der Punkt mittig liegt.
    vMin -= 1;
    vMax += 1;
  } else {
    const pad = (vMax - vMin) * 0.08;
    vMin -= pad;
    vMax += pad;
  }

  // Zeitbereich.
  const tMin = sorted[0].t;
  const tMax = sorted[sorted.length - 1].t;
  const tSpan = tMax - tMin;

  const xOf = (t: number) =>
    tSpan === 0 ? plotLeft + plotWidth / 2 : plotLeft + ((t - tMin) / tSpan) * plotWidth;

  // Richtungsbewusste Y-Abbildung.
  const yOf = (v: number) => {
    const frac = (v - vMin) / (vMax - vMin); // 0..1 vom kleinsten zum größten Wert
    // normal: großer Wert oben → kleines y. invertiert: kleiner Wert oben.
    const oben = invertY ? frac : 1 - frac;
    return plotTop + oben * plotHeight;
  };

  // Gitterlinien + Labels (Top = bester Wert, Bottom = schlechtester).
  const ticks = 4;
  const gridValues: number[] = [];
  for (let i = 0; i <= ticks; i++) {
    gridValues.push(vMin + ((vMax - vMin) * i) / ticks);
  }

  const polyPoints = sorted.map((p) => `${xOf(p.t)},${yOf(p.value)}`).join(' ');

  // Trendlinie per linearer Regression über (t, value).
  let trend: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (showTrend && sorted.length >= 2 && tSpan > 0) {
    const n = sorted.length;
    const sx = sorted.reduce((s, p) => s + p.t, 0);
    const sy = sorted.reduce((s, p) => s + p.value, 0);
    const sxy = sorted.reduce((s, p) => s + p.t * p.value, 0);
    const sxx = sorted.reduce((s, p) => s + p.t * p.t, 0);
    const denom = n * sxx - sx * sx;
    if (denom !== 0) {
      const slope = (n * sxy - sx * sy) / denom;
      const intercept = (sy - slope * sx) / n;
      const v1 = slope * tMin + intercept;
      const v2 = slope * tMax + intercept;
      trend = { x1: xOf(tMin), y1: yOf(v1), x2: xOf(tMax), y2: yOf(v2) };
    }
  }

  const fmtDate = formatDate ?? ((t: number) => new Date(t).toLocaleDateString('de-DE'));

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Gitter + Y-Beschriftung */}
        {gridValues.map((gv, i) => {
          const y = yOf(gv);
          return (
            <G key={`grid-${i}`}>
              <Line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke={Colors.grid} strokeWidth={1} />
              <SvgText x={plotLeft - 6} y={y + 4} fontSize={10} fill={Colors.axis} textAnchor="end">
                {formatValue(gv)}
              </SvgText>
            </G>
          );
        })}

        {/* Achsenlinien */}
        <Line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} stroke={Colors.axis} strokeWidth={1} />
        <Line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke={Colors.axis} strokeWidth={1} />

        {/* PB-Linie */}
        {pbValue !== undefined && (
          <G>
            <Line
              x1={plotLeft}
              y1={yOf(pbValue)}
              x2={plotRight}
              y2={yOf(pbValue)}
              stroke="#D9A899"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <SvgText x={plotRight} y={yOf(pbValue) - 4} fontSize={10} fill={Colors.axis} textAnchor="end">
              PB
            </SvgText>
          </G>
        )}

        {/* Trendlinie */}
        {trend && (
          <Line
            x1={trend.x1}
            y1={trend.y1}
            x2={trend.x2}
            y2={trend.y2}
            stroke={Colors.gray}
            strokeWidth={1.5}
            strokeDasharray="2 4"
          />
        )}

        {/* Datenlinie */}
        {sorted.length > 1 && (
          <Polyline points={polyPoints} fill="none" stroke={seriesColor} strokeWidth={2.5} />
        )}

        {/* Datenpunkte */}
        {sorted.map((p, i) => (
          <Circle
            key={`pt-${i}`}
            cx={xOf(p.t)}
            cy={yOf(p.value)}
            r={p.highlight ? 6 : 4}
            fill={p.highlight ? Colors.blush3 : seriesColor}
            stroke={Colors.text}
            strokeWidth={p.highlight ? 2 : 1}
          />
        ))}

        {/* X-Beschriftung: erster und letzter Punkt */}
        <SvgText x={plotLeft} y={height - 8} fontSize={10} fill={Colors.axis} textAnchor="start">
          {fmtDate(tMin)}
        </SvgText>
        {tSpan > 0 && (
          <SvgText x={plotRight} y={height - 8} fontSize={10} fill={Colors.axis} textAnchor="end">
            {fmtDate(tMax)}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
