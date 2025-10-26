import React, { useRef, useState, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ✅ All Facts + Images
const factsData = [
  {
    title: 'Himalayan Brown Bear',
    text: "Himalayan Brown Bear (Deosai National Park) lives up to 20–30 years in the wild, but Pakistan's population is one of the smallest in the world.",
    image: 'https://via.placeholder.com/300x200/406040/FFFFFF?text=Bear+Silhouette',
  },
  {
    title: 'Himalayan Ibex',
    text: 'Ibex is found at altitudes of about 3,660 to over 5,000 m in summer, descending to about 2,135 m in winter due to snow.',
    image: 'https://via.placeholder.com/300x200/5B8B7D/FFFFFF?text=Ibex',
  },
  {
    title: 'Markhor Population',
    text: 'The markhor population in Khyber-Pakhtunkhwa has risen to 5,621 individuals. Estimated population ~5,993 individuals per km² in surveyed blocks.',
    image: 'https://via.placeholder.com/300x200/8B5B5B/FFFFFF?text=Markhor',
  },
  {
    title: 'Grey Wolf',
    text: 'Within Pakistan, there may be only a few hundred grey wolves (Indian + Tibetan subspecies combined), many living in Gilgit-Baltistan and Khyber Pakhtunkhwa.',
    image: 'https://via.placeholder.com/300x200/555555/FFFFFF?text=Grey+Wolf',
  },
  {
    title: 'Markhor Recovery',
    text: 'Over the past ~30 years, the markhor population in Pakistan has more than doubled from fewer than ~2,500 in the 1990s to 5,000–6,000 in recent estimates.',
    image: 'https://via.placeholder.com/300x200/7A4F2E/FFFFFF?text=Markhor+Recovery',
  },
];

const getDailyFact = () => {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return factsData[dayIndex % factsData.length];
};

const HomeScreen = () => {
  const dailyFact = getDailyFact();
  const router = useRouter();

  // ✅ Sidebar animation
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Profile image state
  const [profileImage, setProfileImage] = useState(null);

  const toggleSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? -width * 0.7 : 0,
      duration: 250,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
    setSidebarOpen(!sidebarOpen);
  };

  // Load profile image from storage
  const loadProfileImage = async () => {
    try {
      const savedProfileImage = await AsyncStorage.getItem('profileImage');
      if (savedProfileImage) {
        setProfileImage(savedProfileImage);
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };

  // Load profile image on component mount and when screen comes into focus
  useEffect(() => {
    loadProfileImage();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileImage();
    }, [])
  );

  const handleLogout = () => {
    console.log('Logout clicked');
    toggleSidebar();
    // Implement your logout logic here
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {/* ✅ Hamburger */}
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
       <TouchableOpacity onPress={() => router.push('/(tabs)/UserProfile')}>
  {profileImage ? (
    <Image
      source={{ uri: profileImage }}
      style={{ width: 35, height: 35, borderRadius: 20 }}
    />
  ) : (
    <Ionicons name="person-circle" size={30} color="#000" />
  )}
</TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* --- Fact of the Day --- */}
        <View style={styles.factContainer}>
          <View style={styles.factTextGroup}>
            <Text style={styles.factTitle}>Fact of the Day</Text>
            <Text style={styles.factBody}>
              <Text style={{ fontWeight: 'bold' }}>{dailyFact.title}</Text> {dailyFact.text}
            </Text>
          </View>
          <Image source={{ uri: dailyFact.image }} style={styles.bearImage} resizeMode="cover" />
        </View>

        {/* --- Upload New Report --- */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Upload new report</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/UploadReport')} style={styles.addButton}>
            <Ionicons name="add-circle" size={36} color="#000" />
          </TouchableOpacity>
        </View>

        {/* --- Report Buttons --- */}
        <View style={styles.reportButtonsContainer}>
          <TouchableOpacity style={styles.reportCard} onPress={() => console.log('View Map')}>
            <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="map" size={80} color="#524b4bff" />
            </View>
            <Text style={styles.cardText}>View map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportCard} onPress={() => console.log('View Reports')}>
            <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="file-document-outline" size={80} color="#524b4bff" />
            </View>
            <Text style={styles.cardText}>View Reports</Text>
          </TouchableOpacity>
        </View>

        {/* --- Analytics Section --- */}
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsTitle}>Analytics</Text>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Total Reports</Text>
            <Text style={styles.analyticsCount}>0</Text>
          </View>
          <TouchableOpacity
            style={styles.viewReportsButton}
            onPress={() => console.log('View my reports')}>
            <Text style={styles.viewReportsButtonText}>View my reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- Bottom Navigation Bar --- */}
      <View style={styles.bottomNav}>
        <BottomNavItem iconName="book" label="ResLib" isSelected={false} />
        <BottomNavItem iconName="scan-circle-outline" label="Specie AI" isSelected={false} />
        <BottomNavItem iconName="home" label="Home" isSelected={true} />
        <BottomNavItem iconName="list" label="Reports" isSelected={false} />
        <BottomNavItem iconName="settings" label="Settings" isSelected={false} />
      </View>

      {/* ✅ Sidebar Overlay */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* ✅ Sidebar Drawer */}
      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        <Text style={styles.sidebarHeader}>Menu</Text>
        <TouchableOpacity style={styles.sidebarItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => console.log('My Reports')}>
          <Ionicons name="document-text-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>My Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => console.log('Support')}>
          <Ionicons name="help-circle-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Support</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

// Bottom nav item
const BottomNavItem = ({ iconName, label, isSelected }) => (
  <TouchableOpacity style={styles.navItem}>
    <Ionicons name={iconName} size={24} color={isSelected ? '#000' : '#888'} />
    <Text style={[styles.navText, isSelected && styles.navTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f2f2' },
  container: { paddingBottom: 80 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#000' },

  factContainer: {
    backgroundColor: '#406040',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 180,
  },
  factTextGroup: { flex: 2, paddingRight: 10 },
  factTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  factBody: { fontSize: 14, color: '#fff', lineHeight: 20 },
  bearImage: { width: width * 0.35, height: 120 },

  uploadSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  uploadTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  addButton: { padding: 5 },

  reportButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  reportCard: {
    width: '40%',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
    alignItems: 'center',
    paddingBottom: 8,
  },
  cardImage: { width: '100%', height: 90, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  cardText: { fontSize: 16, fontWeight: '500', textAlign: 'center', color: '#000', marginTop: 6 },

  analyticsSection: {
    marginHorizontal: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  analyticsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  analyticsLabel: { fontSize: 16, color: '#555' },
  analyticsCount: { fontSize: 20, fontWeight: '600', color: '#333' },
  viewReportsButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 6,
    width: '50%',
    alignSelf: 'flex-end',
    marginTop: 20,
  },
  viewReportsButtonText: { fontSize: 16, fontWeight: '700', color: '#000', textAlign: 'center' },

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
  navItem: { flex: 1, alignItems: 'center', paddingTop: 5 },
  navText: { fontSize: 10, color: '#888' },
  navTextSelected: { color: '#000', fontWeight: 'bold' },

  // ✅ Sidebar styles
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    elevation: 5,
    zIndex: 10,
  },
  sidebarHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sidebarText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#000',
  },
});

export default HomeScreen;
