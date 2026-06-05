import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, Save } from 'lucide-react';
import { format } from 'date-fns';
import DeviceIcon from './DeviceIcon';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const deviceTypes = [
  'unknown', 'phone', 'computer', 'headphones', 'speaker',
  'watch', 'fitness_tracker', 'keyboard', 'mouse', 'printer', 'car', 'other'
];

export default function DeviceDetailSheet({ device, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [deviceType, setDeviceType] = useState(device?.device_type || 'unknown');
  const [qtyOnHand, setQtyOnHand] = useState(device?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const saveDevice = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BluetoothDevice.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['bluetooth-devices'] });
      const prev = queryClient.getQueryData(['bluetooth-devices']);
      queryClient.setQueryData(['bluetooth-devices'], (old) =>
        old?.map(d => d.id === id ? { ...d, ...data } : d)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => queryClient.setQueryData(['bluetooth-devices'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] }),
  });

  const handleSave = () => {
    setSaving(true);
    saveDevice.mutate(
      { id: device.id, data: { device_type: deviceType, notes: qtyOnHand } },
      { onSettled: () => { setSaving(false); onOpenChange(false); } }
    );
  };

  if (!device) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="font-inter overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-4">
            <DeviceIcon type={device.device_type} size="lg" />
            <div>
              <SheetTitle className="text-xl">{device.device_name}</SheetTitle>
              <p className="text-xs text-muted-foreground font-mono mt-1">{device.device_id}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Details</h4>
            <div className="grid grid-cols-2 gap-3">
              {device.last_seen && (
                <div className="bg-muted rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wider font-medium">Last Seen</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(device.last_seen), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(device.last_seen), 'h:mm a')}
                  </p>
                </div>
              )}
              {device.signal_strength && (
                <div className="bg-muted rounded-xl p-3">
                  <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Signal</span>
                  <p className="text-sm font-medium text-foreground mt-1">{device.signal_strength} dBm</p>
                </div>
              )}
            </div>
          </div>

          {device.address && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Last Location</h4>
              <div className="bg-muted rounded-xl p-3 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{device.address}</p>
              </div>
            </div>
          )}

          {device.location_history?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Location History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {device.location_history.map((loc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                    <span className="truncate">{loc.address || `${loc.latitude}, ${loc.longitude}`}</span>
                    {loc.timestamp && (
                      <span className="ml-auto shrink-0">{format(new Date(loc.timestamp), 'MMM d')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Edit</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Device Type</label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map(t => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Qty On Hand</label>
                <Input
                  type="number"
                  min="0"
                  value={qtyOnHand}
                  onChange={(e) => setQtyOnHand(e.target.value)}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}