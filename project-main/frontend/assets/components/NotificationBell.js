import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGlobalNotifications } from '../../contexts/GlobalNotificationContext';

const NotificationBell = ({ color = '#fff', size = 24 }) => {
  const router = useRouter();
  const { unreadCount } = useGlobalNotifications();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevCount.current) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue:  10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:   6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:   0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  const badge = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/NotificationCenter')}
      style={styles.wrap}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ transform: [{ rotate: shakeAnim.interpolate({
        inputRange: [-10, 10], outputRange: ['-18deg', '18deg'],
      }) }] }}>
        <Ionicons name="notifications-outline" size={size} color={color} />
      </Animated.View>
      {badge && (
        <View style={[styles.badge, badge.length > 1 && styles.badgeWide]}>
          <Text style={styles.badgeTxt}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap      : { position:'relative', width:34, height:34, alignItems:'center', justifyContent:'center' },
  badge     : { position:'absolute', top:1, right:1, minWidth:16, height:16, borderRadius:8,
                backgroundColor:'#E53935', alignItems:'center', justifyContent:'center',
                paddingHorizontal:3, borderWidth:1.5, borderColor:'rgba(255,255,255,0.9)' },
  badgeWide : { borderRadius:9, paddingHorizontal:4 },
  badgeTxt  : { color:'#fff', fontSize:9, fontWeight:'800', lineHeight:13 },
});

export default NotificationBell;