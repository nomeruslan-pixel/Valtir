import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bluetooth, Loader2, Radio, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DEVICE_TYPES = ['unknown','phone','computer','headphones','speaker','watch','fitness_tracker','keyboard','mouse','printer','car','other'];

function detectDeviceType(device) {
  const name = (device.name || '').toLowerCase();
  if (/airpod|headphone|earphone|bud|earbud|wh-|wf-|soundsport|jabra|bose|sennheiser/i.test(name)) return 'headphones';
  if (/watch|band|fit|garmin|polar|suunto/i.test(name)) return 'fitness_tracker';
  if (/iphone|pixel|galaxy|oneplus|phone/i.test(name)) return 'phone';
  if (/mac|laptop|surface|thinkpad|computer/i.test(name)) return 'computer';
  if (/speaker|sonos|jbl|harman|soundbar/i.test(name)) return 'speaker';
  if (/keyboard/i.test(name)) return 'keyboard';
  if (/mouse|trackpad/i.test(name)) return 'mouse';
  if (/printer/i.test(name)) return 'printer';
  return 'unknown';
}

export default function AddDeviceDialog({ open, onOpenChange, onAdd }) {
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState('unknown');
  const [deviceId, setDeviceId] = useState('');
  const [saving, setSaving] = useState(false);

  // Bluetooth scan state
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(null);
  const [scanError, setScanError] = useState(null);
  const bluetoothSupported = !!navigator?.bluetooth;

  const handleBluetoothScan = async () => {
    setScanError(null);
    setScanned(null);
    setScanning(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information'],
      });
      setScanned(device);
      setName(device.name || '');
      setDeviceId(device.id || '');
      setDeviceType(detectDeviceType(device));
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        setScanError(err.message || 'Scan cancelled or failed.');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({
      device_name: name.trim(),
      device_type: deviceType,
      ...(deviceId ? { device_id: deviceId } : {}),
    });
    // Reset
    setName('');
    setDeviceType('unknown');
    setDeviceId('');
    setScanned(null);
    setScanError(null);
    setSaving(false);
    onOpenChange(false);
  };

  const handleClose = (val) => {
    if (!val) {
      setName('');
      setDeviceType('unknown');
      setDeviceId('');
      setScanned(null);
      setScanError(null);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Bluetooth Scan Section */}
          {bluetoothSupported && (
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 flex flex-col items-center gap-3">
              {!scanned && !scanning && (
                <>
                  <Bluetooth className="w-7 h-7 text-primary" />
                  <p className="text-xs text-muted-foreground text-center">
                    Put your device in pairing mode, then tap Scan to detect it automatically.
                  </p>
                  <Button type="button" className="gap-2" onClick={handleBluetoothScan}>
                    <Radio className="w-4 h-4" />
                    Scan for Device
                  </Button>
                </>
              )}

              {scanning && (
                <div className="flex flex-col items-center gap-2 py-1">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Select your device from the browser popup…</p>
                </div>
              )}

              {scanned && !scanning && (
                <div className="flex items-center gap-3 w-full">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{scanned.name || 'Unknown Device'}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{scanned.id}</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border text-[10px]">Paired</Badge>
                  <Button type="button" variant="ghost" size="sm" className="text-xs shrink-0" onClick={handleBluetoothScan}>
                    Rescan
                  </Button>
                </div>
              )}

              {scanError && (
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {scanError}
                </div>
              )}
            </div>
          )}

          {!bluetoothSupported && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-50/40 dark:bg-amber-900/10 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Bluetooth scanning is not available in this browser. Fill in the details manually below, or use Chrome on Android/desktop.
              </p>
            </div>
          )}

          {/* Manual fields */}
          <div className="space-y-1.5">
            <Label htmlFor="device-name">Device Name</Label>
            <Input
              id="device-name"
              placeholder="e.g. John's AirPods"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus={!bluetoothSupported}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="device-type">Device Type</Label>
            <Select value={deviceType} onValueChange={setDeviceType}>
              <SelectTrigger id="device-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>
                    {t.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? 'Adding...' : 'Add Device'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}