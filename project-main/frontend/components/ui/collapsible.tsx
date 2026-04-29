import { useState } from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const colorScheme = useColorScheme();

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}>
        <IconSymbol
          name={isOpen ? 'chevron.down' : 'chevron.right'}
          size={18}
          color={Colors[colorScheme ?? 'light'].text}
        />
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
        </ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  title: {
    flex: 1,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
    marginBottom: 12,
    gap: 6,
  },
});
