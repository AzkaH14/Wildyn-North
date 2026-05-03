import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SignInAs = () => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const clearStoredData = async () => {
      console.log('SignInAs screen loaded');
    };
    clearStoredData();
  }, []);

  return (
    <View style={styles.container}>

      {/* Top section: logo + title */}
      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.signInText}>Sign in as</Text>
      </View>

      {/* Middle section: role cards */}
      <View style={styles.middleSection}>
        <View style={styles.cardsContainer}>
          {/* Researcher Card */}
          <TouchableOpacity
            style={[
              styles.card,
              styles.communityCard,
              selectedRole === 'researcher' && styles.cardSelected,
            ]}
            onPress={() => setSelectedRole('researcher')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <View style={styles.iconHead} />
              <View style={[styles.iconBody, styles.communityIconBody]} />
            </View>
            <Text style={styles.cardLabel}>Researcher</Text>
          </TouchableOpacity>

          {/* Community Card */}
          <TouchableOpacity
            style={[
              styles.card,
              styles.individualCard,
              selectedRole === 'community' && styles.cardSelected,
            ]}
            onPress={() => setSelectedRole('community')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <View style={[styles.iconHead, styles.individualIconHead]} />
              <View style={[styles.iconBody, styles.individualIconBody]} />
            </View>
            <Text style={styles.cardLabel}>Community</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom section: next button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedRole && styles.nextButtonDisabled,
          ]}
          activeOpacity={0.9}
          onPress={async () => {
            if (selectedRole === 'researcher') {
              await AsyncStorage.setItem('selectedUserType', 'researcher');

              const [storedUserType, storedEducationDraft, isLoggedIn] = await Promise.all([
                AsyncStorage.getItem('userType'),
                AsyncStorage.getItem('researcherEducationData'),
                AsyncStorage.getItem('isLoggedIn'),
              ]);

              await AsyncStorage.removeItem('userType');

              if (isLoggedIn === 'true' && storedUserType === 'researcher') {
                router.replace('/(tabs)/HomeScreenR');
                return;
              }

              if (storedUserType === 'researcher' && !storedEducationDraft) {
                router.replace('/(tabs)/Login');
                return;
              }

              router.push('/(tabs)/EducationScreen');
            } else if (selectedRole === 'community') {
              await AsyncStorage.removeItem('userType');
              await AsyncStorage.removeItem('researcherEducationData');
              await AsyncStorage.setItem('selectedUserType', 'community');
              router.push('/(tabs)/Signup');
            }
          }}
          disabled={!selectedRole}
        >
          <Text style={[
            styles.nextButtonText,
            !selectedRole && styles.nextButtonTextDisabled,
          ]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const CARD_WIDTH = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },

  /* ── Top ── */
  topSection: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 70,
    marginBottom: 0,
    marginLeft:28
  },
  logo: {
    width: 280,
    height: 280,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '450',
    color: '#000',
    textAlign: 'center',
    marginBottom: -5,
   
  },

  /* ── Middle ── */
  middleSection: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: -20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.9,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  communityCard: {
    backgroundColor: '#A8D5BA',
  },
  individualCard: {
    backgroundColor: '#F9ED99',
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },

  /* Icon inside cards */
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconHead: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2D7A4F',
  },
  individualIconHead: {
    backgroundColor: '#D4AF37',
  },
  iconBody: {
    width: 52,
    height: 40,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  communityIconBody: {
    backgroundColor: '#2D7A4F',
  },
  individualIconBody: {
    backgroundColor: '#D4AF37',
  },
  cardLabel: {
    marginTop: 12,
    fontSize: 15,
    color: '#000',
    fontWeight: '700',
    textAlign: 'center',
  },

  /* ── Bottom ── */
  bottomSection: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  nextButton: {
    backgroundColor: '#F4D03F',
    width: '100%',
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  nextButtonTextDisabled: {
    color: '#999',
  },
});

export default SignInAs;
