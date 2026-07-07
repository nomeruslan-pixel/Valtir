import { useEffect, useCallback } from 'react';
import { useBleStore } from '../../../entities/tracker/model/useBleStore';
import { bleService } from '../../../shared/lib/ble/bleService';
import { requestBluetoothPermissions } from '../../../shared/lib/permissions/permissions';
import { parseIBeacon } from '../../../shared/lib/ble/parseIBeacon';

export const useBleScanner = () => {
  const { isScanning, setIsScanning, addOrUpdateDevice, setScanError, clearDevices } = useBleStore();
  const manager = bleService.getManager();

  const startScan = useCallback(async () => {
    if (!bleService.isMock) {
      const isGranted = await requestBluetoothPermissions();
      if (!isGranted) {
        setScanError('Нет разрешений на Bluetooth или Локацию');
        return;
      }
    }

    setScanError(null);
    clearDevices();
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('BLE Scan Error:', error);
        setScanError(error.message);
        setIsScanning(false);
        manager.stopDeviceScan();
        return;
      }
      
      if (device) {
        const iBeaconData = device.manufacturerData ? parseIBeacon(device.manufacturerData) : null;
        
        // Додаємо до списку ТІЛЬКИ якщо це iBeacon або AltBeacon
        if (iBeaconData) {
          addOrUpdateDevice({
            id: device.id,
            name: device.name || device.localName,
            rssi: device.rssi,
            rawBase64: device.manufacturerData, // залишаємо для дебагу, якщо цікаво
            iBeacon: iBeaconData
          });
        }
      }
    });
  }, [manager, setIsScanning, setScanError, clearDevices, addOrUpdateDevice]);

  const stopScan = useCallback(() => {
    manager.stopDeviceScan();
    setIsScanning(false);
  }, [manager, setIsScanning]);

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, [manager]);

  return {
    startScan,
    stopScan,
  };
};
