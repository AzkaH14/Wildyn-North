import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNav from '../../assets/components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://portaled-blair-inkiest.ngrok-free.dev';

const SPECIES_ICONS = {
  'Markhor': 'footsteps',
  'Snow Leopard': 'snow',
  'Himalayan Brown Bear': 'paw',
  'Himalayan Ibex': 'leaf',
  'Himalayan Wolf': 'moon',
  'Marco Polo Sheep': 'globe',
  'Musk Deer': 'flower',
  'Common Leopard': 'paw',
};

export default function SurveyNotifications() {
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filledByUser, setFilledByUser] = useState({}); // { [surveyId]: boolean }
  const [checkingFilled, setCheckingFilled] = useState(false);

  const fetchSurveys = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/surveys/published`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const sorted = Array.isArray(data)
        ? data.slice().sort((a, b) => {
            const ta = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const tb = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            return tb - ta;
          })
        : [];
      setSurveys(sorted);
    } catch (e) {
      setError(e.message || 'Failed to load surveys');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSurveys(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchSurveys(); }, []);

  // Check which surveys current user has already filled.
  useEffect(() => {
    const checkFilled = async () => {
      if (!surveys.length) return;

      const uid = await AsyncStorage.getItem('userId');
      if (!uid) {
        setFilledByUser({});
        return;
      }

      setCheckingFilled(true);
      try {
        const maxToCheck = surveys.length;
        const map = {};

        for (let i = 0; i < maxToCheck; i++) {
          const survey = surveys[i];
          if (!survey?._id) continue;
          try {
            const r = await fetch(`${API_URL}/api/surveys/${survey._id}/responses`);
            const json = await r.json();
            if (!r.ok) continue;

            const alreadyFilled =
              Array.isArray(json?.responses) &&
              json.responses.some(resp => String(resp?.userId) === String(uid));

            map[survey._id] = alreadyFilled;
          } catch (inner) {
            // Single request fail => ignore and continue
          }
        }

        setFilledByUser(map);
      } finally {
        setCheckingFilled(false);
      }
    };

    checkFilled();
  }, [surveys]);

  const handleFillSurvey = (survey) => {
    router.push({ pathname: '/(tabs)/DisplaySurvey', params: { surveyId: survey._id } });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.loadCenter}><ActivityIndicator size="large" color="#2d6a4f"/>
        <Text style={s.loadTxt}>Loading surveys...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        {/* ✅ FIX: back arrow اب HomeScreen پر لے جاتا ہے */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a"/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Wildlife Surveys</Text>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{surveys.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d6a4f"/>}
      >
        {/* Banner */}
        <View style={s.banner}>
          <View style={s.bannerIcon}><Ionicons name="leaf" size={28} color="#2d6a4f"/></View>
          <View style={{flex:1}}>
            <Text style={s.bannerTitle}>Help Protect Wildlife</Text>
            <Text style={s.bannerSub}>Fill surveys from researchers studying Himalayan & Karakoram species</Text>
          </View>
        </View>

        {error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#ef4444"/>
            <Text style={s.errorTxt}>{error}</Text>
            <TouchableOpacity onPress={fetchSurveys}><Text style={s.retryTxt}>Retry</Text></TouchableOpacity>
          </View>
        )}

        {surveys.length === 0 && !error && (
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db"/>
            <Text style={s.emptyTitle}>No surveys yet</Text>
            <Text style={s.emptySub}>Researchers will publish surveys here. Pull down to refresh.</Text>
          </View>
        )}

        {surveys.map((survey) => (
          <View key={survey._id} style={s.card}>
            {/* Header row */}
            <View style={s.cardTop}>
              <View style={s.cardIconWrap}>
                <Ionicons
                  name={survey.targetSpecies?.length > 0 ? (SPECIES_ICONS[survey.targetSpecies[0]] || 'paw') : 'clipboard'}
                  size={24} color="#2d6a4f"
                />
              </View>
              <View style={{flex:1}}>
                <Text style={s.cardTitle}>{survey.title}</Text>
                <Text style={s.cardBy}>By {survey.researcherName}</Text>
              </View>
              <View style={s.liveBadge}>
                <View style={s.liveDot}/>
                <Text style={s.liveTxt}>Live</Text>
              </View>
            </View>

            {/* Description */}
            {survey.description ? <Text style={s.cardDesc}>{survey.description}</Text> : null}

            {/* Meta chips */}
            <View style={s.chips}>
              {survey.region && (
                <View style={s.chip}>
                  <Ionicons name="location-outline" size={12} color="#406040"/>
                  <Text style={s.chipTxt}>{survey.region}</Text>
                </View>
              )}
              {survey.fields?.length > 0 && (
                <View style={s.chip}>
                  <Ionicons name="list-outline" size={12} color="#406040"/>
                  <Text style={s.chipTxt}>{survey.fields.length} questions</Text>
                </View>
              )}
              <View style={s.chip}>
                <Ionicons name="time-outline" size={12} color="#406040"/>
                <Text style={s.chipTxt}>{formatDate(survey.publishedAt)}</Text>
              </View>
            </View>

            {/* Species tags */}
            {survey.targetSpecies?.length > 0 && (
              <View style={s.speciesRow}>
                {survey.targetSpecies.map((sp) => (
                  <View key={sp} style={s.speciesTag}>
                    <Text style={s.speciesTagTxt}>{sp}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CTA */}
            {filledByUser[survey._id] ? (
              <View style={[s.fillBtn, { backgroundColor: '#e5e7eb' }]}>
                <Ionicons name="checkmark-done" size={18} color="#6b7280" />
                <Text style={[s.fillBtnTxt, { color: '#6b7280' }]}>Already Filled</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={s.fillBtn}
                onPress={() => handleFillSurvey(survey)}
                activeOpacity={0.85}
                disabled={checkingFilled}
              >
                <Ionicons name="pencil" size={18} color="#1f2937" />
                <Text style={s.fillBtnTxt}>{checkingFilled ? 'Checking...' : 'Fill This Survey'}</Text>
                <Ionicons name="arrow-forward" size={18} color="#1f2937" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <BottomNav active="Surveys"/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:'#f2f2f2'},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingVertical:16,
    backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#e0e0e0'},
  backBtn:{width:40,height:40,justifyContent:'center',alignItems:'center'},
  headerTitle:{flex:1,fontSize:18,fontWeight:'700',color:'#1a1a1a',textAlign:'center'},
  badge:{backgroundColor:'#e8f5e9',paddingHorizontal:10,paddingVertical:4,borderRadius:12},
  badgeTxt:{fontSize:13,fontWeight:'700',color:'#2d6a4f'},
  loadCenter:{flex:1,justifyContent:'center',alignItems:'center',gap:16},
  loadTxt:{fontSize:16,color:'#666'},
  container:{padding:16,paddingBottom:100},
  banner:{flexDirection:'row',alignItems:'center',gap:14,backgroundColor:'#e8f5e9',
    borderRadius:16,padding:16,marginBottom:16,borderWidth:1,borderColor:'#b7e4c7'},
  bannerIcon:{width:48,height:48,borderRadius:14,backgroundColor:'#d8f3dc',
    justifyContent:'center',alignItems:'center'},
  bannerTitle:{fontSize:15,fontWeight:'700',color:'#1b4332'},
  bannerSub:{fontSize:13,color:'#40916c',marginTop:2,lineHeight:18},
  errorBox:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#fef2f2',
    borderRadius:12,padding:14,marginBottom:16,borderWidth:1,borderColor:'#fecaca'},
  errorTxt:{flex:1,fontSize:14,color:'#ef4444'},
  retryTxt:{fontSize:14,color:'#2d6a4f',fontWeight:'600'},
  empty:{alignItems:'center',paddingVertical:60,gap:12},
  emptyTitle:{fontSize:18,fontWeight:'700',color:'#6b7280'},
  emptySub:{fontSize:14,color:'#9ca3af',textAlign:'center',paddingHorizontal:32,lineHeight:20},
  card:{backgroundColor:'#fff',borderRadius:16,padding:18,marginBottom:14,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8,elevation:3},
  cardTop:{flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:10},
  cardIconWrap:{width:48,height:48,borderRadius:14,backgroundColor:'#e8f5e9',
    justifyContent:'center',alignItems:'center'},
  cardTitle:{fontSize:16,fontWeight:'700',color:'#1a1a1a',lineHeight:22},
  cardBy:{fontSize:13,color:'#6b7280',marginTop:2},
  liveBadge:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#e8f5e9',
    paddingHorizontal:10,paddingVertical:4,borderRadius:10},
  liveDot:{width:7,height:7,borderRadius:4,backgroundColor:'#2d6a4f'},
  liveTxt:{fontSize:12,fontWeight:'600',color:'#2d6a4f'},
  cardDesc:{fontSize:14,color:'#6b7280',lineHeight:20,marginBottom:12},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:10},
  chip:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#f9fafb',
    paddingHorizontal:10,paddingVertical:5,borderRadius:8,borderWidth:1,borderColor:'#e5e7eb'},
  chipTxt:{fontSize:12,color:'#406040',fontWeight:'500'},
  speciesRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:14},
  speciesTag:{backgroundColor:'#fffbeb',paddingHorizontal:10,paddingVertical:4,
    borderRadius:8,borderWidth:1,borderColor:'#FFD700'},
  speciesTagTxt:{fontSize:12,color:'#92400e',fontWeight:'600'},
  fillBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,
    backgroundColor:'#FFD700',paddingVertical:14,borderRadius:12,marginTop:4,elevation:2},
  fillBtnTxt:{fontSize:15,fontWeight:'700',color:'#1f2937'},
});