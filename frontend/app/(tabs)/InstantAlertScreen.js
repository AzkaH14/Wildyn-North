import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet,
  Animated, ActivityIndicator, Dimensions,
  TouchableOpacity, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../../assets/components/BottomNav';
import { useRouter } from 'expo-router';
import { API_URL } from '../../constants/api';

// ─── Config ───────────────────────────────────────────────────────────────
const ALERT_RADIUS_KM = 15;
const RAWALPINDI_COORDS = { latitude: 33.5651, longitude: 73.0169 };
const USE_TEST_LOCATION = true;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Distance + Bearing ───────────────────────────────────────────────────
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getBearingDegrees = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const lambdaDiff = toRad(lon2 - lon1);
  const y = Math.sin(lambdaDiff) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambdaDiff);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

// ─── Radar Ring ───────────────────────────────────────────────────────────
const RadarRing = ({ delay, color }) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 170,
        height: 170,
        borderRadius: 85,
        borderWidth: 2,
        borderColor: color,
        opacity,
        transform: [{ scale }],
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 10,
      }}
    />
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────
const InstantAlertScreen = () => {
  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    let coords;

    if (USE_TEST_LOCATION) {
      coords = RAWALPINDI_COORDS;
      setLocation(coords);
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        coords = loc.coords;
        setLocation(coords);
      }
    }

    try {
      const res = await fetch(`${API_URL}/api/reports`);
      if (!res.ok) throw new Error(`reports fetch failed: ${res.status}`);
      const data = await res.json();
      const reports = Array.isArray(data) ? data : [];

      const normalizedAlerts = reports
        .map((report, index) => {
          const lat = Number(report?.location?.latitude);
          const lon = Number(report?.location?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

          return {
            id: report?._id || report?.id || `report-${index}`,
            lat,
            lon,
            species: report?.specieName || report?.species || 'Unknown species',
          };
        })
        .filter(Boolean);

      setAlerts(normalizedAlerts);
    } catch (_) {
      // Keep previous fallback behavior if reports are unavailable.
      setAlerts([
        { id: 1, lat: 33.60, lon: 73.05, species: 'Unknown species' },
        { id: 2, lat: 33.55, lon: 73.00, species: 'Unknown species' },
      ]);
    }

    setLoading(false);
  };

  const centerLat = location?.latitude ?? RAWALPINDI_COORDS.latitude;
  const centerLon = location?.longitude ?? RAWALPINDI_COORDS.longitude;
  const nearbyAlerts = alerts.filter(
    (a) => getDistanceKm(centerLat, centerLon, a.lat, a.lon) <= ALERT_RADIUS_KM
  );
  const nearbyDetections = nearbyAlerts
    .map((a) => ({
      id: a.id,
      species: a.species || 'Unknown species',
      distanceKm: getDistanceKm(centerLat, centerLon, a.lat, a.lon),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/HomeScreen')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Alerts</Text>
        </View>

        {/* ── RADAR ── */}
        <View style={styles.radarContainer}>
          <View style={styles.radarBg}>
            <View style={styles.radarRing3} />
            <View style={styles.radarRing2} />
            <View style={styles.radarRing1} />

            <RadarRing delay={0} color="#9EDBA1" />
            <RadarRing delay={800} color="#E5FFE5" />
            <RadarRing delay={1600} color="#76FF03" />

            <View style={styles.radarCenter}>
              <Ionicons name="location" size={24} color="#fff" />
            </View>

            {alerts.map((a) => {
              const distance = getDistanceKm(centerLat, centerLon, a.lat, a.lon);
              if (distance > ALERT_RADIUS_KM) return null;

              const bearing = getBearingDegrees(centerLat, centerLon, a.lat, a.lon);
              const radiusPx = (distance / ALERT_RADIUS_KM) * 120;

              const x = Math.sin((bearing * Math.PI) / 180) * radiusPx;
              const y = -Math.cos((bearing * Math.PI) / 180) * radiusPx;

              return (
                <View
                  key={a.id}
                  style={[
                    styles.radarDot,
                    { transform: [{ translateX: x }, { translateY: y }] },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* ── WHITE FULL SECTION ── */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>🛰️ Live Radar</Text>
          <Text style={styles.subtitle}>Scanning wilderness in real time</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#2E7D32" />
          ) : location && (
            <Text style={styles.locationText}>
              {location.latitude.toFixed(3)}°N, {location.longitude.toFixed(3)}°E
            </Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{nearbyAlerts.length}</Text>
              <Text style={styles.statLabel}>Nearby</Text>
            </View>

            <Text style={styles.lineSeparator}>|</Text>

            <View style={styles.stat}>
              <Text style={styles.statNum}>{ALERT_RADIUS_KM} km</Text>
              <Text style={styles.statLabel}>Radius</Text>
            </View>
          </View>

          <View style={styles.speciesSection}>
            <Text style={styles.speciesHeading}>Detected Species Nearby</Text>
            {nearbyDetections.length > 0 ? (
              <View style={styles.speciesList}>
                {nearbyDetections.map((item) => (
                  <View key={item.id} style={styles.speciesCard}>
                    
                    <Text style={styles.speciesCardText}>{item.species}</Text>
                    <Text style={styles.speciesDistance}>{item.distanceKm.toFixed(1)} km</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noSpeciesText}>No species detected in current 15 km radius.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <BottomNav active="Alerts" />
    </SafeAreaView>
  );
};

export default InstantAlertScreen;

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },

  scrollContainer: {
    flexGrow: 1,
  },

  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  backButton: {
    position: 'absolute',
    left: 20,
    top: 18,
  },

  radarContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radarBg: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radarRing3: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    borderColor: '#3EBD42',
    opacity: 0.3,
  },
  radarRing2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: '#3EBD42',
    opacity: 0.5,
  },
  radarRing1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#76FF03',
    opacity: 0.7,
  },

  radarCenter: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radarDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF1744',
  },

  infoSection: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },

  locationText: {
    textAlign: 'center',
    color: '#2E7D32',
    marginBottom: 10,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  stat: {
    alignItems: 'center',
  },

  statNum: {
    fontSize: 18,
    fontWeight: '800',
  },

  statLabel: {
    fontSize: 10,
    color: '#666',
  },

  lineSeparator: {
    fontSize: 18,
    color: '#999',
    paddingHorizontal: 10,
  },
  speciesSection: {
    marginTop: 40,
  },
  speciesHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  speciesList: {
    gap: 8,
  },
  speciesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  speciesDistance: {
    fontSize: 12,
    color: 'black',
    fontWeight: '800',
  },
  speciesCardText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    textAlign: 'left',
  },
  noSpeciesText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#777',
  },
});
