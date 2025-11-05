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
import BottomNav from '../../components/BottomNav';

const API_URL = 'http://172.21.244.98:5000';

const { width } = Dimensions.get('window');

// ✅ All Facts
const factsData = [
  {
    title: 'Himalayan Brown Bear',
    text: "Himalayan Brown Bear (Deosai National Park) lives up to 20–30 years in the wild, but Pakistan's population is one of the smallest in the world.",
  },
  {
    title: 'Himalayan Ibex',
    text: 'Ibex is found at altitudes of about 3,660 to over 5,000 m in summer, descending to about 2,135 m in winter due to snow.',
  },
  {
    title: 'Markhor Population',
    text: 'The markhor population in Khyber-Pakhtunkhwa has risen to 5,621 individuals. Estimated population ~5,993 individuals per km² in surveyed blocks.',
  },
  {
    title: 'Grey Wolf',
    text: 'Within Pakistan, there may be only a few hundred grey wolves (Indian + Tibetan subspecies combined), many living in Gilgit-Baltistan and Khyber Pakhtunkhwa.',
  },
  {
    title: 'Markhor Recovery',
    text: 'Over the past ~30 years, the markhor population in Pakistan has more than doubled from fewer than ~2,500 in the 1990s to 5,000–6,000 in recent estimates.',
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
  const [totalReports, setTotalReports] = useState(0);

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

  const loadReportCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reports`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setTotalReports(data.length);
    } catch (e) {
      // fail silently for count
    }
  };

  // Load profile image on component mount and when screen comes into focus
  useEffect(() => {
    loadProfileImage();
    loadReportCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileImage();
      loadReportCount();
    }, [])
  );

  const handleLogout = async () => {
    try {
      // Clear all user data from AsyncStorage
      await AsyncStorage.multiRemove(['userId', 'username', 'userEmail', 'isLoggedIn', 'profileImage']);
      toggleSidebar();
      // Navigate to Login screen and prevent going back
      router.replace('/(tabs)/Login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if clearing storage fails
      toggleSidebar();
      router.replace('/(tabs)/Login');
    }
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

          <TouchableOpacity style={styles.reportCard} onPress={() => router.push("/(tabs)/ReportsFeed")}>
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
    <Text style={styles.analyticsCount}>{totalReports}</Text>
  </View>

  <View style={styles.buttonWrapper}>
    <TouchableOpacity
      style={styles.viewReportsButton}
      onPress={() => router.push("/(tabs)/ReportsHistory")}
    >
      <Ionicons name="document-text-outline" size={20} color="black" />
      <Text style={styles.viewReportsButtonText}>View My Reports</Text>
    </TouchableOpacity>
  </View>
</View>
      </ScrollView>

      {/* --- Bottom Navigation Bar --- */}
      <BottomNav />

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

        <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push("/(tabs)/ReportsHistory")}        >
          <Ionicons name="document-text-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Reports history</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => console.log('Support')}>
          <Ionicons name="help-circle-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Support</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

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
  },
  factTextGroup: { width: '100%' },
  factTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  factBody: { fontSize: 14, color: '#fff', lineHeight: 20 },

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

  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    width: '100%',
  },
  
  viewReportsButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

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
