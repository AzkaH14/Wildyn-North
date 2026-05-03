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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../assets/components/BottomNav';
import { API_URL } from '../../constants/api';
import NotificationBell from '../../assets/components/NotificationBell';


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
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Profile image state
  const [profileImage, setProfileImage] = useState(null);
  const [totalReports, setTotalReports] = useState(0);
  const [thisMonthReports, setThisMonthReports] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const toggleSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? -width * 0.75 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
    setSidebarOpen(!sidebarOpen);
  };

  const loadDashboardData = async () => {
    try {
      const [savedProfileImage, userId, savedUsername, savedEmail] = await Promise.all([
        AsyncStorage.getItem('profileImage'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('username'),
        AsyncStorage.getItem('userEmail'),
      ]);

      if (savedProfileImage) setProfileImage(savedProfileImage);
      if (savedUsername) setUsername(savedUsername);
      if (savedEmail) setEmail(savedEmail);

      const requests = [fetchWithTimeout(`${API_URL}/api/reports`)];
      if (userId) {
        requests.push(fetchWithTimeout(`${API_URL}/api/auth/profile/${userId}`));
      }

      const [reportsRes, profileRes] = await Promise.allSettled(requests);

      if (reportsRes.status === 'fulfilled' && reportsRes.value?.ok) {
        const reports = await reportsRes.value.json();
        if (Array.isArray(reports)) {
          setTotalReports(reports.length);
          const now = new Date();
          const monthCount = reports.filter((r) => {
            const d = new Date(r.createdAt || r.date || r.timestamp);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length;
          setThisMonthReports(monthCount);
        }
      }

      if (profileRes?.status === 'fulfilled' && profileRes.value?.ok) {
        const result = await profileRes.value.json();
        if (result?.user) {
          setUsername(result.user.username || savedUsername || '');
          setEmail(result.user.email || savedEmail || '');
          await AsyncStorage.setItem('username', result.user.username || '');
          await AsyncStorage.setItem('userEmail', result.user.email || '');
        }
      }
    } catch (_) {}
  };

  // Load profile image on component mount and when screen comes into focus
  useEffect(() => {
    const ensureCommunityUser = async () => {
      try {
        const userType = await AsyncStorage.getItem('userType');
        if (userType === 'researcher') {
          router.replace('/(tabs)/HomeScreenR');
          return;
        }
      } catch (_) {
        // Allow unauthenticated users to view Home
        return;
      }
    };

    ensureCommunityUser();
    loadDashboardData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const handleLogout = async () => {
    try {
      // Clear all user data from AsyncStorage
      await AsyncStorage.multiRemove(['userId', 'username', 'userEmail', 'isLoggedIn', 'profileImage', 'userType']);
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
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
          <Ionicons name="menu" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Community Portal</Text>
          <Text style={styles.headerSubtitle}>Wildlife Conservation</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/UserProfile')} style={styles.profileButton}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: 32, height: 32, borderRadius: 16 }} />
          ) : (
            <Ionicons name="person-circle-outline" size={32} color="#2d6a4f" />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* Daily Insight Card */}
        <View style={styles.factWrapper}>
          <LinearGradient
            colors={['#1b4332', '#2d6a4f', '#40916c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.factContainer}
          >
            <View style={styles.factNotificationButton}>
              <NotificationBell color="#2d6a4f" size={22} />
            </View>
            <View style={styles.factHeader}>
              <Ionicons name="leaf" size={28} color="#FFD700" />
              <Text style={styles.factBadge}>Fact of the Day</Text>
            </View>
            <Text style={styles.factTitle}>{dailyFact.title}</Text>
            <Text style={styles.factBody}>{dailyFact.text}</Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionCardsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/UploadReport')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="cloud-upload-outline" size={32} color="#ef6c00" />
              </View>
              <Text style={styles.actionCardTitle}>Upload Report</Text>
              <Text style={styles.actionCardSubtitle}>Add New Sighting</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/ReportsFeed')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="document-text-outline" size={32} color="#2d6a4f" />
              </View>
              <Text style={styles.actionCardTitle}>View Reports</Text>
              <Text style={styles.actionCardSubtitle}>Community Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/MapScreen')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#e3f2fd' }]}>
                <MaterialCommunityIcons name="map-marker-radius-outline" size={32} color="#0d47a1" />
              </View>
              <Text style={styles.actionCardTitle}>View Map</Text>
              <Text style={styles.actionCardSubtitle}>Explore Sightings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/NGOListScreen')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#fce4ec' }]}>
                <Ionicons name="people-outline" size={32} color="#ad1457" />
              </View>
              <Text style={styles.actionCardTitle}>NGO List</Text>
              <Text style={styles.actionCardSubtitle}>Emergency Contacts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Analytics Section ── */}
        <View style={styles.analyticsSection}>
          <View style={styles.analyticsTitleRow}>
            <Text style={styles.analyticsTitle}>My Activity</Text>
            <Text style={styles.analyticsSubtitle}>Your conservation impact</Text>
          </View>

          <View style={styles.statCardsRow}>
            <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
              <View style={[styles.statIconCircle, { backgroundColor: '#c8e6c9' }]}>
                <Ionicons name="document-text" size={18} color="#2d6a4f" />
              </View>
              <Text style={[styles.statNumber, { color: '#2d6a4f' }]}>{totalReports}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FFF9C4' }]}>
              <View style={[styles.statIconCircle, { backgroundColor: '#FFECB3' }]}>
                <Ionicons name="calendar" size={18} color="#F9A825" />
              </View>
              <Text style={[styles.statNumber, { color: '#E65100' }]}>{thisMonthReports}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#d8f3dc' }]}
              onPress={() => router.push('/(tabs)/AwardsScreen')}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconCircle, { backgroundColor: '#95d5b2' }]}>
                <Ionicons name="trophy" size={18} color="#1b4332" />
              </View>
              <Text style={[styles.statNumber, { color: '#1b4332' }]}>—</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.analyticsDivider} />

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/ReportsHistory')}
            activeOpacity={0.85}
            style={styles.contributionBanner}
          >
            <View style={styles.contributionLeft}>
              <View style={styles.contributionIconBox}>
                <Ionicons name="trending-up" size={20} color="#B8860B" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.contributionTitle}>My Reports</Text>
                <Text style={styles.contributionSub}>Track your full sighting history</Text>
              </View>
            </View>
            <View style={styles.contributionChevron}>
              <Ionicons name="chevron-forward" size={18} color="#1b4332" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- Bottom Navigation Bar --- */}
      <BottomNav />

      {/* ✅ Sidebar Overlay */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <Animated.View 
            style={[
              styles.overlay,
              {
                opacity: slideAnim.interpolate({
                  inputRange: [-width * 0.75, 0],
                  outputRange: [0, 1],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* ✅ Sidebar Drawer */}
      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarProfile}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.sidebarAvatar} />
            ) : (
              <Ionicons name="person-circle" size={60} color="#2d6a4f" />
            )}
            <Text style={styles.sidebarName}>{username || 'Community User'}</Text>
            <Text style={styles.sidebarEmail}>{email || ''}</Text>
          </View>
        </View>

        <View style={styles.sidebarContent}>
          <TouchableOpacity 
            style={styles.sidebarItem}
            onPress={() => {
              toggleSidebar();
              router.push('/(tabs)/ReportsHistory');
            }}
          >
            <View style={styles.sidebarIconWrapper}>
              <Ionicons name="document-text-outline" size={22} color="#2d6a4f" />
            </View>
            <Text style={styles.sidebarText}>Reports History</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              toggleSidebar();
              router.push('/(tabs)/AwardsScreen');
            }}
          >
            <View style={styles.sidebarIconWrapper}>
              <Ionicons name="trophy-outline" size={22} color="#2d6a4f" />
            </View>
            <Text style={styles.sidebarText}>Awards & Badges</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* ✅ Survey Notifications */}
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              toggleSidebar();
              router.push('/(tabs)/SurveyNotifications');
            }}
          >
            <View style={styles.sidebarIconWrapper}>
              <Ionicons name="notifications-outline" size={22} color="#2d6a4f" />
            </View>
            <Text style={styles.sidebarText}>Survey Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              toggleSidebar();
              router.push('/(tabs)/Aboutus');
            }}
          >
            <View style={styles.sidebarIconWrapper}>
              <Ionicons name="information-circle-outline" size={22} color="#2d6a4f" />
            </View>
            <Text style={styles.sidebarText}>About Us</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.sidebarDivider} />

          <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout}>
            <View style={[styles.sidebarIconWrapper, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="log-out-outline" size={22} color="#c62828" />
            </View>
            <Text style={[styles.sidebarText, { color: '#c62828' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  factContainer: {
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  factNotificationButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  factBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#fff', 
    marginBottom: 8,
  },
  factBody: { 
    fontSize: 14, 
    color: '#e8f5e9', 
    lineHeight: 22,
  },

  uploadSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  uploadTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  addButton: { padding: 5 },

  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: '#666',
  },

  // NGO Card Styles
  ngoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ngoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ngoTextContainer: {
    flex: 1,
  },
  ngoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ngoCardSubtitle: {
    fontSize: 12,
    color: '#666',
  },

  // ── Analytics Section ──
  analyticsSection: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  analyticsTitleRow: {
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  analyticsSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  // Stat Cards
  statCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2d6a4f',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  analyticsDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },

  // Contribution Banner
  contributionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  contributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contributionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFE082',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contributionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b4332',
  },
  contributionSub: {
    fontSize: 11,
    color: '#6d4c41',
    marginTop: 2,
  },
  contributionChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✅ Sidebar styles
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: '#fff',
    elevation: 16,
    zIndex: 10,
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sidebarProfile: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sidebarAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sidebarName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
  },
  sidebarEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 16,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sidebarIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f4f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  sidebarLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});

export default HomeScreen;
