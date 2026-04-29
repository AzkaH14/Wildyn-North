import { SymbolView } from 'expo-symbols';
import { ComponentProps } from 'react';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  ...rest
}: {
  name: string;
  size?: number;
  color: string;
} & ComponentProps<typeof SymbolView>) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      style={style}
      {...rest}
    />
  );
}