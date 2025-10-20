import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../../components/BottomNav';
import { useRouter } from 'expo-router';

const offensiveWords = ['badword', 'offensive', 'ugly'];

const ReportFeed = () => {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const reports = data ? JSON.parse(data) : null;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [searchText, setSearchText] = useState('');

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
    if (!reports) return [];
    if (!searchText.trim()) return Array.isArray(reports) ? reports : [reports];
    return (Array.isArray(reports) ? reports : [reports]).filter((r) =>
      r.specieName?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [reports, searchText]);

  if (!reports) {
    return (
      <View style={styles.centered}>
        <Text>No report data found.</Text>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => Alert.alert('Menu clicked')}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Reports</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search animal species..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <View>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                  style={styles.profilePic}
                />
                <View style={styles.userText}>
                  <Text style={styles.username}>Username</Text>
                  {item.location && (
                    <Text style={styles.location}>
                      {item.location.latitude.toFixed(5)}, {item.location.longitude.toFixed(5)}
                    </Text>
                  )}
                  <Text style={styles.time}>{item.timestamp}</Text>
                </View>
              </View>

              <Image source={{ uri: item.image }} style={styles.image} />

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

      <BottomNav />
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
});
