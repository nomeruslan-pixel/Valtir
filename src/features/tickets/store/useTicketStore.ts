import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

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
  addTicketsFromCSV: (csvData: any[]) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  updateItemQuantity: (ticketId: string, itemId: string, newQuantity: number) => void;
  addPhoto: (ticketId: string, photoUri: string) => void;
  removePhoto: (ticketId: string, photoUri: string) => void;
  deleteTicket: (ticketId: string) => void;
  clearAll: () => void;
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      tickets: [],
      
      addTicketsFromCSV: (csvData: any[]) => {
        const grouped = csvData.reduce((acc: any, row: any) => {
          const keys = Object.keys(row);
          const tIdKey = keys.find(k => k.toLowerCase().includes('ticket')) || keys[0];
          const tId = row[tIdKey] ? row[tIdKey].toString().trim() : 'UNKNOWN';

          if (!tId) return acc; // Skip completely empty rows
          if (!acc[tId]) {
            acc[tId] = [];
          }
          acc[tId].push(row);
          return acc;
        }, {});

        const newTickets: PickTicket[] = Object.keys(grouped).map(ticketNum => {
          if (ticketNum === 'UNKNOWN') return null; // Ignore if unable to parse ticket
          const rows = grouped[ticketNum];
          const items: PickTicketItem[] = rows.map((r: any) => {
            const keys = Object.keys(r);
            const nameKey = keys.find(k => k.toLowerCase().includes('part') || k.toLowerCase().includes('item') || k.toLowerCase().includes('name') || k.toLowerCase().includes('sku')) || keys[1];
            const descKey = keys.find(k => k.toLowerCase().includes('desc')) || null;
            const qtyKey = keys.find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity')) || keys[2];
            
            return {
              id: uuidv4(),
              name: r[nameKey] ? r[nameKey].toString().trim() : 'Unknown Item',
              description: descKey && r[descKey] ? r[descKey].toString().trim() : '',
              sku: r[nameKey] ? r[nameKey].toString().trim() : '', // using item name as sku fallback
              targetQuantity: parseInt(r[qtyKey], 10) || 1,
              pickedQuantity: 0,
              status: 'pending',
            };
          });

          return {
            id: uuidv4(),
            externalId: ticketNum,
            status: 'not-started',
            createdAt: new Date().toISOString(),
            items,
            photos: [],
          };
        });

        const validTickets = newTickets.filter(t => t !== null) as PickTicket[];

        set((state) => ({
          tickets: [...state.tickets, ...validTickets]
        }));
      },

      updateTicketStatus: (ticketId, status) => {
        set((state) => ({
          tickets: state.tickets.map(t => 
            t.id === ticketId ? { ...t, status } : t
          )
        }));
      },

      updateItemQuantity: (ticketId, itemId, newQuantity) => {
        set((state) => {
          const tickets = state.tickets.map(t => {
            if (t.id !== ticketId) return t;

            const items = t.items.map(item => {
              if (item.id !== itemId) return item;
              const status: ItemStatus = newQuantity >= item.targetQuantity ? 'picked' : 'pending';
              return { ...item, pickedQuantity: newQuantity, status };
            });

            // Auto-update ticket status based on items
            const allPicked = items.every(i => i.status === 'picked');
            const anyPicked = items.some(i => i.pickedQuantity > 0);
            
            let ticketStatus: TicketStatus = t.status;
            if (allPicked) {
              ticketStatus = 'picked';
            } else if (anyPicked) {
              ticketStatus = 'in-progress';
            } else {
              ticketStatus = 'not-started';
            }

            return { ...t, items, status: ticketStatus };
          });

          return { tickets };
        });
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

      deleteTicket: (ticketId) => {
        set((state) => ({
          tickets: state.tickets.filter(t => t.id !== ticketId)
        }));
      },

      clearAll: () => set({ tickets: [] })
    }),
    {
      name: 'ticket-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
