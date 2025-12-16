import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker'; // Pastikan library ini sudah diinstall
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import { generateReportPDF } from "../../../services/pdfService";
import { fetchTransactions, TransactionItem } from "../../../services/transactionService";

// --- HELPER FUNCTIONS ---

// Format tanggal untuk tampilan UI (misal: 20 Nov 2025)
const formatDateDisplay = (date: Date, type: 'daily' | 'monthly') => {
  if (type === 'monthly') {
    return date.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
};

// Format jam untuk list history (14:30)
const formatTime = (timestamp: any) => {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
};

export default function ReportsScreen() {
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- STATE FILTER ---
  const [filterType, setFilterType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load data dari Firebase (ambil semua dulu, filter di client biar cepat)
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTransactions();
      setAllTransactions(data);
    } catch (error) {
      console.log("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- LOGIC FILTERING & KALKULASI ---
  // Menggunakan useMemo agar tidak hitung ulang kalau tidak perlu
  const { filteredData, income, expense, netProfit, transCount } = useMemo(() => {
    // 1. Filter Data berdasarkan Tanggal/Bulan yang dipilih
    const filtered = allTransactions.filter((t) => {
      if (!t.createdAt) return false;
      const tDate = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      
      if (filterType === 'daily') {
        // Cek Tanggal, Bulan, Tahun harus sama
        return (
          tDate.getDate() === selectedDate.getDate() &&
          tDate.getMonth() === selectedDate.getMonth() &&
          tDate.getFullYear() === selectedDate.getFullYear()
        );
      } else {
        // Mode Bulanan: Cek Bulan dan Tahun saja
        return (
          tDate.getMonth() === selectedDate.getMonth() &&
          tDate.getFullYear() === selectedDate.getFullYear()
        );
      }
    });

    // 2. Hitung Keuangan dari data yang sudah difilter
    let totalIncome = 0;
    let totalExpense = 0;

    filtered.forEach((t) => {
      const amount = t.total || 0;
      if (t.type === 'sale') {
        totalIncome += amount;
      } else if (t.type === 'expense') {
        totalExpense += amount;
      }
    });

    return {
      filteredData: filtered,
      income: totalIncome,
      expense: totalExpense,
      netProfit: totalIncome - totalExpense,
      transCount: filtered.length
    };
  }, [allTransactions, filterType, selectedDate]);

  // Handle ganti tanggal
  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleDownload = () => {
    if (filteredData.length === 0) return;
    generateReportPDF(filteredData, income, expense);
  };

  const renderTransactionItem = (item: TransactionItem) => {
    const isSale = item.type === 'sale';
    
    return (
      <View key={item.id} style={styles.transCard}>
        <View style={[styles.transIcon, isSale ? styles.bgGreenSoft : styles.bgRedSoft]}>
          <MaterialCommunityIcons 
            name={isSale ? "arrow-bottom-left" : "arrow-top-right"} 
            size={24} 
            color={isSale ? "#22c55e" : "#ef4444"} 
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.transTitle}>
            {isSale ? "Pemasukan" : "Pengeluaran"}
          </Text>
          {/* Tampilkan Jam saja karena tanggal sudah ada di header filter */}
          <Text style={styles.transDate}>Pukul {formatTime(item.createdAt)}</Text>
          
          <Text style={styles.transItems} numberOfLines={1} ellipsizeMode="tail">
            {isSale 
              ? item.items?.map(i => `${i.productName} (${i.qty})`).join(", ")
              : item.note 
            }
          </Text>
        </View>
        <Text style={[styles.transAmount, isSale ? styles.textGreen : styles.textRed]}>
          {isSale ? "+" : "-"} Rp {item.total.toLocaleString("id-ID")}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={styles.container}>
        <DashboardHeader 
          badge="KEUANGAN"
          title="Laporan Laba Rugi"
          subtitle="Analisis pemasukan bersih dan pengeluaran operasional."
        />

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#22c55e"/>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          
          {/* --- FILTER SECTION --- */}
          <View style={styles.filterContainer}>
            {/* Tombol Switch Harian / Bulanan */}
            <View style={styles.switchContainer}>
              <TouchableOpacity 
                style={[styles.switchBtn, filterType === 'daily' && styles.switchBtnActive]}
                onPress={() => setFilterType('daily')}
              >
                <Text style={[styles.switchText, filterType === 'daily' && styles.switchTextActive]}>Harian</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.switchBtn, filterType === 'monthly' && styles.switchBtnActive]}
                onPress={() => setFilterType('monthly')}
              >
                <Text style={[styles.switchText, filterType === 'monthly' && styles.switchTextActive]}>Bulanan</Text>
              </TouchableOpacity>
            </View>

            {/* Pemilih Tanggal */}
            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
              <MaterialCommunityIcons name="calendar-month" size={20} color="#94a3b8" />
              <Text style={styles.dateSelectorText}>
                {formatDateDisplay(selectedDate, filterType)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date" // Android tidak support mode 'month' native, jadi pakai date biasa
                display="default"
                maximumDate={new Date()} // 🔒 Proteksi: Tidak bisa pilih masa depan
                onChange={onDateChange}
              />
            )}
          </View>

          {/* KARTU LABA BERSIH */}
          <View style={[styles.profitCard, netProfit < 0 && styles.profitCardLoss]}>
            <View style={styles.profitHeader}>
              <Text style={styles.profitLabel}>Laba Bersih ({filterType === 'daily' ? 'Hari Ini' : 'Bulan Ini'})</Text>
              <MaterialCommunityIcons name="wallet-outline" size={20} color="#94a3b8" />
            </View>
            <Text style={styles.profitValue}>
              Rp {netProfit.toLocaleString("id-ID")}
            </Text>
            <Text style={styles.profitHint}>
              {netProfit >= 0 ? "Profit aman terkendali 👍" : "Waduh, pengeluaran lebih besar 📉"}
            </Text>
          </View>

          {/* OMZET & PENGELUARAN */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.iconBg, styles.bgGreenSoft]}>
                <MaterialCommunityIcons name="cash-plus" size={22} color="#22c55e" />
              </View>
              <Text style={styles.statLabel}>Pemasukan</Text>
              <Text style={[styles.statValue, styles.textGreen]}>
                Rp {income.toLocaleString("id-ID")}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.iconBg, styles.bgRedSoft]}>
                <MaterialCommunityIcons name="cash-minus" size={22} color="#ef4444" />
              </View>
              <Text style={styles.statLabel}>Pengeluaran</Text>
              <Text style={[styles.statValue, styles.textRed]}>
                Rp {expense.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>

          {/* HEADER RIWAYAT & TOMBOL DOWNLOAD */}
          <View style={styles.historyHeaderRow}>
            <Text style={styles.sectionTitle}>Riwayat ({transCount})</Text>
            
            {filteredData.length > 0 && (
              <TouchableOpacity style={styles.exportButton} onPress={handleDownload}>
                <MaterialCommunityIcons name="file-pdf-box" size={18} color="#fff" />
                <Text style={styles.exportText}>PDF</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
             <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 20 }} />
          ) : filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>Tidak ada transaksi pada periode ini.</Text>
            </View>
          ) : (
            <View>
              {filteredData.map((item) => renderTransactionItem(item))}
            </View>
          )}

        </ScrollView>
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
    paddingTop: 32,
  },
  
  // FILTER STYLES
  filterContainer: {
    marginBottom: 16,
    gap: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 4,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  switchBtnActive: {
    backgroundColor: '#334155',
  },
  switchText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#fff',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dateSelectorText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },

  // PROFIT CARD
  profitCard: {
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#22c55e", 
    marginBottom: 12,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  profitCardLoss: {
    borderColor: "#ef4444", 
    shadowColor: "#ef4444",
  },
  profitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  profitLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profitValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#f8fafc",
  },
  profitHint: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 4,
  },

  // STATS CARDS
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  // COLORS
  textGreen: { color: "#4ade80" },
  textRed: { color: "#f87171" },
  bgGreenSoft: { backgroundColor: "rgba(34,197,94,0.15)" },
  bgRedSoft: { backgroundColor: "rgba(239,68,68,0.15)" },

  // HISTORY LIST
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  exportText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  transCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  transIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  transTitle: {
    color: "#f8fafc",
    fontWeight: "600",
    fontSize: 14,
  },
  transDate: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  transItems: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  transAmount: {
    fontWeight: "700",
    fontSize: 13,
  },
  
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    opacity: 0.6,
  },
  emptyText: {
    color: "#94a3b8",
    marginTop: 12,
    fontSize: 13,
  },
});