import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export type LocationCoords = {
  lat: number;
  lng: number;
};

export type InventoryItem = {
  id: string;
  skuName: string;
  description?: string;
  qty: number;
  linkedTrackerId: string | null;
  lastLocation: LocationCoords | null;
  lastUpdated: string;
};

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => void;
  deleteItem: (id: string) => void;
  importCSV: (parsedData: { skuName: string; description?: string; qty: number }[]) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      items: [],
      
      addItem: (itemData) => set((state) => ({
        items: [
          ...state.items,
          {
            ...itemData,
            id: uuidv4(),
            lastUpdated: new Date().toISOString(),
          }
        ]
      })),

      updateItem: (id, updates) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id 
            ? { ...item, ...updates, lastUpdated: new Date().toISOString() }
            : item
        )
      })),

      deleteItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),

      importCSV: (parsedData) => set((state) => {
        const newItems = [...state.items];
        
        parsedData.forEach((row) => {
          if (!row.skuName) return;
          
          const existingIndex = newItems.findIndex(
            (i) => i.skuName.toLowerCase().trim() === row.skuName.toLowerCase().trim()
          );

          if (existingIndex >= 0) {
            // Update quantity and description of existing SKU
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              qty: row.qty,
              description: row.description || newItems[existingIndex].description,
              lastUpdated: new Date().toISOString()
            };
          } else {
            // Add new SKU
            newItems.push({
              id: uuidv4(),
              skuName: row.skuName.trim(),
              description: row.description?.trim(),
              qty: row.qty,
              linkedTrackerId: null,
              lastLocation: null,
              lastUpdated: new Date().toISOString()
            });
          }
        });

        return { items: newItems };
      }),
    }),
    {
      name: 'valtir-inventory-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
