import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchWithSuggestions({ value, onChange, suggestions = [], onSelect, placeholder, className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = value.trim()
    ? suggestions.filter(s =>
        s.label.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    setOpen(filtered.length > 0 && value.trim().length > 0);
  }, [filtered.length, value]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); }}
        onFocus={() => filtered.length > 0 && setOpen(true)}
        className="pl-10"
      />
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {filtered.map((s) => (
            <button
              key={s.id}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
              onMouseDown={e => { e.preventDefault(); onSelect(s); setOpen(false); }}
            >
              {s.icon && <s.icon className="w-4 h-4 text-muted-foreground shrink-0" />}
              <span className="truncate font-medium text-foreground">{s.label}</span>
              {s.sublabel && <span className="text-xs text-muted-foreground truncate ml-auto shrink-0">{s.sublabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}