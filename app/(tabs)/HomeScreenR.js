import React, { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
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
import BottomNav from '../../components/BottomNav';

const { width } = Dimensions.get('window');

// ✅ Static facts data
const factsData = [
  {
    title: 'Snow Leopard Conservation',
    text: 'Pakistan hosts one of the most important snow leopard populations in the Himalayas and Karakoram ranges.',
  },
  {
    title: 'Community Research',
    text: 'Researchers and local communities are collaborating to track endangered species across the northern regions.',
  },
  {
    title: 'Bird Migration Study',
    text: 'Over 200 species of migratory birds pass through Pakistan each year, offering rich opportunities for data-driven conservation research.',
  },
  {
    title: 'Habitat Mapping',
    text: 'Research efforts are underway to map and digitally monitor wildlife habitats using drone and satellite data.',
  },
  {
    title: 'Wildlife Awareness',
    text: 'Public education programs are helping reduce human-wildlife conflict and improve species survival rates.',
  },
];

const getDailyFact = () => {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return factsData[dayIndex % factsData.length];
};

const HomeScreenR = () => {
  const router = useRouter();
  const dailyFact = getDailyFact();

  // ✅ Sidebar animation
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? -width * 0.7 : 0,
      duration: 250,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    toggleSidebar();
    router.replace('/(tabs)/Login');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Researcher Home</Text>
        <Ionicons name="person-circle" size={30} color="#000" />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* --- Fact of the Day --- */}
        <View style={styles.factContainer}>
          <Text style={styles.factTitle}>Research Fact of the Day</Text>
          <Text style={styles.factBody}>
            <Text style={{ fontWeight: 'bold' }}>{dailyFact.title}</Text> {dailyFact.text}
          </Text>
        </View>

        {/* --- View Reports --- */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Analyze Reports</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/ReportsFeed')}
            style={styles.addButton}
          >
            <Ionicons name="analytics" size={36} color="#000" />
          </TouchableOpacity>
        </View>

        {/* --- Research Tools --- */}
        <View style={styles.reportButtonsContainer}>
          <TouchableOpacity
            style={styles.reportCard}
            onPress={() => console.log('Open Research Map')}
          >
            <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="map-search-outline" size={80} color="#524b4bff" />
            </View>
            <Text style={styles.cardText}>Research Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportCard}
            onPress={() => router.push('/(tabs)/ReportsHistory')}
          >
            <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="file-document" size={80} color="#524b4bff" />
            </View>
            <Text style={styles.cardText}>All Reports</Text>
          </TouchableOpacity>
        </View>

        {/* --- Research Dashboard --- */}
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsTitle}>Research Dashboard</Text>
          <Text style={styles.analyticsLabel}>
            Monitor community reports, verify wildlife sightings, and update conservation data.
          </Text>

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.viewReportsButton}
              onPress={() => router.push('/(tabs)/ReportsHistory')}
            >
              <Ionicons name="checkmark-done-outline" size={20} color="black" />
              <Text style={styles.viewReportsButtonText}>Verify Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- Bottom Navigation Bar --- */}
      <BottomNav />

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar Drawer */}
      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        <Text style={styles.sidebarHeader}>Menu</Text>

        <TouchableOpacity style={styles.sidebarItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => router.push('/(tabs)/ReportsHistory')}
        >
          <Ionicons name="document-text-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Reports Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => console.log('Research Support')}
        >
          <Ionicons name="help-circle-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Research Support</Text>
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
    backgroundColor: '#264653',
    padding: 20,
  },
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
  analyticsLabel: { fontSize: 15, color: '#555' },

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

export default HomeScreenR;
