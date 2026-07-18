import { create } from 'zustand';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../../api/client';

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
  fetchInventory: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  importCSV: (parsedData: { skuName: string; description?: string; qty: number }[]) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  
  fetchInventory: async () => {
    try {
      const response = await api.get('/api/inventory/');
      const backendItems = response.data.map((i: any) => ({
        id: i.id,
        skuName: i.sku_name,
        description: i.description || '',
        qty: i.qty,
        linkedTrackerId: i.linked_tracker_id,
        lastLocation: i.last_location_lat && i.last_location_lng 
          ? { lat: i.last_location_lat, lng: i.last_location_lng } 
          : null,
        lastUpdated: i.last_updated
      }));
      set({ items: backendItems });
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  },
      
  addItem: async (itemData) => {
    try {
      const payload = {
        sku_name: itemData.skuName,
        description: itemData.description,
        qty: itemData.qty,
        linked_tracker_id: itemData.linkedTrackerId,
        last_location_lat: itemData.lastLocation?.lat,
        last_location_lng: itemData.lastLocation?.lng
      };
      await api.post('/api/inventory/', payload);
      await get().fetchInventory();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  },

  updateItem: async (id, updates) => {
    try {
      // Find the current item locally
      const currentItem = get().items.find(i => i.id === id);
      if (!currentItem) return;

      const payload = {
        sku_name: updates.skuName !== undefined ? updates.skuName : currentItem.skuName,
        description: updates.description !== undefined ? updates.description : currentItem.description,
        qty: updates.qty !== undefined ? updates.qty : currentItem.qty,
        linked_tracker_id: updates.linkedTrackerId !== undefined ? updates.linkedTrackerId : currentItem.linkedTrackerId,
        last_location_lat: updates.lastLocation?.lat !== undefined ? updates.lastLocation?.lat : currentItem.lastLocation?.lat,
        last_location_lng: updates.lastLocation?.lng !== undefined ? updates.lastLocation?.lng : currentItem.lastLocation?.lng
      };
      
      await api.put(`/api/inventory/${id}`, payload);
      await get().fetchInventory();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  },

  deleteItem: async (id) => {
    try {
      await api.delete(`/api/inventory/${id}`);
      await get().fetchInventory();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  },

  importCSV: async (parsedData) => {
    for (const row of parsedData) {
      if (!row.skuName) continue;
      
      try {
        const payload = {
          sku_name: row.skuName.trim(),
          description: row.description?.trim(),
          qty: row.qty
        };
        await api.post('/api/inventory/', payload);
      } catch (error) {
        console.error('Failed to import row to API:', error);
      }
    }
    await get().fetchInventory();
  },
}));
