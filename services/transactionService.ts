import {
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    runTransaction,
    serverTimestamp, // <--- Tambahan import
    Timestamp
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Tipe data untuk item di keranjang belanja
export type CartItem = {
  productId: string;
  productName: string;
  qty: number;
  price: number;
};

// Tipe data untuk riwayat transaksi
export type TransactionItem = {
  id: string;
  type: "sale" | "expense";
  items?: CartItem[]; // Ada kalau sale
  note?: string;      // Ada kalau expense
  total: number;
  createdAt: any; 
};

/**
 * TRANSAKSI PENJUALAN (SALE)
 * - Mengurangi stok atomik
 * - Simpan history
 */
export async function createSaleTransaction(items: CartItem[], total: number) {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Cek & Kurangi Stok
      for (const item of items) {
        const productRef = doc(db, "pempek", item.productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) {
          throw "Produk tidak ditemukan: " + item.productName;
        }

        const currentStock = productSnap.data().stock || 0;
        if (currentStock < item.qty) {
          throw `Stok tidak cukup untuk ${item.productName}. Sisa: ${currentStock}`;
        }

        transaction.update(productRef, {
          stock: currentStock - item.qty,
        });
      }

      // 2. Simpan Transaksi
      const newTransRef = doc(collection(db, "transactions"));
      transaction.set(newTransRef, {
        type: "sale",
        items: items,
        total: total,
        createdAt: serverTimestamp(),
      });
    });

    return true;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
}

/**
 * TRANSAKSI PENGELUARAN (EXPENSE)
 * - Tidak mengurangi stok produk jadi (karena biasanya beli bahan baku)
 * - Hanya mencatat uang keluar
 */
export async function createExpenseTransaction(note: string, amount: number, date: Date) {
  try {
    await addDoc(collection(db, "transactions"), {
      type: "expense",
      note: note,        // Misal: "Beli Ikan Tenggiri 5kg"
      total: amount,     // Nominal pengeluaran
      createdAt: Timestamp.fromDate(date),
    });
    return true;
  } catch (error) {
    console.error("Expense failed: ", error);
    throw error;
  }
}

/**
 * AMBIL SEMUA RIWAYAT
 */
export async function fetchTransactions(): Promise<TransactionItem[]> {
  try {
    const q = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        items: data.items,
        note: data.note,
        total: data.total,
        createdAt: data.createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetch transactions:", error);
    return [];
  }
}