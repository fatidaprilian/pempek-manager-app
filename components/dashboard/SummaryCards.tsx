import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  totalItems: number;
  totalStock: number;
  totalValue: number;
};

export default function SummaryCards({
  totalItems,
  totalStock,
  totalValue,
}: Props) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Jenis</Text>
        <Text style={styles.summaryValue}>{totalItems}</Text>
        <Text style={styles.summaryHint}>Varian pempek</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Stok</Text>
        <Text style={styles.summaryValue}>{totalStock}</Text>
        <Text style={styles.summaryHint}>Pcs tersimpan</Text>
      </View>
      <View style={[styles.summaryCard, styles.summaryCardAccent]}>
        <Text style={styles.summaryLabel}>Nilai Persediaan</Text>
        <Text style={styles.summaryValueSmall}>
          Rp {totalValue.toLocaleString("id-ID")}
        </Text>
        <Text style={styles.summaryHint}>Perkiraan nilai jual</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
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
  summaryCardAccent: {
    borderColor: "#22c55e",
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
});
