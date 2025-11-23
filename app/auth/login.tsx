import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth } from "../../firebase/firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("Login error:", error);
      let msg = "Gagal login. Cek email dan password.";

      if (error.code === "auth/invalid-credential") {
        msg = "Email atau password salah.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Terlalu banyak percobaan login. Coba beberapa saat lagi.";
      }

      Alert.alert("Login gagal", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        {/* Layer background “glow” */}
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

        <View style={styles.card}>
          <Text style={styles.appBadge}>PEMPEK MANAGER</Text>

          <Text style={styles.title}>Selamat datang 👋</Text>
          <Text style={styles.subtitle}>
            Masuk dulu sebelum mulai mengelola stok dan harga pempek.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="contoh: pempek@toko.com"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Masuk..." : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={styles.linkText}>
              Belum punya akun?{" "}
              <Text style={styles.linkTextStrong}>Daftar di sini</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerHint}>
            Tip: gunakan email & password yang sudah kamu daftarkan di aplikasi
            ini.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  topGlow: {
    position: "absolute",
    top: -80,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
  },
  bottomGlow: {
    position: "absolute",
    bottom: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.10)",
  },
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "#1f2937",
    // shadow untuk iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    // elevation untuk Android
    elevation: 12,
  },
  appBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
    color: "#9ca3af",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    color: "#e5e7eb",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    color: "#d1d5db",
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#020617",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f9fafb",
    borderWidth: 1,
    borderColor: "#1f2937",
    fontSize: 13,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#22c55e",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#022c22",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  linkButton: {
    marginTop: 12,
    alignItems: "center",
  },
  linkText: {
    color: "#9ca3af",
    fontSize: 12,
  },
  linkTextStrong: {
    color: "#93c5fd",
    fontWeight: "600",
  },
  footerHint: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 10,
  },
});
