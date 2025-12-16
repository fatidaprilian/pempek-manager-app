import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { fetchPempekList, PempekItem } from "../../../services/pempekService";
import { CartItem, createExpenseTransaction, createSaleTransaction } from "../../../services/transactionService";

export default function TransactionScreen() {
  // Mode: 'sale' (Kasir) atau 'expense' (Pengeluaran)
  const [mode, setMode] = useState<'sale' | 'expense'>('sale');
  
  // STATE PENJUALAN
  const [products, setProducts] = useState<PempekItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // STATE PENGELUARAN
  const [expNote, setExpNote] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (mode === 'sale') {
      loadProducts();
    }
  }, [mode]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchPempekList();
      setProducts(data.filter(p => p.stock > 0)); // Hanya produk ready
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC KASIR (SALE) ---
  const addToCart = (item: PempekItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.id);
      if (existing) {
        if (existing.qty + 1 > item.stock) {
          Alert.alert("Stok Habis", `Sisa stok hanya ${item.stock}`);
          return prev;
        }
        return prev.map((c) => c.productId === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { productId: item.id, productName: item.name, qty: 1, price: item.price }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing && existing.qty > 1) {
        return prev.map((c) => c.productId === productId ? { ...c, qty: c.qty - 1 } : c);
      }
      return prev.filter((c) => c.productId !== productId);
    });
  };

  const totalHarga = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleCheckoutSale = async () => {
    if (cart.length === 0) return;
    Alert.alert("Konfirmasi", `Proses penjualan Rp ${totalHarga.toLocaleString("id-ID")}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Proses",
        onPress: async () => {
          try {
            setSubmitting(true);
            await createSaleTransaction(cart, totalHarga);
            Alert.alert("Sukses", "Penjualan berhasil!");
            setCart([]);
            loadProducts();
          } catch (e: any) {
            Alert.alert("Gagal", e.toString());
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  // --- LOGIC PENGELUARAN (EXPENSE) ---
  const handleSaveExpense = async () => {
    if (!expNote.trim() || !expAmount.trim()) {
      Alert.alert("Error", "Nama dan nominal wajib diisi.");
      return;
    }
    try {
      setSubmitting(true);
      await createExpenseTransaction(expNote, parseInt(expAmount), expDate);
      Alert.alert("Sukses", "Pengeluaran tercatat.");
      setExpNote("");
      setExpAmount("");
      setExpDate(new Date());
    } catch (e: any) {
      Alert.alert("Gagal", e.toString());
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDER UI ---
  const renderProduct = ({ item }: { item: PempekItem }) => {
    const inCart = cart.find((c) => c.productId === item.id);
    const qty = inCart ? inCart.qty : 0;
    return (
      <View style={styles.productCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.prodName}>{item.name}</Text>
          <Text style={styles.prodPrice}>Rp {item.price.toLocaleString("id-ID")}</Text>
          <Text style={styles.prodStock}>Sisa: {item.stock}</Text>
        </View>
        <View style={styles.counter}>
          {qty > 0 && (
            <>
              <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.minusBtn}>
                <MaterialCommunityIcons name="minus" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
            </>
          )}
          <TouchableOpacity onPress={() => addToCart(item)} style={styles.plusBtn}>
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.topGlow} />
      
      <View style={styles.container}>
        {/* TOGGLE SWITCH MODE */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, mode === 'sale' && styles.toggleBtnActive]}
            onPress={() => setMode('sale')}
          >
            <Text style={[styles.toggleText, mode === 'sale' && styles.toggleTextActive]}>Penjualan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, mode === 'expense' && styles.toggleBtnActive]}
            onPress={() => setMode('expense')}
          >
            <Text style={[styles.toggleText, mode === 'expense' && styles.toggleTextActive]}>Pengeluaran</Text>
          </TouchableOpacity>
        </View>

        {mode === 'sale' ? (
          // MODE KASIR
          <>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={renderProduct}
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada produk tersedia.</Text>}
              refreshing={loading}
              onRefresh={loadProducts}
            />
            {cart.length > 0 && (
              <View style={styles.checkoutPanel}>
                <View>
                  <Text style={styles.totalLabel}>Total Masuk</Text>
                  <Text style={styles.totalValue}>Rp {totalHarga.toLocaleString("id-ID")}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckoutSale} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#022c22" /> : <Text style={styles.checkoutText}>Terima Uang</Text>}
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          // MODE PENGELUARAN FORM
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Catat Pengeluaran Operasional</Text>
              <Text style={styles.formSubtitle}>Catat beli bahan baku, gas, listrik, dll.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Pengeluaran</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Contoh: Beli Ikan Tenggiri 2kg" 
                  placeholderTextColor="#64748b"
                  value={expNote}
                  onChangeText={setExpNote}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nominal (Rp)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="0" 
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  value={expAmount}
                  onChangeText={setExpAmount}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tanggal</Text>
                <TouchableOpacity 
                  style={styles.datePickerBtn}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialCommunityIcons name="calendar" size={20} color="#94a3b8" />
                  <Text style={styles.dateText}>{expDate.toLocaleDateString("id-ID")}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={expDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setExpDate(selectedDate);
                  }}
                />
              )}

              <TouchableOpacity 
                style={[styles.saveBtn, submitting && styles.disabledBtn]} 
                onPress={handleSaveExpense}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Pengeluaran</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617" },
  topGlow: {
    position: "absolute", top: -80, right: -40, width: 200, height: 200,
    borderRadius: 999, backgroundColor: "rgba(56,189,248,0.10)",
  },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  
  // Toggle
  toggleContainer: {
    flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 16
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#334155' },
  toggleText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  toggleTextActive: { color: '#fff' },

  // Product List
  productCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0f172a", borderRadius: 12,
    padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#1e293b",
  },
  prodName: { color: "#f8fafc", fontWeight: "600", fontSize: 14 },
  prodPrice: { color: "#22c55e", fontSize: 13, marginTop: 2 },
  prodStock: { color: "#64748b", fontSize: 11, marginTop: 2 },
  counter: { flexDirection: "row", alignItems: "center", gap: 10 },
  minusBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center"
  },
  plusBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center"
  },
  qtyText: { color: "#fff", fontSize: 14, fontWeight: "bold", minWidth: 10, textAlign: "center" },
  emptyText: { color: "#9ca3af", textAlign: "center", marginTop: 20 },

  // Checkout Panel
  checkoutPanel: {
    position: "absolute", bottom: 100, left: 16, right: 16,
    backgroundColor: "#1e293b", borderRadius: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, shadowColor: "#000", elevation: 10, borderWidth: 1, borderColor: "#334155"
  },
  totalLabel: { color: "#94a3b8", fontSize: 11 },
  totalValue: { color: "#22c55e", fontSize: 18, fontWeight: "700" },
  checkoutBtn: {
    backgroundColor: "#22c55e", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999,
  },
  checkoutText: { color: "#022c22", fontWeight: "700", fontSize: 13 },

  // Expense Form
  formCard: {
    backgroundColor: "#0f172a", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#1e293b"
  },
  formTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  formSubtitle: { color: "#94a3b8", fontSize: 12, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { color: "#cbd5e1", fontSize: 12, marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: "#020617", borderWidth: 1, borderColor: "#334155",
    borderRadius: 8, padding: 12, color: "#fff"
  },
  datePickerBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#020617", borderWidth: 1, borderColor: "#334155",
    borderRadius: 8, padding: 12
  },
  dateText: { color: "#fff" },
  saveBtn: {
    backgroundColor: "#ef4444", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 10
  },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 }
});