import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ScannerControls } from '../../features/ScanBLETag/ui/ScannerControls';
import { DeviceList } from '../../features/ScanBLETag/ui/DeviceList';

export const ScanScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScannerControls />
        <DeviceList />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  }
});
