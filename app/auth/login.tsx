import { router } from "expo-router";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth } from "../../firebase/firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // State untuk Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

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
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
        msg = "Email atau password salah.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Terlalu banyak percobaan. Tunggu sebentar.";
      }
      Alert.alert("Login gagal", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Error", "Masukkan email akun Anda.");
      return;
    }
    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, resetEmail.trim());
      Alert.alert("Sukses", "Link reset password telah dikirim ke email Anda.");
      setShowResetModal(false);
      setResetEmail("");
    } catch (error: any) {
      let msg = "Gagal mengirim email reset.";
      if (error.code === "auth/user-not-found") {
        msg = "Email tidak terdaftar.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Format email salah.";
      }
      Alert.alert("Gagal", msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

        <View style={styles.card}>
          <Text style={styles.appBadge}>PEMPEK MANAGER</Text>
          <Text style={styles.title}>Selamat datang 👋</Text>
          <Text style={styles.subtitle}>
            Masuk untuk mengelola stok, transaksi, dan laporan usaha.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="contoh: admin@pempek.com"
              placeholderTextColor="#64748b"
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
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {/* TOMBOL LUPA PASSWORD */}
            <TouchableOpacity 
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
              onPress={() => {
                setResetEmail(email); // Auto-fill jika user udah ngetik email
                setShowResetModal(true);
              }}
            >
              <Text style={styles.forgotText}>Lupa Password?</Text>
            </TouchableOpacity>
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
        </View>

        {/* MODAL RESET PASSWORD */}
        <Modal
          visible={showResetModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowResetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>
                Masukkan email Anda, kami akan mengirimkan link untuk mereset password.
              </Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Email Anda"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={resetEmail}
                onChangeText={setResetEmail}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalBtnCancel}
                  onPress={() => setShowResetModal(false)}
                  disabled={resetLoading}
                >
                  <Text style={styles.modalBtnTextCancel}>Batal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalBtnConfirm}
                  onPress={handleResetPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalBtnTextConfirm}>Kirim Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
    position: "absolute", top: -80, left: -40, width: 200, height: 200,
    borderRadius: 999, backgroundColor: "rgba(34,197,94,0.10)",
  },
  bottomGlow: {
    position: "absolute", bottom: -80, right: -40, width: 220, height: 220,
    borderRadius: 999, backgroundColor: "rgba(56,189,248,0.10)",
  },
  card: {
    borderRadius: 24, padding: 24, backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1, borderColor: "#1e293b", elevation: 12, shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20,
  },
  appBadge: {
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, borderColor: "#4b5563",
    color: "#9ca3af", fontSize: 10, letterSpacing: 1, marginBottom: 12,
  },
  title: { color: "#e5e7eb", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#9ca3af", fontSize: 13, marginTop: 4, marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { color: "#cbd5e1", fontSize: 12, marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: "#020617", borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, color: "#f8fafc", borderWidth: 1, borderColor: "#334155", fontSize: 14,
  },
  forgotText: { color: "#3b82f6", fontSize: 12, fontWeight: "600" },
  
  button: {
    marginTop: 8, backgroundColor: "#22c55e", borderRadius: 999,
    paddingVertical: 14, alignItems: "center",
  },
  buttonDisabled: { opacity: 0.75 },
  buttonText: { color: "#022c22", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },
  
  linkButton: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#94a3b8", fontSize: 13 },
  linkTextStrong: { color: "#60a5fa", fontWeight: "600" },

  // MODAL STYLES
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center", padding: 24,
  },
  modalContent: {
    backgroundColor: "#0f172a", borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: "#1e293b",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#f8fafc", marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: "#94a3b8", marginBottom: 16 },
  modalInput: {
    backgroundColor: "#020617", borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, color: "#f8fafc", borderWidth: 1, borderColor: "#334155",
    fontSize: 14, marginBottom: 20,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalBtnTextCancel: { color: "#94a3b8", fontWeight: "600" },
  modalBtnConfirm: {
    backgroundColor: "#3b82f6", paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 8, alignItems: "center", justifyContent: "center"
  },
  modalBtnTextConfirm: { color: "#fff", fontWeight: "600" },
});