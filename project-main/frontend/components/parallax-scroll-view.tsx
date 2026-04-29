import { ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { PropsWithChildren, ReactElement } from 'react';

import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerBackgroundColor: { light: string; dark: string };
  headerImage?: ReactElement;
}>;

export default function ParallaxScrollView({ children, headerBackgroundColor, headerImage }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = headerBackgroundColor[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView scrollEventThrottle={16} scrollIndicatorInsets={{ bottom: 0 }}>
        <ThemedView
          style={[
            styles.header,
            {
              backgroundColor,
            },
          ]}>
          {headerImage && headerImage}
        </ThemedView>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
