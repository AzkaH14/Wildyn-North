import { Text, TextProps } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'link' | 'defaultSemiBold';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useColorScheme() === 'dark' ? darkColor : lightColor;

  return (
    <Text
      {...rest}
      style={[
        { color: color || Colors[useColorScheme() === 'dark' ? 'dark' : 'light'].text },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        style,
      ]}
    />
  );
}

const styles = {
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
};
