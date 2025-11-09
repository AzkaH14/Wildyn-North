import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const WildlifeScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleGetStarted = () => {
    router.replace('/(tabs)/SignInAs');
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/deer.png')}
        style={styles.backgroundImage}
        resizeMode="contain"
      />
      
      <View style={styles.gradientOverlay} />
      
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/white_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Spot, Report, Protect</Text>
          <Text style={styles.department}>Together we can safeguard wildlife!</Text>
        </View>

        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>Start</Text>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
  },
  backgroundImage: {
    width: width,
    marginTop: 30,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: height * 0.25,
    paddingBottom: 60,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
  },
  logo: {
    width: 75,
    height: 75,
    marginBottom: 20,
    marginTop: -40,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  department: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 4,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  nextButton: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#efcc1bff',
    letterSpacing: 2,
  },
 
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD500',
    marginRight: 6,
  },
});

export default WildlifeScreen