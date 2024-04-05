import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Camera } from "expo-camera";
import { socketIp } from "../api/apiConfig";
import { useId } from "../context/userContext";
import { useNavigation } from "@react-navigation/native";

const Recognition = () => {
  const navigation = useNavigation();
  const { setId } = useId();
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    if (hasPermission) {
      handleCapture(); // Panggil handleCapture saat izin kamera diperoleh
    }
  }, [hasPermission]);
  const handleCapture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({ base64: true });
        const blob = await convertToBlob(photo.uri); // Konversi URI ke blob
        // console.log(blob); // Blob hasil konversi
        sendBlobToWebSocket(blob); // Kirim blob ke WebSocket
      } catch (error) {
        console.error("Error capturing photo:", error);
      }
    }
  };

  const convertToBlob = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error("Error converting to blob:", error);
      throw error;
    }
  };

  const sendBlobToWebSocket = async (blob) => {
    try {
      // Buat koneksi WebSocket
      const socket = new WebSocket(`${socketIp}`);

      // Tunggu koneksi WebSocket terbuka
      socket.addEventListener("open", () => {
        console.log("WebSocket connection opened.");

        // Kirim blob ke WebSocket server
        socket.send(blob);
        console.log("Blob sent to WebSocket server.");
        setId(1);
      });

      // Tangani error
      socket.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
      });

      // Tangani penutupan koneksi WebSocket
      socket.addEventListener("close", () => {
        navigation.navigate("Main");
        console.log("WebSocket connection closed.");
      });
    } catch (error) {
      console.error("Error sending Blob to WebSocket:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.front}
        ref={(ref) => setCameraRef(ref)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#fff",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  captureButton: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 20,
  },
});

export default Recognition;
