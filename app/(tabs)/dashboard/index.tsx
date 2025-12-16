import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import SummaryCards from "../../../components/dashboard/SummaryCards";

import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../supabaseConfig"; // Pastikan path ini benar

import {
  PempekItem,
  createPempek,
  deletePempekById,
  fetchPempekList,
  updatePempek,
} from "../../../services/pempekService";

export default function DashboardPempek() {
  const [items, setItems] = useState<PempekItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // ringkasan
  const [totalItems, setTotalItems] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // kategori
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

  // form tambah/edit
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // foto
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const recomputeSummary = (data: PempekItem[]) => {
    const tItems = data.length;
    const tStock = data.reduce((acc, item) => acc + (item.stock || 0), 0);
    const tValue = data.reduce(
      (acc, item) => acc + (item.stock || 0) * (item.price || 0),
      0
    );
    setTotalItems(tItems);
    setTotalStock(tStock);
    setTotalValue(tValue);
  };

  const normalizeCategory = (value?: string | null) => {
    const trimmed = (value ?? "").trim();
    return trimmed || "Lainnya";
  };

  const recomputeCategories = (data: PempekItem[]) => {
    const cats = Array.from(
      new Set(data.map((item) => normalizeCategory(item.category)))
    ).sort((a, b) => a.localeCompare(b, "id"));
    setAvailableCategories(cats);

    if (selectedCategory !== "Semua" && !cats.includes(selectedCategory)) {
      setSelectedCategory("Semua");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPempekList();
      const sorted = [...data].sort((a, b) =>
        a.name.localeCompare(b.name, "id")
      );
      setItems(sorted);
      recomputeSummary(sorted);
      recomputeCategories(sorted);
    } catch (error) {
      console.log("Error fetch pempek:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setName("");
    setStock("");
    setPrice("");
    setCategory("");
    setEditingId(null);
    setImageUrl(null);
    setShowForm(false);
  };

  const handleSavePempek = async () => {
    if (!name.trim() || !stock.trim() || !price.trim()) {
      Alert.alert("Perhatian", "Nama, stok, dan harga wajib diisi.");
      return;
    }

    const stockNum = parseInt(stock, 10);
    const priceNum = parseInt(price, 10);

    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert("Error", "Stok harus berupa angka ≥ 0.");
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Error", "Harga harus berupa angka > 0.");
      return;
    }

    const finalCategory = normalizeCategory(category);

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        stock: stockNum,
        price: priceNum,
        category: finalCategory,
        imageUrl: imageUrl ?? null,
      };

      if (editingId) {
        await updatePempek(editingId, payload);
      } else {
        await createPempek(payload);
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.log("Error simpan pempek:", error);
      Alert.alert("Error", "Gagal menyimpan pempek. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: PempekItem) => {
    setShowForm(true);
    setEditingId(item.id);
    setName(item.name);
    setStock(String(item.stock));
    setPrice(String(item.price));
    setCategory(item.category ?? "");
    setImageUrl(item.imageUrl ?? null);
  };

  const handleDelete = (item: PempekItem) => {
    Alert.alert(
      "Hapus pempek",
      `Yakin ingin menghapus "${item.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePempekById(item.id);
              // Optimistic update biar cepet
              setItems((prev) => {
                const updated = prev.filter((p) => p.id !== item.id);
                recomputeSummary(updated);
                recomputeCategories(updated);
                return updated;
              });
            } catch (error) {
              console.log("Error hapus pempek:", error);
              Alert.alert("Error", "Gagal menghapus pempek.");
            }
          },
        },
      ]
    );
  };

  // --- UPLOAD KE SUPABASE (Bucket: image_pemek) ---
  const handlePickImage = async () => {
    try {
      setImageUploading(true);

      // 1. Cek Permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Ditolak", "Izin akses galeri diperlukan untuk upload foto.");
        return;
      }

      // 2. Buka Galeri
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // Pakai string 'images' biar aman
        allowsEditing: true,
        quality: 0.5, // Kompresi biar ringan
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setImageUploading(false);
        return;
      }

      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpeg';
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${fileName}`; // Path file di bucket

      // 3. Baca file jadi Base64
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });

      // 4. Upload ke Supabase
      const { data, error } = await supabase.storage
        .from('Image_pempek') // Nama bucket sesuai request Anda
        .upload(filePath, decode(base64), {
          contentType: asset.mimeType || 'image/jpeg',
        });

      if (error) {
        throw error;
      }

      // 5. Ambil Public URL
      const { data: urlData } = supabase.storage
        .from('Image_pempek')
        .getPublicUrl(filePath);

      setImageUrl(urlData.publicUrl);
      console.log("Upload sukses:", urlData.publicUrl);

    } catch (error: any) {
      console.log("Error upload image:", error);
      Alert.alert("Gagal Upload", error.message || "Terjadi kesalahan saat upload.");
    } finally {
      setImageUploading(false);
    }
  };

  const filteredItems =
    selectedCategory === "Semua"
      ? items
      : items.filter(
          (item) => normalizeCategory(item.category) === selectedCategory
        );

  const renderItem = ({ item }: { item: PempekItem }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, item.stock <= 0 ? styles.badgeError : styles.badgeSuccess]}>
            <Text style={[styles.badgeText, item.stock <= 0 ? styles.badgeTextError : styles.badgeTextSuccess]}>
              {item.stock <= 0 ? "Habis" : `${item.stock} Stok`}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {normalizeCategory(item.category)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
              <MaterialCommunityIcons name="food" size={24} color="#4b5563" />
            </View>
          )}
          
          <View style={styles.itemContent}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>
              Rp {item.price.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <MaterialCommunityIcons name="trash-can" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const formTitle = editingId ? "Edit Produk" : "Tambah Produk Baru";
  const saveLabel = saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Produk";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

        <View style={styles.container}>
          <DashboardHeader />

          <SummaryCards
            totalItems={totalItems}
            totalStock={totalStock}
            totalValue={totalValue}
          />

          {/* TOMBOL TAMBAH / FORM */}
          {showForm ? (
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitleText}>{formTitle}</Text>
                <TouchableOpacity onPress={resetForm}>
                  <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View style={styles.formBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nama Pempek</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Kapal Selam Besar"
                    placeholderTextColor="#64748b"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kategori</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Goreng / Rebus / Paket"
                    placeholderTextColor="#64748b"
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Stok</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      value={stock}
                      onChangeText={setStock}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text style={styles.label}>Harga (Rp)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      value={price}
                      onChangeText={setPrice}
                    />
                  </View>
                </View>

                {/* UPLOAD IMAGE AREA */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Foto Produk</Text>
                  <View style={styles.imageUploader}>
                    {imageUrl ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: imageUrl }} style={styles.uploadedImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => setImageUrl(null)}
                        >
                          <MaterialCommunityIcons name="trash-can" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.uploadPlaceholder} 
                        onPress={handlePickImage}
                        disabled={imageUploading}
                      >
                        {imageUploading ? (
                          <ActivityIndicator color="#22c55e" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="camera-plus" size={24} color="#64748b" />
                            <Text style={styles.uploadText}>Pilih Foto</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    saving && styles.saveButtonDisabled
                  ]}
                  onPress={handleSavePempek}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#022c22" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>{saveLabel}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.fabButton}
              onPress={() => {
                setEditingId(null);
                setName("");
                setStock("");
                setPrice("");
                setCategory("");
                setImageUrl(null);
                setShowForm(true);
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#022c22" />
              <Text style={styles.fabText}>Tambah Pempek</Text>
            </TouchableOpacity>
          )}

          {/* FILTER & LIST */}
          <View style={styles.listContainer}>
            <View style={styles.filterContainer}>
              <Text style={styles.sectionTitle}>Daftar Menu</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={["Semua", ...availableCategories]}
                keyExtractor={(item) => item}
                contentContainerStyle={{ paddingRight: 16 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      selectedCategory === item && styles.filterPillActive
                    ]}
                    onPress={() => setSelectedCategory(item)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        selectedCategory === item && styles.filterPillTextActive
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#22c55e" />
              }
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="food-off" size={40} color="#334155" />
                  <Text style={styles.emptyText}>
                    {loading ? "Memuat data..." : "Belum ada data pempek."}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },
  topGlow: {
    position: "absolute",
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.08)",
  },
  bottomGlow: {
    position: "absolute",
    bottom: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.08)",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  
  // --- FORM STYLES ---
  formContainer: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 16,
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    backgroundColor: "#1e293b50",
  },
  formTitleText: {
    color: "#f8fafc",
    fontWeight: "600",
    fontSize: 14,
  },
  formBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
  },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f8fafc",
    fontSize: 13,
  },
  imageUploader: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  uploadText: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 999,
    padding: 4,
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  saveButton: {
    backgroundColor: "#22c55e",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#022c22",
    fontWeight: "700",
    fontSize: 13,
  },

  // --- FAB & FILTER ---
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 20,
    gap: 6,
  },
  fabText: {
    color: "#022c22",
    fontWeight: "700",
    fontSize: 13,
  },
  listContainer: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1e293b",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterPillActive: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderColor: "#22c55e",
  },
  filterPillText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  filterPillTextActive: {
    color: "#4ade80",
    fontWeight: "600",
  },

  // --- CARD STYLES ---
  card: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuccess: { backgroundColor: "rgba(34,197,94,0.1)" },
  badgeError: { backgroundColor: "rgba(239,68,68,0.1)" },
  badgeText: { fontSize: 10, fontWeight: "600" },
  badgeTextSuccess: { color: "#4ade80" },
  badgeTextError: { color: "#f87171" },
  
  categoryBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    color: "#94a3b8",
    fontSize: 10,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#1e293b",
  },
  itemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    justifyContent: "center",
  },
  itemName: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemPrice: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "700",
  },
  cardActions: {
    flexDirection: "column",
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#3b82f6",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    opacity: 0.5,
  },
  emptyText: {
    color: "#94a3b8",
    marginTop: 8,
    fontSize: 13,
  },
});