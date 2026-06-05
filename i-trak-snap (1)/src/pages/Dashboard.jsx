import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PullToRefreshWrapper from '@/components/ui/PullToRefreshWrapper';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Bluetooth, Signal, Plus } from 'lucide-react';
import SearchWithSuggestions from '@/components/ui/SearchWithSuggestions';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AnimatePresence } from 'framer-motion';
import StatsBar from '@/components/devices/StatsBar';
import DeviceCard from '@/components/devices/DeviceCard';
import DeviceDetailSheet from '@/components/devices/DeviceDetailSheet';
import AddDeviceDialog from '@/components/devices/AddDeviceDialog';

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['bluetooth-devices'],
    queryFn: () => base44.entities.BluetoothDevice.list('-updated_date'),
  });

  const toggleFavorite = useMutation({
    mutationFn: (device) =>
      base44.entities.BluetoothDevice.update(device.id, { is_favorite: !device.is_favorite }),
    onMutate: async (device) => {
      await queryClient.cancelQueries({ queryKey: ['bluetooth-devices'] });
      const prev = queryClient.getQueryData(['bluetooth-devices']);
      queryClient.setQueryData(['bluetooth-devices'], (old) =>
        old?.map(d => d.id === device.id ? { ...d, is_favorite: !d.is_favorite } : d)
      );
      return { prev };
    },
    onError: (_err, _device, context) => {
      queryClient.setQueryData(['bluetooth-devices'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }),
  });

  const deleteDevice = useMutation({
    mutationFn: (device) => base44.entities.BluetoothDevice.delete(device.id),
    onMutate: async (device) => {
      await queryClient.cancelQueries({ queryKey: ['bluetooth-devices'] });
      const prev = queryClient.getQueryData(['bluetooth-devices']);
      queryClient.setQueryData(['bluetooth-devices'], (old) =>
        old?.filter(d => d.id !== device.id)
      );
      return { prev };
    },
    onError: (_err, _device, context) => {
      queryClient.setQueryData(['bluetooth-devices'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }),
  });

  const addDevice = async (data) => {
    await base44.entities.BluetoothDevice.create(data);
    queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] });
  };

  const filtered = devices.filter(d => {
    const nameMatch = (d.device_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.device_id || '').toLowerCase().includes(search.toLowerCase());
    if (!nameMatch) return false;
    if (signalFilter === 'strong') return d.signal_strength != null && d.signal_strength > -50;
    if (signalFilter === 'medium') return d.signal_strength != null && d.signal_strength <= -50 && d.signal_strength > -70;
    if (signalFilter === 'weak') return d.signal_strength != null && d.signal_strength <= -70;
    return true;
  });

  const handleRefresh = useCallback(() =>
    queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }), [queryClient]);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh} className="h-full" data-page-scroll>
    <div className="p-6 md:p-8 max-w-6xl mx-auto font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track and manage your Bluetooth devices</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Add New Device
        </Button>
      </div>

      <StatsBar devices={devices} />

      <div className="mt-8 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchWithSuggestions
          className="max-w-sm w-full sm:w-auto"
          placeholder="Search devices..."
          value={search}
          onChange={setSearch}
          suggestions={devices.map(d => ({ id: d.id, label: d.device_name || 'Unknown', sublabel: d.device_type || '' }))}
          onSelect={(s) => setSearch(s.label)}
        />
        <ToggleGroup type="single" value={signalFilter} onValueChange={v => setSignalFilter(v || 'all')} className="border border-border rounded-lg p-0.5 bg-muted/40">
          <ToggleGroupItem value="all" className="text-xs px-3 h-8 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">All</ToggleGroupItem>
          <ToggleGroupItem value="strong" className="text-xs px-3 h-8 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm gap-1.5 text-green-600">
            <Signal className="w-3 h-3" />Strong
          </ToggleGroupItem>
          <ToggleGroupItem value="medium" className="text-xs px-3 h-8 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm gap-1.5 text-amber-500">
            <Signal className="w-3 h-3" />Medium
          </ToggleGroupItem>
          <ToggleGroupItem value="weak" className="text-xs px-3 h-8 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm gap-1.5 text-red-500">
            <Signal className="w-3 h-3" />Weak
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Bluetooth className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No devices found</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {search ? 'Try a different search term' : 'Start scanning to discover nearby devices'}
          </p>
          {!search && (
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filtered.map(device => (
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
      <AddDeviceDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addDevice} />
    </div>
    </PullToRefreshWrapper>
  );
}