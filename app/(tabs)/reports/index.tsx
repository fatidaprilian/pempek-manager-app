import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    PempekItem,
    fetchPempekList,
} from "../../../services/pempekService";

export default function ReportsScreen() {
  const [items, setItems] = useState<PempekItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ringkasan
  const [totalItems, setTotalItems] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  const recomputeSummary = (data: PempekItem[]) => {
    const tItems = data.length;
    const tStock = data.reduce((acc, item) => acc + (item.stock || 0), 0);
    const tValue = data.reduce(
      (acc, item) => acc + (item.stock || 0) * (item.price || 0),
      0
    );
    const habis = data.filter((item) => (item.stock || 0) <= 0).length;

    setTotalItems(tItems);
    setTotalStock(tStock);
    setTotalValue(tValue);
    setOutOfStockCount(habis);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPempekList();

      // urutkan yang stok rendah di atas
      const sorted = [...data].sort((a, b) => (a.stock || 0) - (b.stock || 0));

      setItems(sorted);
      recomputeSummary(sorted);
    } catch (error) {
      console.log("Error fetch laporan pempek:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStockItems = items.filter((item) => item.stock <= 5);

  const renderLowStockItem = ({ item }: { item: PempekItem }) => (
    <View style={styles.lowCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.lowName}>{item.name}</Text>
        <Text style={styles.lowCategory}>
          Kategori: {item.category ?? "Lainnya"}
        </Text>
        <Text style={styles.lowInfo}>
          Harga:{" "}
          <Text style={styles.lowPrice}>
            Rp {item.price.toLocaleString("id-ID")}
          </Text>
        </Text>
      </View>
      <View style={styles.lowBadge}>
        <Text style={styles.lowBadgeText}>
          {item.stock <= 0 ? "Habis" : `Sisa ${item.stock}`}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.badge}>LAPORAN</Text>
          <Text style={styles.title}>Laporan Stok</Text>
          <Text style={styles.subtitle}>
            Rekap varian pempek, stok tersisa, dan nilai persediaan.
          </Text>
        </View>

        {/* RINGKASAN */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Varian</Text>
            <Text style={styles.summaryValue}>{totalItems}</Text>
            <Text style={styles.summaryHint}>Jenis pempek</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Stok</Text>
            <Text style={styles.summaryValue}>{totalStock}</Text>
            <Text style={styles.summaryHint}>Pcs tersimpan</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Nilai Persediaan</Text>
            <Text style={styles.summaryValueSmall}>
              Rp {totalValue.toLocaleString("id-ID")}
            </Text>
            <Text style={styles.summaryHint}>Perkiraan nilai jual</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardWarning]}>
            <Text style={styles.summaryLabel}>Stok Habis / Nol</Text>
            <Text style={styles.summaryValue}>{outOfStockCount}</Text>
            <Text style={styles.summaryHint}>Perlu isi ulang</Text>
          </View>
        </View>

        {/* SECTION LOW STOCK */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stok Rendah (&lt;= 5 pcs)</Text>
          {loading && (
            <ActivityIndicator size="small" color="#22c55e" />
          )}
        </View>

        <FlatList
          data={lowStockItems}
          keyExtractor={(item) => item.id}
          renderItem={renderLowStockItem}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {loading
                ? "Menghitung laporan stok..."
                : "Belum ada pempek dengan stok rendah."}
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </View>
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
  header: {
    marginBottom: 16,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
    color: "#9ca3af",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  subtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  summaryCardWarning: {
    borderColor: "#f97316",
  },
  summaryLabel: {
    color: "#9ca3af",
    fontSize: 11,
  },
  summaryValue: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryValueSmall: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  summaryHint: {
    color: "#6b7280",
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 6,
    gap: 8,
  },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  lowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  lowName: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
  },
  lowCategory: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  lowInfo: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  lowPrice: {
    color: "#22c55e",
    fontWeight: "600",
  },
  lowBadge: {
    backgroundColor: "rgba(248,113,113,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#ef4444",
    marginLeft: 8,
  },
  lowBadgeText: {
    color: "#fecaca",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
  },
});
