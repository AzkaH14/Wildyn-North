import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Index',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="square.grid.2x2.fill" color={color} />
          ),
        }}
      />
      
      {/* ✅ Home Screen */}
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* ✅ Upload Report Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="UploadReport"
        options={{
          href: null,
          title: 'Upload Report',
        }}
      />

      {/* ✅ Wildlife Library Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="WildlifeLibrary"
        options={{
          href: null,
          title: 'Wildlife Library',
        }}
      />

      {/* ✅ Reports Feed Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="ReportsFeed"
        options={{
          href: null,
          title: 'Reports Feed',
        }}
      />

      {/* ✅ User Profile Screen — Hidden from tab bar */}
      <Tabs.Screen
        name="UserProfile"
        options={{
          href: null,
          title: 'User Profile',
        }}
      />
      
    
    </Tabs>
  );
}
