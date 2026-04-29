import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../assets/components/BottomNav';

const API_URL = 'https://portaled-blair-inkiest.ngrok-free.dev';

export default function DisplaySurvey() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  useEffect(() => { loadSurvey(); }, []);

  useEffect(() => {
    fadeAnim.setValue(0); scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }),
      Animated.spring(scaleAnim, { toValue:1, tension:80, friction:8, useNativeDriver:true }),
    ]).start();
  }, [currentStep]);

  const loadSurvey = async () => {
    try {
      // surveyId may come from navigation params or AsyncStorage (fallback)
      const surveyId = params?.surveyId;
      if (surveyId) {
        const res = await fetch(`${API_URL}/api/surveys/${surveyId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setSurvey(data);
      } else {
        // Legacy: local survey from CreateSurvey before backend integration
        const local = await AsyncStorage.getItem('currentSurvey');
        if (local) { setSurvey(JSON.parse(local)); }
        else { Alert.alert('Error','No survey found'); router.back(); }
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to load survey');
      router.back();
    } finally { setLoading(false); }
  };

  const handleNext = () => {
    const f = survey.fields[currentStep];
    if (f.required && (!responses[f.label] || responses[f.label].toString().trim() === '')) {
      Alert.alert('Required Field','Please complete this field to continue'); return;
    }
    if (currentStep < survey.fields.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const handleSubmit = async () => {
    const missing = survey.fields.filter(f => f.required && (!responses[f.label] || responses[f.label].toString().trim() === ''));
    if (missing.length > 0) {
      Alert.alert('Incomplete Survey', `Please complete: ${missing.map(f=>f.label).join(', ')}`); return;
    }
    setSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId') || 'anonymous';
      const userName = await AsyncStorage.getItem('username') || 'Anonymous';

      if (survey._id) {
        // Backend survey — submit to API
        const res = await fetch(`${API_URL}/api/surveys/${survey._id}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName, answers: responses }),
        });
        if (!res.ok) throw new Error('Submission failed');
      } else {
        // Local fallback
        const existing = await AsyncStorage.getItem('surveyResponses');
        const arr = existing ? JSON.parse(existing) : [];
        arr.push({ surveyId: survey.id, surveyTitle: survey.title, responses, submittedAt: new Date().toISOString() });
        await AsyncStorage.setItem('surveyResponses', JSON.stringify(arr));
      }
      setSubmitted(true);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to submit survey');
    } finally { setSubmitting(false); }
  };

  const renderField = (field) => {
    const val = responses[field.label] || '';
    const set = (v) => setResponses({ ...responses, [field.label]: v });
    switch (field.type) {
      case 'text': case 'number':
        return (
          <TextInput style={s.input} placeholder={field.placeholder||'Type your answer here...'}
            placeholderTextColor="#94a3b8" keyboardType={field.type==='number'?'numeric':'default'}
            value={val} onChangeText={set} autoFocus/>
        );
      case 'textarea':
        return (
          <TextInput style={[s.input,s.ta]} placeholder={field.placeholder||'Type your detailed answer...'}
            placeholderTextColor="#94a3b8" multiline numberOfLines={6}
            textAlignVertical="top" value={val} onChangeText={set} autoFocus/>
        );
      case 'date':
        return <TextInput style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={val} onChangeText={set} autoFocus/>;
      case 'time':
        return <TextInput style={s.input} placeholder="HH:MM" placeholderTextColor="#94a3b8" value={val} onChangeText={set} autoFocus/>;
      case 'checkbox':
        return (
          <TouchableOpacity style={s.checkbox} onPress={()=>set(!val)} activeOpacity={0.7}>
            <View style={[s.checkBox, val && s.checkBoxOn]}>
              {val && <Ionicons name="checkmark" size={18} color="#fff"/>}
            </View>
            <Text style={s.checkLabel}>{field.placeholder||'I confirm the above statement'}</Text>
          </TouchableOpacity>
        );
      default: return null;
    }
  };

  if (loading) return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.center}><ActivityIndicator size="large" color="#2d6a4f"/>
        <Text style={s.loadTxt}>Loading Survey...</Text></View>
    </SafeAreaView>
  );

  if (!survey) return null;

  if (submitted) return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.center}>
        <View style={s.successIcon}><Ionicons name="checkmark-circle" size={72} color="#2d6a4f"/></View>
        <Text style={s.successTitle}>Successfully Submitted</Text>
        <Text style={s.successMsg}>Thank you! Your response has been recorded and will be reviewed by the researcher.</Text>
        <TouchableOpacity style={s.successBtn} onPress={()=>router.push('/(tabs)/HomeScreen')}>
          <Text style={s.successBtnTxt}>Return to Home</Text>
          <Ionicons name="arrow-forward" size={18} color="#000"/>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const total = survey.fields.length;
  const progress = ((currentStep+1)/total)*100;
  const currentField = survey.fields[currentStep];
  const completedCount = Object.keys(responses).filter(k=>responses[k]).length;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>Alert.alert('Discard Progress?','Your progress will be lost.',
          [{text:'Cancel',style:'cancel'},{text:'Discard',onPress:()=>router.back(),style:'destructive'}])} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a"/>
        </TouchableOpacity>
        <View style={s.hCenter}>
          <Text style={s.hTitle}>Survey Response</Text>
          <Text style={s.hSub}>{survey.researcherName || 'Wildlife Conservation'}</Text>
        </View>
        <View style={{width:40}}/>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={s.statsRow}>
          {[{icon:'document-text',val:total,lbl:'Questions',bg:'#f1f5f9',ic:'#2d6a4f'},
            {icon:'checkmark-circle',val:completedCount,lbl:'Completed',bg:'#e8f5e9',ic:'#2d6a4f'},
            {icon:'time',val:total-completedCount,lbl:'Remaining',bg:'#e3f2fd',ic:'#1565c0'}
          ].map((item,i)=>(
            <View key={i} style={s.stat}>
              <View style={[s.statIcon,{backgroundColor:item.bg}]}>
                <Ionicons name={item.icon} size={20} color={item.ic}/>
              </View>
              <Text style={s.statVal}>{item.val}</Text>
              <Text style={s.statLbl}>{item.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Main Card */}
        <View style={s.card}>
          <LinearGradient colors={['#1b4332','#2d6a4f','#40916c']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.cardHeader}>
            <View style={s.cardTitleRow}>
              <View style={s.cardIconBox}><Ionicons name="clipboard" size={28} color="#FFD700"/></View>
              <View style={{flex:1}}>
                <Text style={s.surveyTitle}>{survey.title}</Text>
                {survey.targetSpecies?.length>0&&(
                  <Text style={s.surveySpecies}>{survey.targetSpecies.join(' · ')}</Text>
                )}
                {survey.region&&<Text style={s.surveyRegion}>{survey.region}</Text>}
              </View>
            </View>
            {survey.description&&<Text style={s.surveyDesc}>{survey.description}</Text>}
          </LinearGradient>

          {/* Progress */}
          <View style={s.progress}>
            <View style={s.progressTop}>
              <Text style={s.progressLbl}>Progress</Text>
              <Text style={s.progressPct}>{Math.round(progress)}%</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill,{width:`${progress}%`}]}/>
            </View>
            <Text style={s.progressSub}>Question {currentStep+1} of {total}</Text>
          </View>

          <View style={s.divider}/>

          {/* Question */}
          <Animated.View style={{opacity:fadeAnim,transform:[{scale:scaleAnim}]}}>
            <View style={s.qHeader}>
              <LinearGradient colors={['#1b4332','#2d6a4f']} style={s.qBadge}>
                <Text style={s.qBadgeTxt}>Q{currentStep+1}</Text>
              </LinearGradient>
              <View style={{flex:1}}>
                <Text style={s.qTitle}>{currentField.label}
                  {currentField.required&&<Text style={{color:'#dc2626'}}> *</Text>}
                </Text>
              </View>
            </View>
            <View style={{marginTop:16}}>{renderField(currentField)}</View>
          </Animated.View>

          {/* Nav */}
          <View style={s.navRow}>
            {currentStep>0&&(
              <TouchableOpacity style={s.prevBtn} onPress={handlePrevious}>
                <Ionicons name="chevron-back" size={20} color="#666"/>
                <Text style={s.prevBtnTxt}>Previous</Text>
              </TouchableOpacity>
            )}
            {currentStep<total-1?(
              <TouchableOpacity style={[s.nextBtn,currentStep===0&&{flex:1}]} onPress={handleNext}>
                <Text style={s.nextBtnTxt}>Continue</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff"/>
              </TouchableOpacity>
            ):(
              <TouchableOpacity style={[s.submitBtn,currentStep===0&&{flex:1}]} onPress={handleSubmit} disabled={submitting}>
                {submitting?<ActivityIndicator size="small" color="#000"/>:(
                  <><Ionicons name="checkmark-circle" size={20} color="#000"/>
                  <Text style={s.submitBtnTxt}>Submit Survey</Text></>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Navigator */}
        <View style={s.navCard}>
          <Text style={s.navCardTitle}>Question Navigator</Text>
          <View style={s.navGrid}>
            {survey.fields.map((_,i)=>(
              <TouchableOpacity key={i} onPress={()=>setCurrentStep(i)}
                style={[s.navDot, i===currentStep&&s.navDotA, responses[survey.fields[i].label]&&s.navDotDone]}>
                <Text style={[s.navDotTxt, i===currentStep&&s.navDotTxtA, responses[survey.fields[i].label]&&s.navDotTxtDone]}>{i+1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav active="ResLib"/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:'#f2f2f2'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',
    paddingHorizontal:20,paddingVertical:16,backgroundColor:'#fff',
    borderBottomWidth:1,borderBottomColor:'#e0e0e0'},
  backBtn:{width:40,height:40,justifyContent:'center',alignItems:'center'},
  hCenter:{flex:1,alignItems:'center'},
  hTitle:{fontSize:18,fontWeight:'700',color:'#1a1a1a'},
  hSub:{fontSize:12,color:'#666',marginTop:2},
  container:{padding:16,paddingBottom:100},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:32},
  loadTxt:{fontSize:16,color:'#666',marginTop:16},
  statsRow:{flexDirection:'row',gap:10,marginBottom:16},
  stat:{flex:1,backgroundColor:'#fff',borderRadius:16,padding:16,alignItems:'center',
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8,elevation:3},
  statIcon:{width:48,height:48,borderRadius:14,justifyContent:'center',alignItems:'center',marginBottom:8},
  statVal:{fontSize:22,fontWeight:'700',color:'#1a1a1a',marginBottom:4},
  statLbl:{fontSize:11,color:'#666',textAlign:'center'},
  card:{backgroundColor:'#fff',borderRadius:16,marginBottom:16,overflow:'hidden',
    shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.15,shadowRadius:12,elevation:6},
  cardHeader:{padding:24},
  cardTitleRow:{flexDirection:'row',alignItems:'flex-start',marginBottom:12},
  cardIconBox:{width:44,height:44,borderRadius:10,backgroundColor:'rgba(255,255,255,0.2)',
    justifyContent:'center',alignItems:'center',marginRight:12},
  surveyTitle:{fontSize:20,fontWeight:'700',color:'#fff',marginBottom:4,lineHeight:26},
  surveySpecies:{fontSize:12,color:'#FFD700',fontWeight:'600'},
  surveyRegion:{fontSize:12,color:'rgba(255,255,255,0.7)',marginTop:2},
  surveyDesc:{fontSize:14,color:'#e8f5e9',lineHeight:22,marginTop:8},
  progress:{padding:20},
  progressTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:10},
  progressLbl:{fontSize:13,fontWeight:'600',color:'#1a1a1a'},
  progressPct:{fontSize:15,fontWeight:'700',color:'#2d6a4f'},
  progressBar:{height:8,backgroundColor:'#e0e0e0',borderRadius:4,overflow:'hidden',marginBottom:8},
  progressFill:{height:'100%',backgroundColor:'#2d6a4f',borderRadius:4},
  progressSub:{fontSize:12,color:'#666'},
  divider:{height:1,backgroundColor:'#e0e0e0',marginHorizontal:20},
  qHeader:{flexDirection:'row',gap:14,margin:20,marginBottom:0},
  qBadge:{width:40,height:40,borderRadius:10,justifyContent:'center',alignItems:'center'},
  qBadgeTxt:{fontSize:14,fontWeight:'700',color:'#fff'},
  qTitle:{fontSize:18,fontWeight:'700',color:'#1a1a1a',lineHeight:26},
  input:{backgroundColor:'#fff',borderWidth:1.5,borderColor:'#e0e0e0',borderRadius:12,
    paddingHorizontal:16,paddingVertical:14,fontSize:15,color:'#1a1a1a',margin:20,marginTop:0},
  ta:{minHeight:140,paddingTop:14},
  checkbox:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',padding:16,
    borderRadius:12,borderWidth:1.5,borderColor:'#e0e0e0',margin:20,marginTop:0},
  checkBox:{width:24,height:24,borderRadius:6,borderWidth:2,borderColor:'#e0e0e0',
    alignItems:'center',justifyContent:'center',marginRight:12},
  checkBoxOn:{backgroundColor:'#2d6a4f',borderColor:'#2d6a4f'},
  checkLabel:{fontSize:14,color:'#1a1a1a',flex:1,lineHeight:20},
  navRow:{flexDirection:'row',gap:10,margin:20,marginTop:0,paddingTop:16,
    borderTopWidth:1,borderTopColor:'#e0e0e0'},
  prevBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',
    backgroundColor:'#fff',paddingVertical:15,borderRadius:12,gap:6,
    borderWidth:1.5,borderColor:'#e0e0e0'},
  prevBtnTxt:{fontSize:15,fontWeight:'600',color:'#666'},
  nextBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',
    backgroundColor:'#2d6a4f',paddingVertical:15,borderRadius:12,gap:6},
  nextBtnTxt:{fontSize:15,fontWeight:'600',color:'#fff'},
  submitBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',
    backgroundColor:'#FFD700',paddingVertical:15,borderRadius:12,gap:8},
  submitBtnTxt:{fontSize:15,fontWeight:'700',color:'#000'},
  navCard:{backgroundColor:'#fff',borderRadius:16,padding:20,marginBottom:16,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8,elevation:3},
  navCardTitle:{fontSize:16,fontWeight:'700',color:'#1a1a1a',marginBottom:16},
  navGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  navDot:{width:40,height:40,borderRadius:10,backgroundColor:'#f2f2f2',
    borderWidth:2,borderColor:'#e0e0e0',justifyContent:'center',alignItems:'center'},
  navDotA:{backgroundColor:'#2d6a4f',borderColor:'#2d6a4f'},
  navDotDone:{backgroundColor:'#e8f5e9',borderColor:'#2d6a4f'},
  navDotTxt:{fontSize:14,fontWeight:'600',color:'#666'},
  navDotTxtA:{color:'#fff'},
  navDotTxtDone:{color:'#2d6a4f'},
  successIcon:{width:120,height:120,borderRadius:60,backgroundColor:'#e8f5e9',
    justifyContent:'center',alignItems:'center',marginBottom:24},
  successTitle:{fontSize:26,fontWeight:'700',color:'#1a1a1a',marginBottom:12},
  successMsg:{fontSize:15,color:'#666',textAlign:'center',lineHeight:23,marginBottom:32,paddingHorizontal:20},
  successBtn:{flexDirection:'row',backgroundColor:'#FFD700',paddingVertical:16,paddingHorizontal:28,
    borderRadius:12,alignItems:'center',justifyContent:'center',gap:8},
  successBtnTxt:{color:'#000',fontSize:16,fontWeight:'700'},
});
