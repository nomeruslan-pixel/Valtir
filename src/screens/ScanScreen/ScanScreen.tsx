import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Switch, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Bluetooth, Cpu } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useBleScanner } from '../../features/ScanBLETag/lib/useBleScanner';
import { useBleStore } from '../../entities/tracker/model/useBleStore';

export const ScanScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const spinValue = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  
  const { startScan, stopScan } = useBleScanner();
  const { devices, scanError, showAllDevices, setShowAllDevices } = useBleStore();

  useEffect(() => {
    startScan();
    return () => {
      stopScan();
    };
  }, [startScan, stopScan]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'left']}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 20, 60) }]}>
        
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => navigation.goBack()}
          >
            <X color={colors.card} size={24} />
          </TouchableOpacity>
        </View>

        {/* Text Headers */}
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Scanning...</Text>
          <Text style={styles.subtitle}>Hold your device near the tracker you want to add.</Text>
          <Text style={[styles.subtitle, { marginTop: 8, color: '#FBBF24', fontSize: 14 }]}>Please make sure your Bluetooth is turned ON.</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 12 }}>
            <Text style={{ color: '#ffffff', marginRight: 12, fontWeight: '500' }}>Show all BLE devices</Text>
            <Switch 
              value={showAllDevices}
              onValueChange={setShowAllDevices}
              trackColor={{ false: '#767577', true: '#F69F3C' }}
              thumbColor={showAllDevices ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Radar Animation Area */}
        <View style={styles.radarContainer}>
          {/* Concentric Circles */}
          <View style={styles.circleOuter}>
            <View style={styles.circleInner}>
              
              {/* Spinning Sweep */}
              <Animated.View style={[styles.sweep, { transform: [{ rotate: spin }] }]} />
              
              {/* Center Glowing Icon */}
              <View style={styles.centerIconContainer}>
                <Bluetooth color={colors.primaryForeground} size={32} />
              </View>

            </View>
          </View>
        </View>

        {/* Devices List */}
        <ScrollView style={{ width: '100%', marginTop: 20, flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: Math.max(insets.bottom + 20, 40) }}>
          {scanError && (
            <Text style={{ color: colors.destructive, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 }}>
              {scanError}
            </Text>
          )}
          {devices.map((device) => (
            <TouchableOpacity 
              key={device.id} 
              style={styles.connectingPill}
              onPress={() => {
                // If it's an iBeacon, pass the UUID. Otherwise, pass the raw MAC address (device.id).
                const trackerId = device.iBeacon ? device.iBeacon.uuid : device.id;
                navigation.navigate('ItemForm', { trackerId });
              }}
            >
              <View style={styles.pillIconContainer}>
                <Bluetooth color={colors.primary} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillTitle} numberOfLines={1}>
                  {device.iBeacon ? '✅ iBeacon Tracker' : (device.name || 'Unknown Device')}
                </Text>
                {device.iBeacon ? (
                  <>
                    <Text style={[styles.pillSubtitle, { fontSize: 11, fontFamily: 'monospace' }]}>{device.iBeacon.uuid}</Text>
                    <Text style={styles.pillSubtitle}>Maj: {device.iBeacon.major} | Min: {device.iBeacon.minor} | {device.rssi} dBm</Text>
                  </>
                ) : (
                  <Text style={styles.pillSubtitle}>RSSI: {device.rssi} dBm | Raw: {device.rawBase64 ? device.rawBase64.substring(0, 15) : 'null'}...</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
          {devices.length === 0 && (
            <Text style={[styles.subtitle, { marginTop: 20 }]}>Searching for nearby devices...</Text>
          )}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617', // Always dark background
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
    zIndex: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  radarContainer: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  circleOuter: {
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(246, 159, 60, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(246, 159, 60, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sweep: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderTopLeftRadius: 100,
    backgroundColor: 'transparent',
    borderTopWidth: 20,
    borderLeftWidth: 20,
    borderColor: 'rgba(246, 159, 60, 0.1)',
    top: 0,
    left: 0,
    borderTopColor: 'rgba(246, 159, 60, 0.6)',
    borderLeftColor: 'rgba(246, 159, 60, 0.1)',
    transformOrigin: 'bottom right',
  },
  centerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F69F3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F69F3C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  connectingPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    width: '80%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pillIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(246, 159, 60, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pillTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pillSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 4,
  }
});

