
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BottomNav = ({ active }) => {
  const router = useRouter();

  const navItems = [
    { icon: 'book-outline', label: 'ResLib', route: '/(tabs)/ResearcherHub' },
    { icon: 'home-outline', label: 'Home', route: '/(tabs)/HomeScreen' },
    { icon: 'scan-circle-outline', label: 'Specie AI', route: '/(tabs)/UploadReport' },
  ];

  const handleNavigation = async (route, label) => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      const userType = await AsyncStorage.getItem('userType');

      if (isLoggedIn !== 'true') {
        router.replace('/(tabs)/Login');
        return;
      }

      // Handle navigation logic
      if (label === 'Home') {
        if (userType === 'researcher') {
          router.push('/(tabs)/HomeScreenR');
        } else {
          router.push('/(tabs)/HomeScreen');
        }
        return;
      }

      if (label === 'ResLib') {
        if (userType === 'researcher') {
          router.push('/(tabs)/ResearcherHub');
        } else {
          router.push('/(tabs)/CommunityWildlifeLibrary');
        }
        return;
      }

      // Default navigation
      router.push(route);
    } catch (error) {
      router.replace('/(tabs)/Login');
    }
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.navItem}
          onPress={() => handleNavigation(item.route, item.label)}
        >
          <Ionicons
            name={item.icon}
            size={26}
            color={active === item.label ? '#2d6a4f' : '#888'}
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
    height: 65,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 5,
  },
  navText: {

    fontSize: 11,
    color: '#888',

 

  },
  navTextSelected: {
    color: '#2d6a4f',
    fontWeight: 'bold',
  },
});
