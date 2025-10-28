import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../../components/BottomNav';

const { width } = Dimensions.get('window');
const offensiveWords = ['badword', 'offensive', 'ugly'];

const ReportFeed = () => {
  const router = useRouter();
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reports from backend
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // TODO: Replace with your actual backend URL
      // For development: http://localhost:5000
      // For testing on device: http://YOUR_COMPUTER_IP:5000
      const API_URL = 'http://172.21.245.212:5000'; // Replace with your computer's IP
      
      const response = await fetch(`${API_URL}/api/reports`);
      const data = await response.json();
      
      if (response.ok) {
        setReportsList(data);
      } else {
        console.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [searchText, setSearchText] = useState('');

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
    console.log('Logout clicked');
    toggleSidebar();
  };

  const handleAddComment = () => {
    const lower = newComment.toLowerCase();
    const found = offensiveWords.some((word) => lower.includes(word));
    if (found) {
      Alert.alert('Comment Rejected', 'Your comment contains offensive language.');
      return;
    }
    if (newComment.trim() === '') return;

    const commentObj = {
      id: Date.now().toString(),
      text: newComment,
      user: 'Community User',
      time: new Date().toLocaleString(),
    };

    setComments([commentObj, ...comments]);
    setNewComment('');
  };

  const filteredReports = useMemo(() => {
    if (!reportsList.length) return [];
    if (!searchText.trim()) return reportsList;
    return reportsList.filter((r) =>
      r.specieName?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [reportsList, searchText]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading reports...</Text>
        <BottomNav onHomePress={() => router.push('/(tabs)/HomeScreen')} />
      </View>
    );
  }

  if (!reportsList.length) {
    return (
      <View style={styles.centered}>
        <Text>No reports found.</Text>
        <Text style={{ marginTop: 10, color: '#888' }}>Upload a report to get started!</Text>
        <BottomNav onHomePress={() => router.push('/(tabs)/HomeScreen')} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* ✅ Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Reports</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* ✅ Sidebar Overlay */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* ✅ Sidebar sliding menu */}
      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        <Text style={styles.sidebarTitle}>Menu</Text>
        <TouchableOpacity style={styles.sidebarItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/(tabs)/ReportsFeed')}>
          <Ionicons name="document-text-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>My Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => console.log('Support')}>
          <Ionicons name="help-circle-outline" size={22} color="#000" />
          <Text style={styles.sidebarText}>Support</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ✅ Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search animal species..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* ✅ Feed section */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={filteredReports}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchReports} />
          }
          keyExtractor={(item, index) => {
            // MongoDB returns _id, but also check for other possible id fields
            return item._id?.toString() || item.id?.toString() || index.toString();
          }}
          renderItem={({ item }) => (
            <View>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                  style={styles.profilePic}
                />
                <View style={styles.userText}>
                  <Text style={styles.username}>{item.username || 'Unknown User'}</Text>
                  {item.location && (
                    <Text style={styles.location}>
                      📍 {item.location.latitude.toFixed(5)}, {item.location.longitude.toFixed(5)}
                    </Text>
                  )}
                  <Text style={styles.time}>🕒 {item.timestamp}</Text>
                </View>
              </View>

              {item.image && <Image source={{ uri: item.image }} style={styles.image} />}

              <View style={styles.caption}>
                <Text style={styles.captionText}>
                  <Text style={styles.bold}>{item.specieName}</Text> • {item.healthStatus}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            <>
              <Text style={styles.commentTitle}>Comments</Text>
              <View style={styles.commentBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {comments.map((item) => (
                <View style={styles.commentItem} key={item.id}>
                  <Ionicons name="person-circle-outline" size={28} color="#555" />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUser}>{item.user}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </>
          }
          contentContainerStyle={{ paddingBottom: 70 }}
        />
      </KeyboardAvoidingView>

      {/* ✅ Bottom navigation (Home navigates properly) */}
      <BottomNav onHomePress={() => router.push('/(tabs)/HomeScreen')} /> 
      {/* ✅ Adjust path if needed */}
    </View>
  );
};

export default ReportFeed;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    marginLeft: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 10,
  },
  userText: {
    flexDirection: 'column',
  },
  username: {
    fontWeight: '700',
    fontSize: 16,
  },
  location: {
    fontSize: 13,
    color: '#888',
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#ddd',
  },
  caption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  captionText: {
    fontSize: 15,
  },
  bold: {
    fontWeight: '700',
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 15,
    marginHorizontal: 15,
  },
  commentBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 15,
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sendButton: {
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 20,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  commentContent: {
    marginLeft: 10,
    flex: 1,
  },
  commentUser: {
    fontWeight: '700',
  },
  commentText: {
    fontSize: 14,
    marginTop: 2,
  },
  commentTime: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sidebarText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
});
