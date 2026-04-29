import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../assets/components/BottomNav';

const API_URL = 'https://portaled-blair-inkiest.ngrok-free.dev';

export default function ResearcherHub() {
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [loadingSurveys, setLoadingSurveys] = useState(true);

  useEffect(() => { fetchMySurveys(); }, []);

  const fetchMySurveys = async () => {
    try {
      const researcherId = await AsyncStorage.getItem('userId');
      if (!researcherId) return;
      const res = await fetch(`${API_URL}/api/surveys/researcher/${researcherId}`);
      const data = await res.json();
      if (res.ok) setSurveys(data);
    } catch (e) {
      console.log('Survey fetch error:', e.message);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const handlePublishToggle = async (survey) => {
    if (survey.status === 'published') return;
    try {
      const res = await fetch(`${API_URL}/api/surveys/${survey._id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setSurveys(prev => prev.map(s => s._id === survey._id ? { ...s, status: 'published' } : s));
      }
    } catch (e) {
      console.log('Publish error:', e.message);
    }
  };

  const handleDelete = async (surveyId) => {
    try {
      await fetch(`${API_URL}/api/surveys/${surveyId}`, { method: 'DELETE' });
      setSurveys(prev => prev.filter(s => s._id !== surveyId));
    } catch (e) {
      console.log('Delete error:', e.message);
    }
  };

  const liveSurveys = surveys.filter(s => s.status === 'published');
  const draftSurveys = surveys.filter(s => s.status === 'draft');

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreenR')} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a"/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Researcher's Hub</Text>
        <View style={{ width: 40 }}/>
      </View>

      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.introSub}>Manage surveys and wildlife data</Text>

        {/* Quick Action Cards */}
        <View style={s.cardsContainer}>
          <TouchableOpacity style={s.card} onPress={() => router.push('/(tabs)/createcard')} activeOpacity={0.7}>
            <View style={[s.cardIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="pencil" size={32} color="#ef6c00"/>
            </View>
            <Text style={s.cardTitle}>Create Species Fact</Text>
            <Text style={s.cardDesc}>Add new wildlife species to the database</Text>
            <View style={s.cardAction}>
              <Text style={s.cardActionTxt}>Get Started</Text>
              <Ionicons name="arrow-forward" size={16} color="#2d6a4f"/>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.card} onPress={() => router.push('/(tabs)/WildlifeLibrary')} activeOpacity={0.7}>
            <View style={[s.cardIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="library" size={32} color="#1565c0"/>
            </View>
            <Text style={s.cardTitle}>Wildlife Library</Text>
            <Text style={s.cardDesc}>Browse comprehensive wildlife database</Text>
            <View style={s.cardAction}>
              <Text style={s.cardActionTxt}>Explore</Text>
              <Ionicons name="arrow-forward" size={16} color="#2d6a4f"/>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.card} onPress={() => router.push('/(tabs)/CreateSurvey')} activeOpacity={0.7}>
            <View style={[s.cardIcon, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="cloud-upload" size={32} color="#2d6a4f"/>
            </View>
            <Text style={s.cardTitle}>Create Survey</Text>
            <Text style={s.cardDesc}>Build and publish surveys to collect field data from users</Text>
            <View style={s.cardAction}>
              <Text style={s.cardActionTxt}>Create New</Text>
              <Ionicons name="arrow-forward" size={16} color="#2d6a4f"/>
            </View>
          </TouchableOpacity>
        </View>

        {/* My Surveys Section */}
        <View style={s.surveySection}>
          <View style={s.secHeader}>
            <Text style={s.secTitle}>My Surveys</Text>
            <TouchableOpacity onPress={fetchMySurveys}>
              <Ionicons name="refresh" size={20} color="#2d6a4f"/>
            </TouchableOpacity>
          </View>

          {loadingSurveys && (
            <View style={s.loadRow}><ActivityIndicator size="small" color="#2d6a4f"/>
              <Text style={s.loadTxt}>Loading surveys...</Text>
            </View>
          )}

          {!loadingSurveys && surveys.length === 0 && (
            <View style={s.emptyBox}>
              <Ionicons name="document-text-outline" size={40} color="#d1d5db"/>
              <Text style={s.emptyTxt}>No surveys yet. Create your first survey!</Text>
            </View>
          )}

          {/* Live Surveys */}
          {liveSurveys.length > 0 && (
            <>
              <Text style={s.subLabel}>
                <View style={s.dot}/> Published ({liveSurveys.length})
              </Text>
              {liveSurveys.map((survey) => (
                <View key={survey._id} style={[s.surveyCard, s.surveyCardLive]}>
                  <View style={s.surveyTop}>
                    <View style={{flex:1}}>
                      <Text style={s.surveyTitle}>{survey.title}</Text>
                      {survey.targetSpecies?.length > 0 && (
                        <Text style={s.surveyMeta}>{survey.targetSpecies.join(' · ')}</Text>
                      )}
                      {survey.region && <Text style={s.surveyRegion}>{survey.region}</Text>}
                    </View>
                    <View style={s.liveBadge}>
                      <View style={s.liveDot}/>
                      <Text style={s.liveTxt}>Live</Text>
                    </View>
                  </View>
                  <View style={s.surveyActions}>
                    <TouchableOpacity
                      style={s.viewBtn}
                      onPress={() => router.push({
                        pathname: '/(tabs)/SurveyResponses',
                        params: { surveyId: survey._id, surveyTitle: survey.title }
                      })}
                    >
                      <Ionicons name="bar-chart" size={16} color="#2d6a4f"/>
                      <Text style={s.viewBtnTxt}>View Responses</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => handleDelete(survey._id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444"/>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Draft Surveys */}
          {draftSurveys.length > 0 && (
            <>
              <Text style={[s.subLabel, {marginTop: liveSurveys.length > 0 ? 14 : 0}]}>
                Drafts ({draftSurveys.length})
              </Text>
              {draftSurveys.map((survey) => (
                <View key={survey._id} style={s.surveyCard}>
                  <View style={s.surveyTop}>
                    <View style={{flex:1}}>
                      <Text style={s.surveyTitle}>{survey.title}</Text>
                      {survey.targetSpecies?.length > 0 && (
                        <Text style={s.surveyMeta}>{survey.targetSpecies.join(' · ')}</Text>
                      )}
                    </View>
                    <View style={s.draftBadge}>
                      <Text style={s.draftTxt}>Draft</Text>
                    </View>
                  </View>
                  <View style={s.surveyActions}>
                    <TouchableOpacity
                      style={s.publishBtn}
                      onPress={() => handlePublishToggle(survey)}
                    >
                      <Ionicons name="cloud-upload-outline" size={16} color="#fff"/>
                      <Text style={s.publishBtnTxt}>Publish Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => handleDelete(survey._id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444"/>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <BottomNav active="ResLib"/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex:1, backgroundColor:'#f2f2f2' },
  header: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:20, paddingVertical:16, backgroundColor:'#fff',
    borderBottomWidth:1, borderBottomColor:'#e0e0e0',
  },
  backBtn: { width:40, height:40, justifyContent:'center', alignItems:'center' },
  headerTitle: { fontSize:18, fontWeight:'700', color:'#1a1a1a', flex:1, textAlign:'center' },
  container: { paddingBottom:80 },
  introSub: { fontSize:15, color:'gray', marginLeft:30, marginTop:16, marginBottom:4 },
  cardsContainer: { padding:15 },
  card: {
    backgroundColor:'#fff', borderRadius:16, padding:20, marginBottom:15,
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:4,
    elevation:3, borderLeftWidth:5, borderLeftColor:'#2d6a4f',
  },
  cardIcon: { width:64, height:64, borderRadius:32, justifyContent:'center', alignItems:'center', marginBottom:12 },
  cardTitle: { fontSize:20, fontWeight:'700', color:'#1f2937', marginBottom:8 },
  cardDesc: { fontSize:14, color:'#6b7280', marginBottom:12, lineHeight:20 },
  cardAction: { flexDirection:'row', alignItems:'center' },
  cardActionTxt: { fontSize:16, fontWeight:'600', color:'#2d6a4f', marginRight:5 },

  surveySection: { paddingHorizontal:15, paddingBottom:20 },
  secHeader: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    marginBottom:14, paddingBottom:10, borderBottomWidth:1, borderBottomColor:'#e0e0e0',
  },
  secTitle: { fontSize:18, fontWeight:'700', color:'#1a1a1a' },
  loadRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:16 },
  loadTxt: { fontSize:14, color:'#6b7280' },
  emptyBox: { alignItems:'center', paddingVertical:30, gap:8 },
  emptyTxt: { fontSize:14, color:'#9ca3af', textAlign:'center' },
  subLabel: {
    fontSize:12, fontWeight:'700', color:'#6b7280', textTransform:'uppercase',
    letterSpacing:0.5, marginBottom:10, flexDirection:'row', alignItems:'center',
  },
  dot: { width:7, height:7, borderRadius:4, backgroundColor:'#2d6a4f', marginRight:6, display:'inline-block' },

  surveyCard: {
    backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10,
    borderWidth:1, borderColor:'#e5e7eb', elevation:1,
  },
  surveyCardLive: { borderLeftWidth:3, borderLeftColor:'#2d6a4f' },
  surveyTop: { flexDirection:'row', alignItems:'flex-start', marginBottom:12 },
  surveyTitle: { fontSize:15, fontWeight:'700', color:'#1a1a1a' },
  surveyMeta: { fontSize:12, color:'#406040', marginTop:3, fontWeight:'500' },
  surveyRegion: { fontSize:12, color:'#9ca3af', marginTop:2 },

  liveBadge: {
    flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#e8f5e9',
    paddingHorizontal:10, paddingVertical:4, borderRadius:10, marginLeft:8,
  },
  liveDot: { width:7, height:7, borderRadius:4, backgroundColor:'#2d6a4f' },
  liveTxt: { fontSize:12, fontWeight:'600', color:'#2d6a4f' },
  draftBadge: {
    backgroundColor:'#f3f4f6', paddingHorizontal:10, paddingVertical:4,
    borderRadius:10, marginLeft:8,
  },
  draftTxt: { fontSize:12, fontWeight:'600', color:'#6b7280' },

  surveyActions: { flexDirection:'row', gap:8, alignItems:'center' },
  viewBtn: {
    flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6,
    backgroundColor:'#e8f5e9', paddingVertical:10, borderRadius:10,
    borderWidth:1, borderColor:'#b7e4c7',
  },
  viewBtnTxt: { fontSize:13, fontWeight:'600', color:'#2d6a4f' },
  publishBtn: {
    flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6,
    backgroundColor:'#2d6a4f', paddingVertical:10, borderRadius:10,
  },
  publishBtnTxt: { fontSize:13, fontWeight:'600', color:'#fff' },
  deleteBtn: {
    width:40, height:40, borderRadius:10, backgroundColor:'#fef2f2',
    justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#fecaca',
  },
});
