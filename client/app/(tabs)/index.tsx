import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Overlay from "./Overlay";

export default function HomeScreen() {
  const [loadingData, setLoadingData] = useState(false);
  const [qrPlayerData, setQrPlayerData] = useState<{
    n_socio: string;
    apellido_nombre: string;
    dni: string;
    fecha_nacimiento: string;
    fecha_alta: string;
  } | null>(null);
  const [playerData, setPlayerData] = useState<{
    Descripcion: Array<string>;
    IdCliente: string;
    NumeroDocumento: string;
    RazonSocial: string;
  } | null>(null);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const qrLock = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleScan = async () => {
    setPlayerData(null);
  };

  const fetchPlayerFromDB = async (data: string) => {
    setLoadingData(true);

    try {
      let parsedData = parsePlayerData(data);
      setQrPlayerData(parsedData);
      const response = await fetch(
        `${apiUrl}/obtener-cliente/${parsedData?.dni}`
      );

      const responseData = await response.json();

      if (response.ok) {
        setPlayerData(responseData.data[0]);
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const parsePlayerData = (data: string) => {
    const lines = data.split("\r\n");
    const parsedData = {
      n_socio: "",
      apellido_nombre: "",
      dni: "",
      fecha_nacimiento: "",
      fecha_alta: "",
    };

    lines.forEach((line) => {
      const [key, value] = line.split(":").map((s) => s.trim());
      switch (key) {
        case "Numero Socio":
          parsedData.n_socio = value;
          break;
        case "Apellido y Nombre":
          parsedData.apellido_nombre = value;
          break;
        case "DNI":
          parsedData.dni = value;
          break;
        case "Fecha Nacimiento":
          parsedData.fecha_nacimiento = value;
          break;
        case "Fecha Alta":
          parsedData.fecha_alta = value;
          break;
      }
    });

    return parsedData;
  };

  return (
    <SafeAreaView style={styles.container}>
      {(playerData && qrPlayerData) || loadingData ? (
        <View style={styles.resultContainer}>
          {loadingData || !playerData || !qrPlayerData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color='white' />
              <Text
                style={{
                  marginTop: 20,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Cargando datos del jugador
              </Text>
            </View>
          ) : (
            <View style={styles.result}>
              <Text style={styles.header}>Jugador escaneado</Text>
              <Image
                source={{
                  uri: `https://eisasoft.com.ar/Cardos/${playerData.NumeroDocumento}.jpg`,
                }}
                style={styles.playerImage}
              />

              <ScrollView style={{ marginBottom: 10 }}>
                <Text style={styles.label}>
                  Jugador:{" "}
                  <Text style={styles.value}>{playerData.RazonSocial}</Text>
                </Text>

                <Text style={styles.label}>
                  N° Socio:{" "}
                  <Text style={styles.value}>{playerData.IdCliente}</Text>
                </Text>

                <Text style={styles.label}>
                  Estado:{" "}
                  <Text style={styles.value}>{playerData.Descripcion[0]}</Text>
                </Text>

                <Text style={styles.label}>
                  Categoria:{" "}
                  <Text style={styles.value}>{playerData.Descripcion[1]}</Text>
                </Text>

                <Text style={styles.label}>
                  Fecha alta :{" "}
                  <Text style={styles.value}>{qrPlayerData.fecha_alta}</Text>
                </Text>

                <Text style={styles.label}>
                  DNI:{" "}
                  <Text style={styles.value}>{playerData.NumeroDocumento}</Text>
                </Text>
                <Text style={styles.label}>
                  Fecha de nacimiento:{" "}
                  <Text style={styles.value}>
                    {qrPlayerData?.fecha_nacimiento}
                  </Text>
                </Text>
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.buttonWhite} onPress={handleScan}>
            <Text style={styles.buttonTextGreen}>Volver a escanear</Text>
          </TouchableOpacity>
        </View>
      ) : permission?.granted === true ? (
        <View style={{ flex: 1, width: "100%" }}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing='back'
            onBarcodeScanned={({ data }) => {
              if (data && !qrLock.current) {
                qrLock.current = true;
                setTimeout(() => {
                  qrLock.current = false;
                }, 1000);
                fetchPlayerFromDB(data);
              }
            }}
          />
          <Overlay />
        </View>
      ) : (
        <View style={styles.permissionContainer}>
          <Image
            source={require("@/assets/images/los_cardos_rugby_club.jpg")}
            style={styles.logo}
          />
          <TouchableOpacity
            style={styles.buttonGreen}
            onPress={requestPermission}
          >
            <Text style={styles.buttonTextWhite}>Dar permiso a la cámara</Text>
          </TouchableOpacity>
          <Text style={styles.permissionText}>
            Para escanear el código QR de un jugador, necesitás habilitar el
            acceso a la cámara.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00672290",
    alignItems: "center",
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    width: "100%",
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignSelf: "center",
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: "#00000030",
    borderRadius: 16,
  },
  result: {
    flex: 1,
    padding: 15,
    backgroundColor: "#00000030",
    borderRadius: 16,
    width: "100%",
  },
  header: {
    color: "#C8FFB3",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    textDecorationLine: "underline",
  },
  label: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  value: {
    fontWeight: "500",
    letterSpacing: 0.7,
    color: "#F5F5F5",
  },
  buttonWhite: {
    marginTop: 32,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: "center",
  },
  buttonTextGreen: {
    color: "#006722",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonGreen: {
    backgroundColor: "#006722",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonTextWhite: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  permissionText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    lineHeight: 22,
  },
  playerImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
    borderRadius: 16,
    alignSelf: "center",
  },
});
