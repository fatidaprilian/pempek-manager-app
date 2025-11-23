import React, { useEffect, useState } from "react";
import {
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

import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../firebase/firebaseConfig";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      Alert.alert("Error", "Nama, stok, dan harga wajib diisi.");
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

      if (editingId) {
        await updatePempek(editingId, {
          name: name.trim(),
          stock: stockNum,
          price: priceNum,
          category: finalCategory,
          imageUrl: imageUrl ?? null,
        });
      } else {
        await createPempek({
          name: name.trim(),
          stock: stockNum,
          price: priceNum,
          category: finalCategory,
          imageUrl: imageUrl ?? null,
        });
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

  const handlePickImage = async () => {
    try {
      setImageUploading(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin dibutuhkan",
          "Izin akses galeri diperlukan untuk upload foto."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const fileName = `pempek-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      const storageRef = ref(storage, `pempek-images/${fileName}`);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      setImageUrl(downloadUrl);
    } catch (error) {
      console.log("Error upload image:", error);
      Alert.alert("Error", "Gagal mengupload foto.");
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
    <View>
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.cardChipRow}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>
                {item.stock <= 0 ? "Habis" : "Stok"}
              </Text>
            </View>
            <View style={styles.cardCategoryChip}>
              <Text style={styles.cardCategoryText}>
                {normalizeCategory(item.category)}
              </Text>
            </View>
          </View>

          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : null}

          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemInfo}>Stok: {item.stock}</Text>
          <Text style={styles.itemInfoPrice}>
            Harga:{" "}
            <Text style={styles.itemInfoPriceHighlight}>
              Rp {item.price.toLocaleString("id-ID")}
            </Text>
          </Text>
        </View>
        <View style={styles.cardButtons}>
          <TouchableOpacity
            style={[styles.smallButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.deleteText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const formTitle = editingId ? "Edit Pempek" : "Tambah Pempek";
  const saveLabel = saving
    ? "Menyimpan..."
    : editingId
    ? "Simpan Perubahan"
    : "Simpan";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

        <View style={styles.container}>
          {/* HEADER */}
          <DashboardHeader />

          {/* RINGKASAN */}
          <SummaryCards
            totalItems={totalItems}
            totalStock={totalStock}
            totalValue={totalValue}
          />

          {/* FORM */}
          {showForm ? (
            <View style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <Text style={styles.formTitle}>{formTitle}</Text>
                {editingId && (
                  <Text style={styles.formModeLabel}>Mode edit</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nama Pempek</Text>
                <TextInput
                  style={styles.input}
                  placeholder="mis. Kapal Selam"
                  placeholderTextColor="#6b7280"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Kategori</Text>
                <TextInput
                  style={styles.input}
                  placeholder="mis. Goreng, Rebus, Paket, Lainnya"
                  placeholderTextColor="#6b7280"
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              {/* UPLOAD FOTO */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Foto Pempek (opsional)</Text>

                {imageUrl ? (
                  <View style={styles.imagePreviewRow}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={[styles.formButton, styles.cancelButton]}
                      onPress={() => setImageUrl(null)}
                      disabled={imageUploading}
                    >
                      <Text style={styles.cancelText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.formButton,
                    styles.pickImageButton,
                    { marginTop: imageUrl ? 8 : 0 },
                  ]}
                  onPress={handlePickImage}
                  disabled={imageUploading}
                >
                  <Text style={styles.pickImageText}>
                    {imageUploading ? "Mengupload..." : "Pilih Foto dari Galeri"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.label}>Stok</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="contoh: 10"
                    placeholderTextColor="#6b7280"
                    keyboardType="number-pad"
                    value={stock}
                    onChangeText={setStock}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.label}>Harga (Rp)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="contoh: 15000"
                    placeholderTextColor="#6b7280"
                    keyboardType="number-pad"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </View>

              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={resetForm}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formButton,
                    saving ? styles.saveButtonDisabled : styles.saveButton,
                  ]}
                  onPress={handleSavePempek}
                  disabled={saving}
                >
                  <Text style={styles.saveText}>{saveLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
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
              <Text style={styles.addButtonText}>+ Tambah Pempek</Text>
            </TouchableOpacity>
          )}

          {/* FILTER KATEGORI */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Filter kategori:</Text>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategory === "Semua" && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory("Semua")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === "Semua" &&
                      styles.filterChipTextActive,
                  ]}
                >
                  Semua
                </Text>
              </TouchableOpacity>

              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    selectedCategory === cat && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === cat && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* LIST */}
          <Text style={styles.listTitle}>Daftar pempek</Text>
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadData} />
            }
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {loading
                  ? "Memuat data pempek..."
                  : "Belum ada data pempek. Tambah dulu di atas."}
              </Text>
            }
          />
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
    top: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
  },
  bottomGlow: {
    position: "absolute",
    bottom: -120,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.10)",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  addButton: {
    backgroundColor: "#22c55e",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  addButtonText: {
    color: "#022c22",
    fontWeight: "700",
    fontSize: 14,
  },
  formCard: {
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  formHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  formTitle: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 15,
  },
  formModeLabel: {
    marginLeft: 8,
    fontSize: 10,
    color: "#f97316",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f97316",
  },
  fieldGroup: {
    marginBottom: 10,
  },
  label: {
    color: "#d1d5db",
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#020617",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f9fafb",
    borderWidth: 1,
    borderColor: "#1f2937",
    fontSize: 13,
  },
  row2: {
    flexDirection: "row",
    marginBottom: 4,
  },
  formButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    gap: 8,
  },
  formButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  cancelText: {
    color: "#9ca3af",
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: "#22c55e",
  },
  saveButtonDisabled: {
    backgroundColor: "#16a34a",
    opacity: 0.7,
  },
  saveText: {
    color: "#022c22",
    fontWeight: "600",
    fontSize: 12,
  },
  pickImageButton: {
    backgroundColor: "#0ea5e9",
    alignSelf: "flex-start",
  },
  pickImageText: {
    color: "#e0f2fe",
    fontSize: 12,
    fontWeight: "600",
  },
  imagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  filterRow: {
    marginTop: 4,
    marginBottom: 6,
  },
  filterLabel: {
    color: "#9ca3af",
    fontSize: 11,
    marginBottom: 4,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1e293b",
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  filterChipActive: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: "#22c55e",
  },
  filterChipText: {
    color: "#9ca3af",
    fontSize: 11,
  },
  filterChipTextActive: {
    color: "#bbf7d0",
    fontWeight: "600",
  },
  listTitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 6,
    marginTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardLeft: {
    flex: 1,
  },
  cardChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(31,41,55,0.9)",
  },
  cardBadgeText: {
    color: "#9ca3af",
    fontSize: 10,
  },
  cardCategoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(22,163,74,0.15)",
  },
  cardCategoryText: {
    color: "#4ade80",
    fontSize: 10,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  itemName: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
  },
  itemInfo: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },
  itemInfoPrice: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },
  itemInfoPriceHighlight: {
    color: "#22c55e",
    fontWeight: "600",
  },
  cardButtons: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 10,
    gap: 6,
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  editButton: {
    backgroundColor: "#3b82f6",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  editText: {
    color: "#f9fafb",
    fontSize: 11,
    fontWeight: "600",
  },
  deleteText: {
    color: "#f9fafb",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
  },
});
