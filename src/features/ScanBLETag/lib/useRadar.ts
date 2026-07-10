import { useState, useEffect, useCallback } from 'react';
import { bleService } from '../../../shared/lib/ble/bleService';
import { requestBluetoothPermissions } from '../../../shared/lib/permissions/permissions';
import { parseIBeacon } from '../../../shared/lib/ble/parseIBeacon';
import { State } from 'react-native-ble-plx';

export const useRadar = (targetId: string) => {
  const [rssi, setRssi] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const manager = bleService.getManager();

  const startRadar = useCallback(async () => {
    if (!bleService.isMock) {
      const isGranted = await requestBluetoothPermissions();
      if (!isGranted) {
        setError('Bluetooth/Location permissions missing');
        return;
      }
    }

    setError(null);
    setRssi(null);

    const start = () => {
      setIsScanning(true);
      manager.startDeviceScan(null, { allowDuplicates: true }, (scanError, device) => {
        if (scanError) {
          console.warn('Radar Scan Error:', scanError);
          setError(scanError.message);
          setIsScanning(false);
          manager.stopDeviceScan();
          return;
        }
        
        if (device) {
          let isMatch = false;
          if (device.id === targetId) {
            isMatch = true;
          } else if (device.manufacturerData) {
            const iBeacon = parseIBeacon(device.manufacturerData);
            if (iBeacon && iBeacon.uuid === targetId) {
              isMatch = true;
            }
          }

          if (isMatch && device.rssi) {
            setRssi(device.rssi);
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
  }, [manager, targetId]);

  const stopRadar = useCallback(() => {
    manager.stopDeviceScan();
    setIsScanning(false);
  }, [manager]);

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, [manager]);

  return {
    rssi,
    isScanning,
    error,
    startRadar,
    stopRadar,
  };
};
