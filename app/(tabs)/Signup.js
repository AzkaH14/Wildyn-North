import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.18.25:5000'; // Update with your backend IP

const Signup = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [userType, setUserType] = useState('community');
  const [educationData, setEducationData] = useState(null);

  // Check if user is a researcher and load education data
  useEffect(() => {
    const checkUserType = async () => {
      const storedUserType = await AsyncStorage.getItem('userType');
      const storedEducationData = await AsyncStorage.getItem('researcherEducationData');
      
      if (storedUserType === 'researcher' && storedEducationData) {
        setUserType('researcher');
        setEducationData(JSON.parse(storedEducationData));
      }
    };
    checkUserType();
  }, []);

  // Prevent back navigation on this screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  // Password validation function
  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (pwd.length > 50) {
      return 'Password must not exceed 50 characters';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)';
    }
    return '';
  };

  // Username validation
  const validateUsername = (uname) => {
    if (!uname.trim()) {
      return 'Username is required';
    }
    if (uname.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (uname.trim().length > 20) {
      return 'Username must not exceed 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(uname.trim())) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  // Email validation
  const validateEmail = (eml) => {
    if (!eml.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eml)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleSignup = async () => {
    // Clear previous errors
    setPasswordError('');
    setUsernameError('');
    setEmailError('');

    // Validate all fields
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (usernameValidation) {
      setUsernameError(usernameValidation);
      Alert.alert('Validation Error', usernameValidation);
      return;
    }

    if (emailValidation) {
      setEmailError(emailValidation);
      Alert.alert('Validation Error', emailValidation);
      return;
    }

    if (passwordValidation) {
      setPasswordError(passwordValidation);
      Alert.alert('Validation Error', passwordValidation);
      return;
    }

    setLoading(true);
    try {
      // Determine which endpoint to use
      const endpoint = userType === 'researcher' 
        ? `${API_URL}/api/auth/researcher/signup`
        : `${API_URL}/api/auth/signup`;

      console.log('Attempting to signup with:', { 
        username: username.trim(), 
        email: email.trim().toLowerCase(),
        userType: userType,
        apiUrl: endpoint
      });

      const requestBody = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      };

      // Add education data if researcher
      if (userType === 'researcher') {
        if (!educationData) {
          Alert.alert('Error', 'Education data is missing. Please go back and fill in your education details.');
          setLoading(false);
          return;
        }
        requestBody.education = educationData;
        console.log('Sending researcher signup with education data:', educationData);
      }

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      let result;
      const contentType = response.headers.get('content-type') || '';
      
      // Try to parse as JSON first
      try {
        const text = await response.text();
        if (contentType.includes('application/json') || text.trim().startsWith('{')) {
          result = JSON.parse(text);
        } else {
          console.error('Non-JSON response received:', {
            status: response.status,
            contentType: contentType,
            preview: text.substring(0, 200)
          });
          // Try to extract error message from HTML if possible
          const errorMatch = text.match(/<title>(.*?)<\/title>/i) || text.match(/Error[:\s]+(.*?)(?:\n|<)/i);
          const errorMsg = errorMatch ? errorMatch[1] : 'Server returned an error page instead of JSON';
          throw new Error(`Server error: ${errorMsg}. Status: ${response.status}`);
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error(`Failed to parse server response. Status: ${response.status}`);
      }

      console.log('Response result:', result);

      if (response.ok) {
        // Store user data in AsyncStorage
        await AsyncStorage.setItem('userId', result.user._id);
        await AsyncStorage.setItem('username', result.user.username);
        await AsyncStorage.setItem('userEmail', result.user.email);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userType', result.user.userType || 'community');
        
        // Clear temporary education data
        if (userType === 'researcher') {
          await AsyncStorage.removeItem('researcherEducationData');
        }

        // Navigate based on user type
        const redirectScreen = userType === 'researcher' 
          ? '/(tabs)/HomeScreenR' 
          : '/(tabs)/HomeScreen';

        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace(redirectScreen),
          },
        ]);
      } else {
        // Handle specific error messages from backend
        const errorMessage = result.message || result.error || 'Failed to create account. Please try again.';
        
        if (errorMessage.toLowerCase().includes('username')) {
          setUsernameError(errorMessage);
        } else if (errorMessage.toLowerCase().includes('email')) {
          setEmailError(errorMessage);
        } else {
          setPasswordError(errorMessage);
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Signup error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        apiUrl: `${API_URL}/api/auth/signup`
      });
      
      let errorMessage = 'Could not connect to server. ';
      
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        errorMessage += 'Please check:\n1. Backend server is running\n2. IP address is correct\n3. Both devices are on the same network\n4. Firewall is not blocking the connection';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. The server may be slow or unreachable.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareContainer>
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        {userType === 'researcher' ? 'Create Researcher Account' : 'Create your account'}
      </Text>

      <View style={styles.formContainer}>
        <TextInput
          style={[styles.input, usernameError && styles.inputError]}
          placeholder="Enter Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setUsernameError('');
          }}
          autoCapitalize="none"
        />
        {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="Enter Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Enter Password "
          placeholderTextColor="#999"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
          }}
          secureTextEntry
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        {!passwordError && password.length > 0 && (
          <Text style={styles.helperText}>
            Password must be 8-50 characters with at least one special character
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.signInButton, loading && styles.signInButtonDisabled]}
        activeOpacity={0.9}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.signInButtonText}>SIGN IN</Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/Login')}>
          <Text style={styles.loginLink}>login</Text>
        </TouchableOpacity>
      </View>
    </View>
    </KeyboardAwareContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  logo: {
    width: 280,
    height: 280,
  },
  title: {
    fontSize: 16,
    color: '#000',
    marginBottom: 50,
  },
  formContainer: {
    width: '95%',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#000',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#F4D03F',
    width: '95%',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#000',
  },
  loginLink: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    marginLeft: 5,
  },
  helperText: {
    color: '#999',
    fontSize: 11,
    marginTop: -15,
    marginBottom: 10,
    marginLeft: 5,
  },
});

export default Signup;

