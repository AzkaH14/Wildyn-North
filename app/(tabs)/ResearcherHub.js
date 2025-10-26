import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ResearcherHub() {
  const navigation = useNavigation();
  const slideAnim = new Animated.Value(-400);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <Text style={styles.header}>Researcher’s Panel</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CreateSurvey')}>
        <Text style={styles.buttonText}>📝 Create a New Survey</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('WildlifeLibrary')}>
        <Text style={styles.buttonText}>📚 Wildlife Library</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CreateWildlifeFact')}>
        <Text style={styles.buttonText}>🦌 Add Wildlife Fact</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5fff5' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  button: { backgroundColor: '#406040', padding: 15, borderRadius: 10, marginVertical: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18 },
});
