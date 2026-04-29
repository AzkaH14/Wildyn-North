import { View, ViewProps } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor =
    useColorScheme() === 'dark'
      ? darkColor || Colors.dark.background
      : lightColor || Colors.light.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
