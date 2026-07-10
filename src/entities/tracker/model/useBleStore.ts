import { create } from 'zustand';

export interface BleDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  rawBase64?: string | null;
  iBeacon?: {
    uuid: string;
    major: number;
    minor: number;
    txPower: number;
  };
}

interface BleStore {
  isScanning: boolean;
  showAllDevices: boolean;
  devices: BleDevice[];
  scanError: string | null;
  setIsScanning: (scanning: boolean) => void;
  setShowAllDevices: (show: boolean) => void;
  setScanError: (error: string | null) => void;
  addOrUpdateDevice: (device: BleDevice) => void;
  clearDevices: () => void;
}

export const useBleStore = create<BleStore>((set) => ({
  isScanning: false,
  showAllDevices: true,
  devices: [],
  scanError: null,
  setIsScanning: (isScanning) => set({ isScanning }),
  setShowAllDevices: (showAllDevices) => set({ showAllDevices }),
  setScanError: (scanError) => set({ scanError }),
  addOrUpdateDevice: (newDevice) =>
    set((state) => {
      const existingIndex = state.devices.findIndex((d) => d.id === newDevice.id);
      if (existingIndex !== -1) {
        const updatedDevices = [...state.devices];
        updatedDevices[existingIndex] = newDevice;
        return { devices: updatedDevices };
      }
      return { devices: [...state.devices, newDevice] };
    }),
  clearDevices: () => set({ devices: [] }),
}));
