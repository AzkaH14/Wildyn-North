import { Link } from 'expo-router';
import { OpenURLButtonProps } from 'expo-linking';
import { Platform } from 'react-native';

export function ExternalLink(props: OpenURLButtonProps & { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={props.href}
      {...(Platform.OS === 'web'
        ? {
            target: '_blank',
            onPress: (e) => {
              e.preventDefault();
              if (props.onPress) props.onPress(e);
            },
          }
        : {})}>
      {props.children}
    </Link>
  );
}
