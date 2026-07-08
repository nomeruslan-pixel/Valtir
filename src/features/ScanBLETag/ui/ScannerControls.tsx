import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useBleScanner } from '../lib/useBleScanner';
import { useBleStore } from '../../../entities/tracker/model/useBleStore';

export const ScannerControls = () => {
  const { startScan, stopScan } = useBleScanner();
  const { isScanning, scanError, showAllDevices, setShowAllDevices } = useBleStore();

  return (
    <View style={styles.container}>
      {scanError && <Text style={styles.errorText}>{scanError}</Text>}
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Show all BLE devices</Text>
        <Switch
          value={showAllDevices}
          onValueChange={setShowAllDevices}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={showAllDevices ? '#007AFF' : '#f4f3f4'}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isScanning ? styles.buttonStop : styles.buttonStart]} 
        onPress={isScanning ? stopScan : startScan}
      >
        {isScanning && <ActivityIndicator color="#fff" style={styles.loader} />}
        <Text style={styles.buttonText}>
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    width: '100%'
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonStart: {
    backgroundColor: '#007AFF',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginRight: 8,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  }
});
