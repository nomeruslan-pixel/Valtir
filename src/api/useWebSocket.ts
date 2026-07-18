import { useEffect, useRef } from 'react';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useTicketStore } from '../features/tickets/store/useTicketStore';
import { useInventoryStore } from '../entities/inventory/model/useInventoryStore';
import { API_BASE_URL } from './client';

export const useWebSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const ws = useRef<WebSocket | null>(null);
  const fetchTickets = useTicketStore(state => state.fetchTickets);
  const fetchInventory = useInventoryStore(state => state.fetchInventory);
  
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Convert http to ws, https to wss
    const wsUrl = API_BASE_URL.replace('http', 'ws') + `/api/ws/${token}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      fetchTickets();
      fetchInventory();
    };

    ws.current.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        console.log('WebSocket Message Received:', message.type);
        
        // Handle different message types
        if (message.type.startsWith('ticket_')) {
          fetchTickets(); // Re-fetch to sync
        } else if (message.type.startsWith('inventory_')) {
          fetchInventory();
        } else if (message.type.startsWith('zone_')) {
          // Handle zone updates
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    ws.current.onerror = (e) => {
      console.log('WebSocket Error:', e.message);
    };

    ws.current.onclose = (e) => {
      console.log('WebSocket Disconnected', e.code, e.reason);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isAuthenticated, token, fetchTickets, fetchInventory]);

  return ws.current;
};
