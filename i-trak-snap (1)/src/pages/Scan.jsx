import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Radio, Bluetooth, MapPin, Check, AlertCircle, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceIcon from '@/components/devices/DeviceIcon';

const DEVICE_TYPES = ['unknown','phone','computer','headphones','speaker','watch','fitness_tracker','keyboard','mouse','printer','car','other'];

function detectDeviceType(name = '') {
  const n = name.toLowerCase();
  if (/airpod|headphone|earphone|bud|earbud|wh-|wf-|jabra|bose|sennheiser/i.test(n)) return 'headphones';
  if (/watch|band|fit|garmin|polar|suunto/i.test(n)) return 'watch';
  if (/iphone|pixel|galaxy|oneplus|phone/i.test(n)) return 'phone';
  if (/mac|laptop|surface|thinkpad|computer/i.test(n)) return 'computer';
  if (/speaker|sonos|jbl|harman|soundbar/i.test(n)) return 'speaker';
  if (/keyboard/i.test(n)) return 'keyboard';
  if (/mouse|trackpad/i.test(n)) return 'mouse';
  if (/printer/i.test(n)) return 'printer';
  return 'unknown';
}

// True if Web Bluetooth is available (Chrome Android/Desktop)
const hasBluetooth = () => !!navigator.bluetooth;

export default function Scan() {
  const queryClient = useQueryClient();
  const bluetooth = hasBluetooth();

  // Shared state
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [discovered, setDiscovered] = useState([]);

  // Web Bluetooth state (Chrome only)
  const [scanning, setScanning] = useState(false);
  const [targetName, setTargetName] = useState('');
  const [scanError, setScanError] = useState(null);

  // Manual form state (iOS / all browsers)
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState('unknown');
  const [manualId, setManualId] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  const saveDevice = useMutation({
    mutationFn: async (deviceInfo) => {
      const existing = await base44.entities.BluetoothDevice.filter({ device_id: deviceInfo.device_id });
      const now = new Date().toISOString();
      const locationEntry = location ? { ...location, timestamp: now } : null;

      if (existing.length > 0) {
        const device = existing[0];
        const history = [...(device.location_history || [])];
        if (locationEntry) history.push(locationEntry);
        await base44.entities.BluetoothDevice.update(device.id, {
          last_seen: now,
          ...(location && {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address || device.address,
          }),
          location_history: history,
        });
      } else {
        await base44.entities.BluetoothDevice.create({
          device_name: deviceInfo.device_name,
          device_id: deviceInfo.device_id,
          device_type: deviceInfo.device_type || 'unknown',
          last_seen: now,
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.address || '',
          location_history: locationEntry ? [locationEntry] : [],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] });
    },
  });

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve) => {
      setGettingLocation(true);
      if (!navigator.geolocation) { setGettingLocation(false); resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          try {
            const result = await base44.integrations.Core.InvokeLLM({
              prompt: `Give me the address for coordinates: ${loc.latitude}, ${loc.longitude}. Return just the street address or area name, nothing else.`,
              response_json_schema: { type: 'object', properties: { address: { type: 'string' } } },
            });
            loc.address = result.address || '';
          } catch { loc.address = ''; }
          setLocation(loc);
          setGettingLocation(false);
          resolve(loc);
        },
        () => { setGettingLocation(false); resolve(null); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  // --- Web Bluetooth scan (Chrome/Android/Desktop only) ---
  const startBluetoothScan = async () => {
    setScanError(null);
    setScanning(true);
    const loc = await getCurrentLocation();
    try {
      const filters = targetName.trim()
        ? [{ name: targetName.trim() }, { namePrefix: targetName.trim() }]
        : undefined;
      const device = await navigator.bluetooth.requestDevice({
        ...(filters ? { filters } : { acceptAllDevices: true }),
        optionalServices: ['battery_service', 'device_information'],
      });
      const deviceInfo = {
        device_name: device.name || 'Unknown Device',
        device_id: device.id,
        device_type: detectDeviceType(device.name),
      };
      setDiscovered(prev => [...prev, deviceInfo]);
      await saveDevice.mutateAsync(deviceInfo);
    } catch (err) {
      if (err.name !== 'NotFoundError') setScanError(err.message);
    } finally {
      setScanning(false);
    }
  };

  // --- Manual save (all browsers) ---
  const handleManualSave = async () => {
    if (!manualName.trim()) return;
    setManualSaving(true);
    await getCurrentLocation();
    const deviceInfo = {
      device_name: manualName.trim(),
      device_id: manualId.trim() || `manual-${Date.now()}`,
      device_type: manualType,
    };
    await saveDevice.mutateAsync(deviceInfo);
    setDiscovered(prev => [...prev, deviceInfo]);
    setManualName('');
    setManualId('');
    setManualType('unknown');
    setManualSaving(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto font-inter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Scan Devices</h1>
        <p className="text-muted-foreground mt-1">Discover nearby Bluetooth devices and log their location</p>
      </div>

      {/* ── Web Bluetooth (Chrome/Android/Desktop) ── */}
      {bluetooth && (
        <div className="mb-8">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter by device name (optional)..."
              value={targetName}
              onChange={e => setTargetName(e.target.value)}
              disabled={scanning || gettingLocation}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col items-center py-6">
            <AnimatePresence mode="wait">
              {scanning || gettingLocation ? (
                <motion.div
                  key="radar"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex items-center justify-center"
                  style={{ width: 220, height: 220 }}
                >
                  {[1, 0.66, 0.33].map((scale, i) => (
                    <div key={i} className="absolute rounded-full border border-primary/25"
                      style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }} />
                  ))}
                  <div className="absolute w-full h-px bg-primary/15" />
                  <div className="absolute h-full w-px bg-primary/15" />
                  <motion.div className="absolute top-1/2 left-1/2 origin-left"
                    style={{ width: '50%', height: 2, marginTop: -1 }}
                    animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <div className="w-full h-full" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--primary)))' }} />
                  </motion.div>
                  <div className="relative z-10 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50" />
                </motion.div>
              ) : (
                <motion.button
                  key="button"
                  onClick={startBluetoothScan}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative w-36 h-36 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Radio className="w-10 h-10" />
                </motion.button>
              )}
            </AnimatePresence>
            {!(scanning || gettingLocation) && <p className="mt-5 text-sm text-muted-foreground font-medium">Tap to scan</p>}
            {(scanning || gettingLocation) && (
              <p className="mt-4 text-sm text-muted-foreground font-medium animate-pulse">
                {gettingLocation ? 'Getting your location...' : 'Select a device from the popup...'}
              </p>
            )}
            {location && (
              <Badge variant="outline" className="mt-3 gap-1.5">
                <MapPin className="w-3 h-3" />
                {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
              </Badge>
            )}
          </div>
          {scanError && (
            <Card className="p-4 border-destructive/20 bg-destructive/5 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{scanError}</p>
              </div>
            </Card>
          )}
          <div className="border-t border-border mt-4 pt-6">
            <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">Or add manually</p>
          </div>
        </div>
      )}

      {/* ── Manual entry (always shown; primary on iOS) ── */}
      <Card className="p-5 border-border/50 mb-6">
        {!bluetooth && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Automatic Bluetooth scanning requires Chrome on Android or desktop. On iOS, add devices manually below — GPS location is still captured.
            </p>
          </div>
        )}
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {bluetooth ? 'Add Device Manually' : 'Add Device'}
        </h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Device Name</Label>
            <Input
              id="m-name"
              placeholder="e.g. AirPods Pro, Galaxy Watch…"
              value={manualName}
              onChange={e => {
                setManualName(e.target.value);
                setManualType(detectDeviceType(e.target.value));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-type">Device Type</Label>
            <Select value={manualType} onValueChange={setManualType}>
              <SelectTrigger id="m-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEVICE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-id">Device ID / MAC <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="m-id"
              placeholder="AA:BB:CC:DD:EE:FF"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
            />
          </div>
          <Button
            className="w-full gap-2 mt-1"
            disabled={!manualName.trim() || manualSaving}
            onClick={handleManualSave}
          >
            {manualSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Device & Capture Location'}
          </Button>
        </div>
      </Card>

      {/* Discovered devices list */}
      {discovered.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Added this session ({discovered.length})</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {discovered.map((d, i) => (
                <motion.div key={d.device_id + i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="p-4 border-border/50">
                    <div className="flex items-center gap-3">
                      <DeviceIcon type={d.device_type || 'unknown'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{d.device_name}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{d.device_id}</p>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border gap-1 shrink-0">
                        <Check className="w-3 h-3" />Saved
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Info card */}
      <Card className="p-5 border-border/50 bg-muted/30">
        <div className="flex items-start gap-3">
          <Bluetooth className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">How it works</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li>• GPS location is captured automatically when adding a device</li>
              <li>• Each device is saved with its last known location</li>
              <li>• Re-adding a device updates its location history</li>
              <li>• Automatic Bluetooth scan works in Chrome (Android/desktop)</li>
              <li>• On iOS/Safari, use the manual form — all features still work</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}