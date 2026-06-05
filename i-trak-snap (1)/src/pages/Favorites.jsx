import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PullToRefreshWrapper from '@/components/ui/PullToRefreshWrapper';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import DeviceCard from '@/components/devices/DeviceCard';
import DeviceDetailSheet from '@/components/devices/DeviceDetailSheet';

export default function Favorites() {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['bluetooth-devices'],
    queryFn: () => base44.entities.BluetoothDevice.list('-updated_date'),
  });

  const favorites = devices.filter(d => d.is_favorite);

  const toggleFavorite = useMutation({
    mutationFn: (device) =>
      base44.entities.BluetoothDevice.update(device.id, { is_favorite: !device.is_favorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }),
  });

  const deleteDevice = useMutation({
    mutationFn: (device) => base44.entities.BluetoothDevice.delete(device.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }),
  });

  const handleRefresh = useCallback(() =>
    queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }), [queryClient]);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh} className="h-full">
    <div className="p-6 md:p-8 max-w-6xl mx-auto font-inter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Favorites</h1>
        <p className="text-muted-foreground mt-1">Your starred devices</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No favorites yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">Star devices from the dashboard to see them here</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {favorites.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onToggleFavorite={() => toggleFavorite.mutate(device)}
                onDelete={() => deleteDevice.mutate(device)}
                onClick={() => setSelectedDevice(device)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <DeviceDetailSheet
        device={selectedDevice}
        open={!!selectedDevice}
        onOpenChange={(open) => !open && setSelectedDevice(null)}
      />
    </div>
    </PullToRefreshWrapper>
  );
}