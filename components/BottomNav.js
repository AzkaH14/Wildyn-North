import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BottomNav = ({ active }) => {
  const router = useRouter();

  const navItems = [
    { icon: 'book', label: 'ResLib', route: '/(tabs)/ResourceLibrary' },
    { icon: 'scan-circle-outline', label: 'Specie AI', route: '/(tabs)/SpecieAI' },
    { icon: 'home', label: 'Home', route: '/(tabs)/HomeScreen' },
    { icon: 'list', label: 'Reports', route: '/(tabs)/ReportsFeed' },
    { icon: 'settings', label: 'Settings', route: '/(tabs)/Settings' },
  ];

  const handleNavigation = (route) => {
    // Use replace to switch tabs properly
    router.replace(route);
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.navItem}
          onPress={() => handleNavigation(item.route)}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color={active === item.label ? '#000' : '#888'}
          />
          <Text
            style={[
              styles.navText,
              active === item.label && styles.navTextSelected,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 5,
  },
  navText: {
    fontSize: 10,
    color: '#888',
  },
  navTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
});
