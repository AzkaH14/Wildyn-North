import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  StyleSheet 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const healthOptions = ['Healthy', 'Injured', 'Sick', 'Hungry'];

const UploadReport = () => {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [specieName, setSpecieName] = useState('');
  const [selectedHealth, setSelectedHealth] = useState(null);
  const [location, setLocation] = useState(null);
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setTimestamp(new Date().toLocaleString());
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Please enable camera permission in settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const identifySpecie = async () => {
    if (!image) {
      Alert.alert('No image selected', 'Please select or take a photo first.');
      return;
    }
    setSpecieName('Identified Specie Name');
  };

  const handleUpload = () => {
    if (!image || !specieName || !selectedHealth) {
      Alert.alert('Incomplete', 'Please fill all required fields.');
      return;
    }

    const reportData = {
      image,
      specieName,
      healthStatus: selectedHealth,
      location,
      timestamp,
    };

    Alert.alert('Confirm Upload', 'Are you sure you want to upload this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Upload',
        onPress: () => {
          router.push({
            pathname: '/ReportsFeed',
            params: { data: JSON.stringify(reportData) },
          });
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Report</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Image Picker Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Upload Picture/Video</Text>
        <View style={styles.imageOptions}>
          <TouchableOpacity style={styles.optionButton} onPress={pickFromCamera}>
            <Ionicons name="camera" size={24} color="#000" />
            <Text style={styles.optionText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#000" />
            <Text style={styles.optionText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        {image && <Image source={{ uri: image }} style={styles.previewImage} />}
      </View>

      {/* Specie Name + AI */}
      <View style={styles.section}>
        <Text style={styles.label}>Specie Name</Text>
        <View style={styles.specieRow}>
          <TextInput
            placeholder="Enter specie name"
            style={styles.input}
            value={specieName}
            onChangeText={setSpecieName}
          />
          <TouchableOpacity onPress={identifySpecie} style={styles.aiButton}>
            <Ionicons name="scan" size={22} color="#000" />
            <Text style={styles.aiText}>AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Health Status */}
      <View style={styles.section}>
        <Text style={styles.label}>Health Status</Text>
        <View style={styles.radioContainer}>
          {healthOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.radioOption}
              onPress={() => setSelectedHealth(option)}
            >
              <View
                style={[
                  styles.radioCircle,
                  selectedHealth === option && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioLabel}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Location + Time */}
      {location && (
        <View style={styles.section}>
          <Text style={styles.label}>Location & Time</Text>
          <Text style={styles.infoText}>
            📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Text>
          <Text style={styles.infoText}>🕒 {timestamp}</Text>
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.uploadButtonText}>Upload Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UploadReport;

// ✅ Add styles here
const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    elevation: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    alignItems: 'center',
    padding: 10,
    flex: 1,
  },
  optionText: {
    marginTop: 4,
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
  specieRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiText: {
    marginLeft: 5,
    fontWeight: '600',
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%', // 2 on top, 2 below
    marginVertical: 4,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#8f8d8dff',
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: '#a7a7a7ff',
    borderColor: '#555',
  },
  radioLabel: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    marginTop: 4,
  },
  uploadButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
