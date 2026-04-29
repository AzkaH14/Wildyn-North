
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const MapScreen = () => {
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const API_URL = "http://192.168.100.2:5000";

  // ✅ FIXED: stable fetch function (prevents focus warning issues)
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/reports`);
      const data = await res.json();

      setReports(data || []);
      setFilteredReports(data || []);
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIXED: refresh every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  // FILTER LOGIC
  useEffect(() => {
    let data = reports;

    // species filter
    if (selectedSpecies !== 'All') {
      data = data.filter(
        r => (r.specieName || '') === selectedSpecies
      );
    }

    // search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();

      data = data.filter(r => {
        const species = (r.specieName || '').toLowerCase();
        const area = (r.areaName || '').toLowerCase();

        return species.includes(q) || area.includes(q);
      });
    }

    setFilteredReports(data);
  }, [selectedSpecies, searchQuery, reports]);

  // species list
  const speciesList = [
    'All',
    ...new Set(reports.map(r => r.specieName).filter(Boolean)),
  ];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/HomeScreen')}
          style={styles.menuButton}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wildlife Map</Text>
          <Text style={styles.headerSubtitle}>Hotspot Explorer</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* SEARCH */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search species or area..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#888"
        />
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        <MapView
         provider="google"
          style={styles.map}
          initialRegion={{
            latitude: 33.6844,
            longitude: 73.0479,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }}
           language="en"
        >
          {filteredReports.map((report) => {
            const lat = Number(report?.location?.latitude);
            const lng = Number(report?.location?.longitude);

            // ✅ FIX: skip invalid coordinates
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker
                key={report._id}
                coordinate={{
                  latitude: lat,
                  longitude: lng,
                }}
                pinColor={
                  selectedReport?._id === report._id ? 'green' : 'red'
                }
                onPress={() => setSelectedReport(report)}
              />
            );
          })}
        </MapView>
      </View>

      {/* BOTTOM CARD */}
      {selectedReport && (
        <View style={styles.bottomCard}>

          <TouchableOpacity
            style={styles.closeIcon}
            onPress={() => setSelectedReport(null)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {selectedReport.specieName}
          </Text>

          <Text style={styles.area}>
            📍 {selectedReport.areaName}
          </Text>

          <Text style={styles.status}>
            Status: {selectedReport.healthStatus}
          </Text>

        </View>
      )}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    marginTop: 27,
  },

  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  headerCenter: { flex: 1, alignItems: 'center' },

  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },

  headerSubtitle: { fontSize: 12, color: '#777', marginTop: 2 },

  searchBar: { paddingHorizontal: 10, paddingTop: 10 },

  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  mapContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginTop: 5,
  },

  map: { flex: 1 },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomCard: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 5,
  },

  title: { fontWeight: 'bold', fontSize: 16 },

  area: { color: '#666', marginBottom: 5 },

  status: { color: '#444' },

  closeIcon: {
    position: 'absolute',
    right: 10,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
});