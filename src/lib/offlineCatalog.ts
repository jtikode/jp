"use client";

import type { CatalogProduct } from "@/lib/productCatalog";

// A full local copy of the org's active catalog, stored in IndexedDB (not
// localStorage — this can run to several thousand rows, too big to parse
// synchronously on the main thread every time). Lets the shop keep working
// — browsing, searching, ordering — with zero signal, instead of only
// whatever single page happened to be cached by the service worker.
const DB_NAME = "jpt-shop-offline";
const DB_VERSION = 1;
const PRODUCTS_STORE = "products";
const META_STORE = "meta";
const SAVED_AT_KEY = "catalogSavedAt";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        db.createObjectStore(PRODUCTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCatalogSnapshot(products: CatalogProduct[]): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([PRODUCTS_STORE, META_STORE], "readwrite");
      const store = tx.objectStore(PRODUCTS_STORE);
      store.clear();
      for (const p of products) store.put(p);
      tx.objectStore(META_STORE).put(Date.now(), SAVED_AT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getCatalogSnapshot(): Promise<CatalogProduct[]> {
  const db = await openDb();
  try {
    return await new Promise<CatalogProduct[]>((resolve, reject) => {
      const tx = db.transaction(PRODUCTS_STORE, "readonly");
      const req = tx.objectStore(PRODUCTS_STORE).getAll();
      req.onsuccess = () => resolve(req.result as CatalogProduct[]);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function getCatalogSnapshotSavedAt(): Promise<number | null> {
  const db = await openDb();
  try {
    return await new Promise<number | null>((resolve, reject) => {
      const tx = db.transaction(META_STORE, "readonly");
      const req = tx.objectStore(META_STORE).get(SAVED_AT_KEY);
      req.onsuccess = () => resolve((req.result as number | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
