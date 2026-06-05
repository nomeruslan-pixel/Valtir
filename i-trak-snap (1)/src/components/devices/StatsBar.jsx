import React from 'react';
import { Card } from '@/components/ui/card';
import { Bluetooth, MapPin, Star, Clock } from 'lucide-react';

export default function StatsBar({ devices }) {
  const totalDevices = devices.length;
  const favoriteCount = devices.filter(d => d.is_favorite).length;
  const withLocation = devices.filter(d => d.latitude && d.longitude).length;
  
  const lastSeen = devices.reduce((latest, d) => {
    if (!d.last_seen) return latest;
    const date = new Date(d.last_seen);
    return date > latest ? date : latest;
  }, new Date(0));

  const stats = [
    { label: 'Total Devices', value: totalDevices, icon: Bluetooth, color: 'text-primary' },
    { label: 'With Location', value: withLocation, icon: MapPin, color: 'text-green-500' },
    { label: 'Favorites', value: favoriteCount, icon: Star, color: 'text-amber-400' },
    { 
      label: 'Last Activity', 
      value: totalDevices > 0 && lastSeen.getTime() > 0 ? 'Active' : 'None', 
      icon: Clock, 
      color: 'text-cyan-500' 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4 border-border/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}