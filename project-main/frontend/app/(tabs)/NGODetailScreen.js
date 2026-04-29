
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function NGODetailScreen() {
  const { ngo } = useLocalSearchParams();
  const parsedNgo = JSON.parse(ngo);
  const router = useRouter();

  return (
  <View style={styles.container}>

    {/* HEADER */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.push("/NGOListScreen")}>
        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Contact Details</Text>

      <View style={{ width: 24 }} />
    </View>

    {/* CONTENT WRAPPER (NEW) */}
    <View style={styles.content}>

  {/* NGO NAME */}
  <Text style={styles.ngoName}>{parsedNgo.name}</Text>
  <Text style={styles.city}>{parsedNgo.city}</Text>

  {/* DESCRIPTION */}
  <Text style={styles.sectionTitle}>About Organization</Text>
  <Text style={styles.desc}>{parsedNgo.description}</Text>

  {/* CONTACT INFO */}
<Text style={styles.sectionTitle}>Contact Information</Text>

{/* PHONE */}
<View style={styles.row}>
    <View style={styles.leftRow}>  
  <Ionicons name="call-outline" size={18} color="#1a1a1a" />
  <Text style={styles.label}>Phone Number</Text>
    </View>
  <TouchableOpacity onPress={() => Linking.openURL(`tel:${parsedNgo.phone}`)}>
    <Text style={styles.value}>{parsedNgo.phone}</Text>
  </TouchableOpacity>
</View>

{/* EMAIL */}
<View style={styles.row}>
  <View style={styles.leftRow}>
   <Ionicons name="mail-outline" size={18} color="#1a1a1a" />
  <Text style={styles.label}>Email</Text>
  </View>
  <TouchableOpacity onPress={() => Linking.openURL(`mailto:${parsedNgo.email}`)}>
    <Text style={styles.value}>{parsedNgo.email}</Text>
  </TouchableOpacity>
</View>

  {/* WEBSITE BUTTON (keep same) */}
  {parsedNgo.website && (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: "#FFD700" }]}
      onPress={() => Linking.openURL(parsedNgo.website)}
    >
      <Ionicons name="globe" size={20} color="#000" />
      <Text style={styles.btnText}>Visit Website</Text>
    </TouchableOpacity>
  )}

</View>

    </View>
  
);
}

const styles = StyleSheet.create({
 container: {
    flex: 1,
    
    backgroundColor: "#fffffff5",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 27,
    marginBottom:7,
  },


  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },

 content: {
  width: "92%",
  alignSelf: "center",
  marginTop: 10,
},
  /* NGO NAME CARD */
  nameCard: {
    backgroundColor: "#e8ede7", // light yellow
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },

  ngoName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1b4332", // dark green
    textAlign: "center",
    marginTop:20,
  },

  city: {
    marginTop: 2,
    color: "#646464",
    fontWeight: "480",
    alignSelf: "center",
    marginBottom: 25,
  },

  /* GENERAL CARD */
 

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 5,
    color: "#1a1a1a",
  },

  desc: {
    color: "#555",
    lineHeight: 20,
    marginBottom: 18,
    fontSize: 15,
    fontWeight: "480",
  },

  /* BUTTONS */
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2d6a4f",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 10,
  },

  btnText: {
    color: "#000000",
    fontWeight: "600",
  },

  /* CONTACT INFO */

  row: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 12, // 👈 space between phone & email
  marginBottom: 16,
},
leftRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6, // small space between icon & label
},

label: {
  fontSize: 15,
  color: "#1a1a1a9f",
  fontWeight: "600",
},

value: {
  fontSize: 15,
  color: "#000000b0", // clickable look
  fontWeight: "600",
 textDecorationLine: "underline", 
 marginRight: 10,
},
});