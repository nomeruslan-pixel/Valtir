import { useEffect, useCallback } from 'react';
import { useBleStore } from '../../../entities/tracker/model/useBleStore';
import { bleService } from '../../../shared/lib/ble/bleService';
import { requestBluetoothPermissions } from '../../../shared/lib/permissions/permissions';
import { parseIBeacon } from '../../../shared/lib/ble/parseIBeacon';
import { State } from 'react-native-ble-plx';

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

    const start = () => {
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
          
          if (iBeaconData || showAll) {
            addOrUpdateDevice({
              id: device.id,
              name: deviceName || 'Unknown Device',
              rssi: device.rssi,
              rawBase64: device.manufacturerData,
              iBeacon: iBeaconData || undefined
            });
          }
        }
      });
    };

    const currentState = await manager.state();
    if (currentState === State.PoweredOn) {
      start();
    } else {
      const subscription = manager.onStateChange((state) => {
        if (state === State.PoweredOn) {
          subscription.remove();
          start();
        }
      }, true);
    }
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
