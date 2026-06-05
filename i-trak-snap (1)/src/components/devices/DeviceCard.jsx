import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, Star, Trash2, Signal, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import DeviceIcon from './DeviceIcon';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function DeviceCard({ device, onToggleFavorite, onDelete, onClick }) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(device.device_name || '');
  const queryClient = useQueryClient();

  const getSignalLabel = (rssi) => {
    if (!rssi) return null;
    if (rssi > -50) return { label: 'Strong', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
    if (rssi > -70) return { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    return { label: 'Weak', color: 'bg-red-500/10 text-red-600 border-red-500/20' };
  };

  const signal = getSignalLabel(device.signal_strength);

  const handleSaveName = async (e) => {
    e.stopPropagation();
    await base44.entities.BluetoothDevice.update(device.id, { device_name: nameValue });
    queryClient.invalidateQueries({ queryKey: ['bluetooth-devices'] });
    setEditing(false);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setNameValue(device.device_name || '');
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      layout
    >
      <Card
        className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20 group"
        onClick={onClick}
      >
        <div className="flex items-start gap-4">
          <DeviceIcon type={device.device_type} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {editing ? (
                <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                  <Input
                    autoFocus
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(e); if (e.key === 'Escape') handleCancelEdit(e); }}
                    className="h-7 text-sm font-semibold py-0 px-2"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 shrink-0" onClick={handleSaveName}><Check className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground shrink-0" onClick={handleCancelEdit}><X className="w-3.5 h-3.5" /></Button>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-foreground truncate">
                    {device.device_name || 'Unknown Device'}
                  </h3>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    onClick={e => { e.stopPropagation(); setEditing(true); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {!editing && signal && (
                <Badge variant="outline" className={signal.color + " text-[10px] px-1.5 py-0 h-5 border"}>
                  <Signal className="w-2.5 h-2.5 mr-1" />
                  {signal.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              <span className="font-medium text-foreground">Qty On Hand:</span> {device.notes != null && device.notes !== '' ? device.notes : '—'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {device.address && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {device.address}
                </span>
              )}
              {device.last_seen && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(device.last_seen), 'MMM d, h:mm a')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 md:h-8 md:w-8 select-none"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(device); }}
            >
              <Star className={`w-4 h-4 ${device.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 md:h-8 md:w-8 text-muted-foreground hover:text-destructive select-none"
              onClick={(e) => { e.stopPropagation(); onDelete?.(device); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}