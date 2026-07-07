import { BleManager } from 'react-native-ble-plx';
import { Platform } from 'react-native';

class BLEService {
  private manager: BleManager | any = null;
  public isMock: boolean = false;

  public getManager(): BleManager | any {
    if (!this.manager) {
      try {
        this.manager = new BleManager();
      } catch (e) {
        console.warn('Native BLE module not found (likely running in Expo Go). Using mock.');
        this.isMock = true;
        // Mock the manager so the UI doesn't crash
        this.manager = {
          startDeviceScan: (uuids: any, options: any, listener: any) => {
            console.log('Mock BLE Scan started');
            // Simulate finding a fake device after 2 seconds
            setTimeout(() => {
              listener(null, { 
                id: 'MOCK-MAC-123', 
                name: 'Mock iBeacon Tag', 
                rssi: -45,
                // Base64 encoded iBeacon payload (Apple 0x004C, Type 0x02, Length 0x15, UUID, Major: 1, Minor: 2, TxPower: -61)
                manufacturerData: 'TAACFQARIjNEVWZ3iJmqu8zd7v8AAQACww=='
              });
            }, 2000);
          },
          stopDeviceScan: () => console.log('Mock BLE Scan stopped'),
          destroy: () => {},
        };
      }
    }
    return this.manager;
  }

  public destroy() {
    if (this.manager && typeof this.manager.destroy === 'function') {
      this.manager.destroy();
      this.manager = null;
    }
  }
}

export const bleService = new BLEService();
