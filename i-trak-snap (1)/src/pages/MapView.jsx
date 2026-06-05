import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bluetooth } from 'lucide-react';
import SearchWithSuggestions from '@/components/ui/SearchWithSuggestions';
import { format } from 'date-fns';

export default function MapView() {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [search, setSearch] = useState('');

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['bluetooth-devices'],
    queryFn: () => base44.entities.BluetoothDevice.list('-updated_date'),
  });

  const devicesWithLocation = devices.filter(d => d.latitude && d.longitude);

  const activeDevice = selectedDevice || devicesWithLocation[0];

  const mapSrc = activeDevice
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${activeDevice.longitude - 0.01},${activeDevice.latitude - 0.01},${activeDevice.longitude + 0.01},${activeDevice.latitude + 0.01}&layer=mapnik&marker=${activeDevice.latitude},${activeDevice.longitude}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=-74.016,-74.006,40.7028,40.7228&layer=mapnik`;

  return (
    <div className="p-6 md:p-8 font-inter h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Map View</h1>
          <p className="text-muted-foreground mt-1">
            {devicesWithLocation.length} device{devicesWithLocation.length !== 1 ? 's' : ''} with location data
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : devicesWithLocation.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No location data</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Scan devices to start tracking their locations
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          {/* Device search */}
          <SearchWithSuggestions
            placeholder="Search device name..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              const match = devicesWithLocation.find(d =>
                d.device_name?.toLowerCase().includes(val.toLowerCase())
              );
              if (match) setSelectedDevice(match);
            }}
            suggestions={devicesWithLocation.map(d => ({ id: d.id, label: d.device_name || 'Unknown', sublabel: d.address || '' }))}
            onSelect={(s) => {
              const match = devicesWithLocation.find(d => d.id === s.id);
              if (match) { setSelectedDevice(match); setSearch(s.label); }
            }}
          />

          {/* Map */}
          <Card className="overflow-hidden border-border/50 rounded-2xl flex-1" style={{ minHeight: 400 }}>
            <iframe
              title="OpenStreetMap"
              src={mapSrc}
              className="w-full h-full"
              style={{ minHeight: 400, border: 0 }}
              allowFullScreen
            />
          </Card>

          {/* Active device info */}
          {activeDevice && (
            <Card className="p-4 border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bluetooth className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{activeDevice.device_name}</p>
                  {activeDevice.address && (
                    <p className="text-xs text-muted-foreground truncate">{activeDevice.address}</p>
                  )}
                </div>
                {activeDevice.last_seen && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(activeDevice.last_seen), 'MMM d, h:mm a')}
                  </span>
                )}
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {(activeDevice.device_type || 'unknown').replace(/_/g, ' ')}
                </Badge>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}