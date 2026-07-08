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
        const showAll = useBleStore.getState().showAllDevices;
        const deviceName = device.name || device.localName;
        
        // Додаємо до списку якщо це iBeacon, або якщо увімкнено "Показувати всі" (навіть без імені)
        if (iBeaconData || showAll) {
          addOrUpdateDevice({
            id: device.id,
            name: deviceName || 'Unknown Device',
            rssi: device.rssi,
            rawBase64: device.manufacturerData, // залишаємо для дебагу
            iBeacon: iBeaconData || undefined
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
