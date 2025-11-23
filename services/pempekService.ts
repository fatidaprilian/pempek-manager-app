// services/pempekService.ts
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export type PempekItem = {
  id: string;
  name: string;
  stock: number;
  price: number;
  category?: string;      // kategori optional
  imageUrl?: string | null; // ⬅️ NEW: url foto (opsional)
};

const collectionName = "pempek";

export async function fetchPempekList(): Promise<PempekItem[]> {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name ?? "Tanpa nama",
      stock: typeof data.stock === "number" ? data.stock : 0,
      price: typeof data.price === "number" ? data.price : 0,
      category: data.category ?? "Lainnya",
      imageUrl: data.imageUrl ?? null, // ⬅️ NEW
    };
  });
}

export async function createPempek(input: {
  name: string;
  stock: number;
  price: number;
  category?: string;
  imageUrl?: string | null; // ⬅️ NEW
}) {
  const colRef = collection(db, collectionName);
  await addDoc(colRef, {
    name: input.name,
    stock: input.stock,
    price: input.price,
    category: input.category ?? "Lainnya",
    imageUrl: input.imageUrl ?? null, // ⬅️ NEW
    createdAt: new Date(),
  });
}

export async function updatePempek(
  id: string,
  input: {
    name: string;
    stock: number;
    price: number;
    category?: string;
    imageUrl?: string | null; // ⬅️ NEW
  }
) {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, {
    name: input.name,
    stock: input.stock,
    price: input.price,
    category: input.category ?? "Lainnya",
    imageUrl: input.imageUrl ?? null, // ⬅️ NEW
  });
}

export async function deletePempekById(id: string) {
  const ref = doc(db, collectionName, id);
  await deleteDoc(ref);
}
