import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';

export default function ImportQtyDialog({ open, onOpenChange, devices, onImport }) {
  const fileRef = useRef(null);
  const [results, setResults] = useState(null);
  const [importing, setImporting] = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResults(null);

    const text = await file.text();
    const rows = parseCSV(text);

    // Find name and qty columns flexibly
    const nameKey = Object.keys(rows[0] || {}).find(k =>
      k.includes('name') || k.includes('device') || k.includes('asset')
    );
    const qtyKey = Object.keys(rows[0] || {}).find(k =>
      k.includes('qty') || k.includes('quantity') || k.includes('on hand') || k.includes('stock')
    );

    if (!nameKey || !qtyKey) {
      setResults({ error: `Could not find required columns. Expected columns like "name" and "qty". Found: ${Object.keys(rows[0] || {}).join(', ')}` });
      return;
    }

    const matched = [];
    const unmatched = [];

    rows.forEach(row => {
      const name = row[nameKey]?.toLowerCase().trim();
      const qty = row[qtyKey]?.trim();
      const device = devices.find(d => (d.device_name || '').toLowerCase().trim() === name);
      if (device) {
        matched.push({ device, qty });
      } else {
        unmatched.push(row[nameKey]);
      }
    });

    setResults({ matched, unmatched, nameKey, qtyKey });
    e.target.value = '';
  };

  const handleConfirm = async () => {
    if (!results?.matched?.length) return;
    setImporting(true);
    await onImport(results.matched);
    setImporting(false);
    setResults(null);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const csv = 'device_name,qty_on_hand\nMy Phone,5\nOffice Laptop,2\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = (open) => {
    if (!open) setResults(null);
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Qty from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with device name and qty columns to bulk-update qty on hand.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Click to upload CSV file</span>
              <span className="text-xs">Columns: device name, qty on hand</span>
            </button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={downloadTemplate}>
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>
        ) : results.error ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {results.error}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setResults(null)}>Try Again</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span><strong>{results.matched.length}</strong> device(s) matched and ready to update.</span>
            </div>

            {results.matched.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border text-sm">
                {results.matched.map(({ device, qty }) => (
                  <div key={device.id} className="flex justify-between items-center px-3 py-2">
                    <span className="truncate text-foreground">{device.device_name}</span>
                    <span className="text-primary font-bold ml-2 shrink-0">→ {qty}</span>
                  </div>
                ))}
              </div>
            )}

            {results.unmatched.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-amber-600">{results.unmatched.length} unmatched:</span>{' '}
                {results.unmatched.join(', ')}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setResults(null)}>Back</Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={importing || !results.matched.length}>
                {importing ? 'Updating...' : `Update ${results.matched.length} Device(s)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}