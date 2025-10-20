import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Image */}
    <Image source={require("../../assets/markhor.png")} 
       style={styles.backgroundImage} 
       contentFit="cover" />



      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.heading}>
          Spot, Report, Protect{"\n"}Together we can safeguard wildlife!
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/report")} // navigate to another screen
        >
          <Text style={styles.buttonText}>GET STARTED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, // fills the whole screen
    opacity: 0.8, // slightly dim the image for better text visibility
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 60,
  },
  heading: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
    shadowColor: "#000",
  },
  button: {
    backgroundColor: "#FFD700", // yellow
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 8,
    elevation: 3, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 17,
    color: "#000",
  },
});