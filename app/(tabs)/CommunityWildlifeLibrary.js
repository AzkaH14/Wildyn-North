
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../components/BottomNav';

// Card Component (no delete button here)
const SpeciesCard = ({ species, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: species.imageUri || 'https://via.placeholder.com/400x300' }}
        style={styles.image}
      />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{species.commonName}</Text>
        {species.scientificName && <Text style={styles.scientificName}>{species.scientificName}</Text>}
        {species.urduName && <Text style={styles.urduName}>{species.urduName}</Text>}
        {species.conservationStatus && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{species.conservationStatus}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function CommunityWildlifeLibrary() {
  const router = useRouter();
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadWildlifeData = async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem('wildlifeCards');
      if (data) {
        const wildlifeCards = JSON.parse(data);
        setFacts(wildlifeCards);
      } else {
        setFacts([]);
      }
    } catch (error) {
      console.error('Error loading wildlife data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadWildlifeData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadWildlifeData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/CommunityDashboard')}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wildlife Library</Text>
          <View style={{ width: 40 }} /> {/* Empty space to balance header */}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : facts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>No Wildlife Data Found</Text>
              <Text style={styles.emptyText}>Researchers haven’t added any species yet.</Text>
            </View>
          ) : (
            facts.map((item) => (
              <SpeciesCard
                key={item._id}
                species={item}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/speciedetial',
                    params: { species: JSON.stringify(item) },
                  })
                }
              />
            ))
          )}
        </ScrollView>

        <BottomNav onHomePress={() => router.push('/(tabs)/HomeScreen')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f2f2' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  content: { padding: 15 },
  image: { width: '100%', height: 200, borderRadius: 8 },
  card: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, elevation: 2 },
  cardContent: { padding: 12 },
  name: { fontSize: 18, fontWeight: 'bold' },
  scientificName: { fontStyle: 'italic', color: '#555' },
  urduName: { fontSize: 16, color: '#333' },
  statusBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptyText: { color: '#666', marginTop: 8, textAlign: 'center' },
});
