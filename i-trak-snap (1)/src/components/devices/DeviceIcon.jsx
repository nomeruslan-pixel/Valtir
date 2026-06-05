import React from 'react';
import { Bluetooth, Smartphone, Monitor, Headphones, Speaker, Watch, Activity, Keyboard, Mouse, Printer, Car, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  phone: Smartphone,
  computer: Monitor,
  headphones: Headphones,
  speaker: Speaker,
  watch: Watch,
  fitness_tracker: Activity,
  keyboard: Keyboard,
  mouse: Mouse,
  printer: Printer,
  car: Car,
  unknown: Bluetooth,
  other: HelpCircle,
};

const colorMap = {
  phone: 'bg-blue-500/10 text-blue-500',
  computer: 'bg-purple-500/10 text-purple-500',
  headphones: 'bg-green-500/10 text-green-500',
  speaker: 'bg-orange-500/10 text-orange-500',
  watch: 'bg-cyan-500/10 text-cyan-500',
  fitness_tracker: 'bg-red-500/10 text-red-500',
  keyboard: 'bg-slate-500/10 text-slate-500',
  mouse: 'bg-slate-500/10 text-slate-500',
  printer: 'bg-amber-500/10 text-amber-500',
  car: 'bg-indigo-500/10 text-indigo-500',
  unknown: 'bg-primary/10 text-primary',
  other: 'bg-muted text-muted-foreground',
};

export default function DeviceIcon({ type = 'unknown', size = 'md' }) {
  const Icon = iconMap[type] || iconMap.unknown;
  const color = colorMap[type] || colorMap.unknown;
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };
  const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };

  return (
    <div className={cn("rounded-xl flex items-center justify-center", sizeClasses[size], color)}>
      <Icon className={iconSizes[size]} />
    </div>
  );
}