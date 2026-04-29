// ./(tabs)/CreateSurvey.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../assets/components/BottomNav';

const API_URL = 'https://portaled-blair-inkiest.ngrok-free.dev';

const WILD_SPECIES = [
  'Markhor', 'Snow Leopard', 'Himalayan Brown Bear',
  'Himalayan Ibex', 'Himalayan Wolf', 'Marco Polo Sheep',
  'Musk Deer', 'Common Leopard',
];

const REGIONS = [
  'Karakoram Range', 'Himalayan Range', 'Hindu Kush',
  'Deosai Plains', 'Gilgit-Baltistan', 'Chitral',
  'Khunjerab', 'Nanga Parbat Region',
];

const FIELD_TYPES = [
  { id: 'text', name: 'Text Input', icon: 'text' },
  { id: 'number', name: 'Number', icon: 'calculator' },
  { id: 'textarea', name: 'Long Text', icon: 'document-text' },
  { id: 'dropdown', name: 'Dropdown', icon: 'chevron-down-circle' },
  { id: 'checkbox', name: 'Checkbox', icon: 'checkbox' },
  { id: 'date', name: 'Date', icon: 'calendar' },
  { id: 'time', name: 'Time', icon: 'time' },
];

const EMPTY_FIELD = { label: '', type: 'text', required: false, placeholder: '', options: [] };

// ✅ IMPORTANT: This is the default export - component name matches file name
export default function CreateSurvey() {
  const router = useRouter();
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState(EMPTY_FIELD);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const addField = () => {
    if (!newField.label.trim()) return;
    if (editingField !== null) {
      const updated = [...fields];
      updated[editingField] = { ...newField };
      setFields(updated);
      setEditingField(null);
    } else {
      setFields([...fields, { ...newField }]);
    }
    setNewField(EMPTY_FIELD);
    setShowFieldModal(false);
  };

  const editField = (i) => {
    setNewField(fields[i]);
    setEditingField(i);
    setShowFieldModal(true);
  };

  const deleteField = (i) => setFields(fields.filter((_, idx) => idx !== i));
  
  const toggleSpecies = (s) => {
    setSelectedSpecies(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const moveField = (i, dir) => {
    const arr = [...fields];
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j >= 0 && j < arr.length) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      setFields(arr);
    }
  };

  const validate = () => {
    if (!surveyTitle.trim()) {
      Alert.alert('Error', 'Please enter a survey title');
      return false;
    }
    if (fields.length === 0) {
      Alert.alert('Error', 'Please add at least one field');
      return false;
    }
    return true;
  };

  const buildPayload = async () => {
    const researcherId = await AsyncStorage.getItem('userId');
    const researcherName = await AsyncStorage.getItem('username') || 'Researcher';
    return {
      title: surveyTitle.trim(),
      description: surveyDescription.trim(),
      fields,
      researcherId: researcherId || 'unknown',
      researcherName,
      targetSpecies: selectedSpecies,
      region: selectedRegion || 'Northern Pakistan (Himalayan / Karakoram)'
    };
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = await buildPayload();
      const r = await fetch(`${API_URL}/api/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      Alert.alert('Saved', 'Survey saved as draft.');
      router.push('/(tabs)/ResearcherHub');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setPublishing(true);
    try {
      const body = await buildPayload();
      const cr = await fetch(`${API_URL}/api/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const cd = await cr.json();
      if (!cr.ok) throw new Error(cd.message);
      const publishedSurveyId = cd?.survey?._id;
      const pr = await fetch(`${API_URL}/api/surveys/${cd.survey._id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!pr.ok) throw new Error('Failed to publish');
      Alert.alert('Published!', 'Survey is now live. Users will see it.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (publishedSurveyId) {
                router.push({
                  pathname: '/(tabs)/DisplaySurvey',
                  params: { surveyId: publishedSurveyId, surveyTitle: surveyTitle.trim() },
                });
              } else {
                router.push('/(tabs)/ResearcherHub');
              }
            },
          },
        ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/ResearcherHub')} style={s.hBtn}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={s.hTitle}>Create Survey</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.container}>
        <View style={s.intro}>
          <View style={s.iconBox}>
            <Ionicons name="create" size={40} color="#FFD700" />
          </View>
          <Text style={s.introTitle}>Wildlife Survey Builder</Text>
          <Text style={s.introSub}>Collect field data from Himalayan & Karakoram region</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>Survey Title <Text style={s.req}>*</Text></Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Markhor Population Census 2025"
            placeholderTextColor="#9ca3af"
            value={surveyTitle}
            onChangeText={setSurveyTitle}
          />

          <Text style={[s.label, { marginTop: 16 }]}>Description</Text>
          <TextInput
            style={[s.input, s.ta]}
            placeholder="What wildlife data are you collecting..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={surveyDescription}
            onChangeText={setSurveyDescription}
          />

          <Text style={[s.label, { marginTop: 16 }]}>Target Species</Text>
          <TouchableOpacity style={s.selector} onPress={() => setShowSpeciesModal(true)}>
            <Ionicons name="paw" size={18} color="#406040" />
            <Text style={s.selectorTxt} numberOfLines={1}>
              {selectedSpecies.length > 0 ? selectedSpecies.join(', ') : 'Select species...'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#6b7280" />
          </TouchableOpacity>

          <Text style={[s.label, { marginTop: 16 }]}>Region</Text>
          <TouchableOpacity style={s.selector} onPress={() => setShowRegionModal(true)}>
            <Ionicons name="location" size={18} color="#406040" />
            <Text style={s.selectorTxt}>{selectedRegion || 'Select region...'}</Text>
            <Ionicons name="chevron-down" size={18} color="#6b7280" />
          </TouchableOpacity>

          <View style={s.secHeader}>
            <Text style={s.secTitle}>Form Fields</Text>
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{fields.length} field{fields.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {fields.map((field, i) => (
            <View key={i} style={s.fieldCard}>
              <View style={{ flex: 1 }}>
                <View style={s.fRow}>
                  <Ionicons name={FIELD_TYPES.find(t => t.id === field.type)?.icon || 'text'} size={20} color="#406040" />
                  <Text style={s.fLabel}>{field.label}</Text>
                  {field.required && <View style={s.reqBadge}><Text style={s.reqBadgeTxt}>Required</Text></View>}
                </View>
                <Text style={s.fType}>{FIELD_TYPES.find(t => t.id === field.type)?.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => moveField(i, 'up')} disabled={i === 0} style={s.aBtn}>
                  <Ionicons name="arrow-up" size={18} color={i === 0 ? '#d1d5db' : '#406040'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveField(i, 'down')} disabled={i === fields.length - 1} style={s.aBtn}>
                  <Ionicons name="arrow-down" size={18} color={i === fields.length - 1 ? '#d1d5db' : '#406040'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => editField(i)} style={s.aBtn}>
                  <Ionicons name="pencil" size={18} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteField(i)} style={s.aBtn}>
                  <Ionicons name="trash" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={s.addBtn} onPress={() => setShowFieldModal(true)}>
            <Ionicons name="add-circle" size={24} color="#FFD700" />
            <Text style={s.addBtnTxt}>Add New Field</Text>
          </TouchableOpacity>

          {fields.length > 0 && surveyTitle.trim() && (
            <View style={s.actRow}>
              <TouchableOpacity style={s.draftBtn} onPress={handleSaveDraft} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#406040" /> : (
                  <><Ionicons name="save-outline" size={18} color="#406040" /><Text style={s.draftBtnTxt}>Save Draft</Text></>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.pubBtn} onPress={handlePublish} disabled={publishing}>
                {publishing ? <ActivityIndicator size="small" color="#1f2937" /> : (
                  <><Ionicons name="cloud-upload" size={18} color="#1f2937" /><Text style={s.pubBtnTxt}>Publish Survey</Text></>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Field Modal */}
      <Modal visible={showFieldModal} animationType="slide" transparent
        onRequestClose={() => { setShowFieldModal(false); setNewField(EMPTY_FIELD); setEditingField(null); }}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{editingField !== null ? 'Edit Field' : 'Add New Field'}</Text>
              <TouchableOpacity onPress={() => { setShowFieldModal(false); setNewField(EMPTY_FIELD); setEditingField(null); }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={s.mLabel}>Field Label <Text style={s.req}>*</Text></Text>
              <TextInput
                style={s.mInput}
                placeholder="e.g., Number of Animals Spotted"
                placeholderTextColor="#9ca3af"
                value={newField.label}
                onChangeText={t => setNewField({ ...newField, label: t })}
              />
              <Text style={[s.mLabel, { marginTop: 16 }]}>Field Type</Text>
              <View style={s.typeGrid}>
                {FIELD_TYPES.map(t => (
                  <TouchableOpacity key={t.id} onPress={() => setNewField({ ...newField, type: t.id })}
                    style={[s.typeBtn, newField.type === t.id && s.typeBtnA]}>
                    <Ionicons name={t.icon} size={20} color={newField.type === t.id ? '#406040' : '#6b7280'} />
                    <Text style={[s.typeTxt, newField.type === t.id && s.typeTxtA]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.mLabel, { marginTop: 16 }]}>Placeholder Text</Text>
              <TextInput
                style={s.mInput}
                placeholder="e.g., Enter a number..."
                placeholderTextColor="#9ca3af"
                value={newField.placeholder}
                onChangeText={t => setNewField({ ...newField, placeholder: t })}
              />
              <TouchableOpacity style={s.toggleRow} onPress={() => setNewField({ ...newField, required: !newField.required })}>
                <View>
                  <Text style={s.mLabel}>Required Field</Text>
                  <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Users must fill this field</Text>
                </View>
                <View style={[s.toggle, newField.required && s.toggleOn]}>
                  <View style={[s.toggleDot, newField.required && { marginLeft: 'auto' }]} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[s.pubBtn, { marginTop: 10 }, !newField.label.trim() && { backgroundColor: '#d1d5db' }]}
                onPress={addField} disabled={!newField.label.trim()}>
                <Text style={s.pubBtnTxt}>{editingField !== null ? 'Update Field' : 'Add Field'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Species Modal */}
      <Modal visible={showSpeciesModal} animationType="slide" transparent onRequestClose={() => setShowSpeciesModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Target Species</Text>
              <TouchableOpacity onPress={() => setShowSpeciesModal(false)}><Ionicons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            {WILD_SPECIES.map(sp => (
              <TouchableOpacity key={sp} style={s.pickRow} onPress={() => toggleSpecies(sp)}>
                <Text style={s.pickTxt}>{sp}</Text>
                {selectedSpecies.includes(sp) && <Ionicons name="checkmark-circle" size={22} color="#406040" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.pubBtn, { marginTop: 16 }]} onPress={() => setShowSpeciesModal(false)}>
              <Text style={s.pubBtnTxt}>Done ({selectedSpecies.length} selected)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Region Modal */}
      <Modal visible={showRegionModal} animationType="slide" transparent onRequestClose={() => setShowRegionModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Select Region</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}><Ionicons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            {REGIONS.map(r => (
              <TouchableOpacity key={r} style={s.pickRow} onPress={() => { setSelectedRegion(r); setShowRegionModal(false); }}>
                <Text style={s.pickTxt}>{r}</Text>
                {selectedRegion === r && <Ionicons name="checkmark-circle" size={22} color="#406040" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <BottomNav active="ResLib" />
    </SafeAreaView>
  );
}

// Styles
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2 },
  hBtn: { padding: 8, borderRadius: 8 },
  hTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  container: { paddingBottom: 100 },
  intro: { padding: 24, paddingTop: 32, alignItems: 'center' },
  iconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 3 },
  introTitle: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  introSub: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  form: { paddingHorizontal: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  req: { color: '#ef4444' },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1f2937' },
  ta: { minHeight: 90, paddingTop: 14 },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  selectorTxt: { flex: 1, fontSize: 15, color: '#6b7280' },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  badge: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  fieldCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', elevation: 1 },
  fRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  fLabel: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginLeft: 10, flex: 1 },
  reqBadge: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  reqBadgeTxt: { fontSize: 10, color: '#1f2937', fontWeight: '700' },
  fType: { fontSize: 13, color: '#6b7280', marginLeft: 30 },
  aBtn: { padding: 6, borderRadius: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffbeb', borderWidth: 2, borderColor: '#FFD700', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, marginTop: 12 },
  addBtnTxt: { fontSize: 16, fontWeight: '700', color: '#406040', marginLeft: 8 },
  actRow: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 20 },
  draftBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#406040', borderRadius: 14, paddingVertical: 16, gap: 8 },
  draftBtnTxt: { color: '#406040', fontSize: 15, fontWeight: '700' },
  pubBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD700', borderRadius: 14, paddingVertical: 16, gap: 8, elevation: 3 },
  pubBtnTxt: { color: '#1f2937', fontSize: 15, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  mLabel: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  mInput: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1f2937' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', minWidth: '47%' },
  typeBtnA: { backgroundColor: '#fffbeb', borderColor: '#FFD700' },
  typeTxt: { fontSize: 13, color: '#6b7280', marginLeft: 8, fontWeight: '500' },
  typeTxtA: { color: '#406040', fontWeight: '700' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, marginTop: 16, marginBottom: 16 },
  toggle: { width: 52, height: 30, borderRadius: 15, backgroundColor: '#d1d5db', padding: 2, flexDirection: 'row', alignItems: 'center' },
  toggleOn: { backgroundColor: '#FFD700', justifyContent: 'flex-end' },
  toggleDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', elevation: 2 },
  pickRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pickTxt: { fontSize: 16, color: '#1f2937' },
});