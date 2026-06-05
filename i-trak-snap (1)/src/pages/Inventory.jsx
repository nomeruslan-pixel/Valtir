import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PullToRefreshWrapper from '@/components/ui/PullToRefreshWrapper';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, MapPin, Edit2, Upload } from 'lucide-react';
import DeviceIcon from '@/components/devices/DeviceIcon';
import ImportQtyDialog from '@/components/devices/ImportQtyDialog';

export default function Inventory() {
  const queryClient = useQueryClient();
  const [editDevice, setEditDevice] = useState(null);
  const [qtyInput, setQtyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['bluetooth-devices'],
    queryFn: () => base44.entities.BluetoothDevice.list('-updated_date'),
  });

  const openEdit = (device) => {
    setEditDevice(device);
    setQtyInput(device.notes || '');
  };

  const handleBulkImport = async (matched) => {
    await Promise.all(
      matched.map(({ device, qty }) =>
        base44.entities.BluetoothDevice.update(device.id, { notes: qty })
      )
    );
    queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] });
  };

  const saveQty = useMutation({
    mutationFn: ({ id, qty }) => base44.entities.BluetoothDevice.update(id, { notes: qty }),
    onMutate: async ({ id, qty }) => {
      await queryClient.cancelQueries({ queryKey: ['bluetooth-devices'] });
      const prev = queryClient.getQueryData(['bluetooth-devices']);
      queryClient.setQueryData(['bluetooth-devices'], (old) =>
        old?.map(d => d.id === id ? { ...d, notes: qty } : d)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => queryClient.setQueryData(['bluetooth-devices'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }),
  });

  const handleSave = () => {
    if (!editDevice) return;
    setSaving(true);
    saveQty.mutate({ id: editDevice.id, qty: qtyInput }, {
      onSettled: () => { setSaving(false); setEditDevice(null); },
    });
  };

  // Group devices by address (asset location)
  const grouped = devices.reduce((acc, device) => {
    const location = device.address || 'Unknown Location';
    if (!acc[location]) acc[location] = [];
    acc[location].push(device);
    return acc;
  }, {});

  const totalQty = devices.reduce((sum, d) => {
    const n = parseInt(d.notes);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const handleRefresh = useCallback(() =>
    queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }), [queryClient]);

  return (
    <>
    <PullToRefreshWrapper onRefresh={handleRefresh} className="h-full">
    <div className="p-6 md:p-8 max-w-5xl mx-auto font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Qty on hand by asset location</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Total Qty: <span className="text-primary font-bold">{totalQty}</span></span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No devices found. Add devices from the Dashboard.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([location, locationDevices]) => {
            const locationQty = locationDevices.reduce((sum, d) => {
              const n = parseInt(d.notes);
              return sum + (isNaN(n) ? 0 : n);
            }, 0);
            return (
              <Card key={location} className="overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-muted/40 border-b border-border">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm text-foreground flex-1 truncate">{location}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {locationQty} total
                  </Badge>
                </div>
                <div className="divide-y divide-border">
                  {locationDevices.map(device => (
                    <div key={device.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                      <DeviceIcon type={device.device_type} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{device.device_name || 'Unknown Device'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{device.device_type || 'unknown'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Qty on Hand</p>
                          <p className="text-lg font-bold text-foreground leading-tight">
                            {device.notes && !isNaN(parseInt(device.notes)) ? parseInt(device.notes) : '—'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => openEdit(device)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Qty Dialog */}
      <ImportQtyDialog open={importOpen} onOpenChange={setImportOpen} devices={devices} onImport={handleBulkImport} />

      </div>
      </PullToRefreshWrapper>

      <Dialog open={!!editDevice} onOpenChange={(open) => !open && setEditDevice(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Qty on Hand</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            {editDevice?.device_name || 'Device'}
          </p>
          <div className="flex gap-2 mt-2">
            <Input
              type="number"
              min="0"
              placeholder="Enter quantity..."
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}