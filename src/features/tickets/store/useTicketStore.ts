import { create } from 'zustand';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../../api/client';

export type TicketStatus = 'not-started' | 'in-progress' | 'picked';
export type ItemStatus = 'pending' | 'picked';

export interface PickTicketItem {
  id: string;
  name: string;
  description: string;
  sku: string;
  targetQuantity: number;
  pickedQuantity: number;
  status: ItemStatus;
  type?: string | null;
}

export interface PickTicket {
  id: string;
  externalId: string;
  status: TicketStatus;
  createdAt: string;
  items: PickTicketItem[];
  photos: string[];
}

interface TicketStore {
  tickets: PickTicket[];
  fetchTickets: () => Promise<void>;
  addTicketsFromCSV: (csvData: any[]) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  updateItemQuantity: (ticketId: string, itemId: string, newQuantity: number) => Promise<void>;
  addPhoto: (ticketId: string, photoUri: string) => void;
  removePhoto: (ticketId: string, photoUri: string) => void;
  deleteTicket: (ticketId: string) => Promise<void>;
  setTickets: (tickets: PickTicket[]) => void;
  clearAll: () => void;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  
  setTickets: (tickets) => set({ tickets }),

  fetchTickets: async () => {
    try {
      const response = await api.get('/api/tickets/');
      // Map backend schema to frontend schema if needed
      const backendTickets = response.data.map((t: any) => ({
        id: t.id,
        externalId: t.external_id,
        status: t.status,
        createdAt: t.created_at,
        items: t.items.map((i: any) => ({
          id: i.id,
          name: i.name,
          description: i.description || '',
          sku: i.sku,
          targetQuantity: i.target_quantity,
          pickedQuantity: i.picked_quantity,
          status: i.status,
          type: i.type
        })),
        photos: [] // Backend doesn't store photos yet
      }));
      set({ tickets: backendTickets });
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  },
      
  addTicketsFromCSV: async (csvData: any[]) => {
    const getVal = (row: any, searchKeys: string[]) => {
      const keys = Object.keys(row);
      const matchingKey = keys.find(k => {
        const clean = k.trim().replace(/^[\uFEFF\xA0]+|[\uFEFF\xA0]+$/g, '').toLowerCase();
        return searchKeys.some(sk => clean === sk.toLowerCase());
      });
      return matchingKey ? row[matchingKey] : undefined;
    };

    const grouped = csvData.reduce((acc: any, row: any) => {
      // Robust matching for Load Number
      const loadNumber = getVal(row, ['Load Number']);
      const tId = loadNumber ? loadNumber.toString().trim() : 'UNKNOWN';

      if (!tId || tId === 'UNKNOWN') return acc;
      if (!acc[tId]) acc[tId] = [];
      acc[tId].push(row);
      return acc;
    }, {});

    const newTickets = Object.keys(grouped).map(ticketNum => {
      if (ticketNum === 'UNKNOWN') return null;
      const rows = grouped[ticketNum];
      const items = rows.map((r: any) => {
        // Robust matching
        const itemValue = getVal(r, ['Item']);
        const descValue = getVal(r, ['Description']) || '';
        const qtyValue = getVal(r, ['Qty', 'Quantity']) || '1';
        const typeValue = getVal(r, ['Type']) || null;
        
        return {
          name: itemValue ? itemValue.toString().trim() : 'Unknown Item',
          description: descValue.toString().trim(),
          sku: itemValue ? itemValue.toString().trim() : '',
          target_quantity: parseInt(qtyValue, 10) || 1,
          picked_quantity: 0,
          status: 'pending',
          type: typeValue
        };
      });

      return {
        external_id: ticketNum,
        status: 'not-started',
        items,
      };
    }).filter(Boolean);

    try {
      if (newTickets.length > 0) {
        await api.post('/api/tickets/bulk', newTickets);
      }
    } catch (error) {
      console.error('Failed to upload tickets to API:', error);
    }
    
    // Refresh tickets from backend
    await get().fetchTickets();
  },

      updateTicketStatus: (ticketId, status) => {
        set((state) => ({
          tickets: state.tickets.map(t => 
            t.id === ticketId ? { ...t, status } : t
          )
        }));
      },

  updateItemQuantity: async (ticketId, itemId, newQuantity) => {
    // Optimistic UI update
    set((state) => {
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;

        const items = t.items.map(item => {
          if (item.id !== itemId) return item;
          const status: ItemStatus = newQuantity >= item.targetQuantity ? 'picked' : 'pending';
          return { ...item, pickedQuantity: newQuantity, status };
        });

        const allPicked = items.every(i => i.status === 'picked');
        const anyPicked = items.some(i => i.pickedQuantity > 0);
        let ticketStatus: TicketStatus = t.status;
        if (allPicked) ticketStatus = 'picked';
        else if (anyPicked) ticketStatus = 'in-progress';
        else ticketStatus = 'not-started';

        return { ...t, items, status: ticketStatus };
      });
      return { tickets };
    });

    try {
      await api.put(`/api/tickets/${ticketId}/items/${itemId}?picked_quantity=${newQuantity}`);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // Revert in case of failure
      await get().fetchTickets();
    }
  },

      addPhoto: (ticketId, photoUri) => {
        set((state) => ({
          tickets: state.tickets.map(t => 
            t.id === ticketId ? { ...t, photos: [...t.photos, photoUri] } : t
          )
        }));
      },

      removePhoto: (ticketId, photoUri) => {
        set((state) => ({
          tickets: state.tickets.map(t => 
            t.id === ticketId ? { ...t, photos: t.photos.filter(p => p !== photoUri) } : t
          )
        }));
      },

  deleteTicket: async (ticketId) => {
    set((state) => ({
      tickets: state.tickets.filter(t => t.id !== ticketId)
    }));
    try {
      await api.delete(`/api/tickets/${ticketId}`);
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      await get().fetchTickets();
    }
  },

  clearAll: () => set({ tickets: [] })
}));
