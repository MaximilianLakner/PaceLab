/**
 * Root-Layout: stellt den Daten-Context bereit und definiert den Navigations-
 * Stack (Tabs + modale/gestapelte Screens).
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DataProvider } from '@/data/DataContext';
import { Colors, FontSize } from '@/theme/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DataProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.background },
              headerTintColor: Colors.text,
              headerTitleStyle: { fontWeight: '700', fontSize: FontSize.lg },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: Colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="session/new"
              options={{ title: 'Neue Session', presentation: 'modal' }}
            />
            <Stack.Screen name="discipline/[id]" options={{ title: 'Disziplin' }} />
            <Stack.Screen name="disciplines/index" options={{ title: 'Disziplinen' }} />
            <Stack.Screen
              name="disciplines/new"
              options={{ title: 'Neue Disziplin', presentation: 'modal' }}
            />
          </Stack>
        </DataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
