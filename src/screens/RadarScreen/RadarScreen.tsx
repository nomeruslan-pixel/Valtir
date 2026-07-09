import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Radar } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useRadar } from '../../features/ScanBLETag/lib/useRadar';

export const RadarScreen = ({ route, navigation }: any) => {
  const { trackerId } = route.params;
  const colors = useThemeColors();
  const styles = getStyles(colors);
  
  const { rssi, isScanning, error, startRadar, stopRadar } = useRadar(trackerId);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startRadar();
    return () => {
      stopRadar();
    };
  }, [startRadar, stopRadar]);

  // Adjust pulse speed based on RSSI (Hot/Cold logic)
  useEffect(() => {
    let duration = 2000; // default slow pulse

    if (rssi !== null) {
      if (rssi > -50) duration = 300; // Hot!
      else if (rssi > -65) duration = 600; // Warm
      else if (rssi > -80) duration = 1200; // Chilly
      else duration = 2000; // Cold
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0, // Reset instantly
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [rssi]);

  // Derive colors/text based on RSSI
  let radarColor = colors.mutedForeground; // Cold
  let statusText = "Searching...";
  
  if (rssi !== null) {
    if (rssi > -50) {
      radarColor = '#ef4444'; // Red (Hot!)
      statusText = "It's right here!";
    } else if (rssi > -65) {
      radarColor = '#f59e0b'; // Orange (Warm)
      statusText = "Getting warmer!";
    } else if (rssi > -80) {
      radarColor = '#3b82f6'; // Blue (Chilly)
      statusText = "Keep moving...";
    } else {
      radarColor = '#94a3b8'; // Slate (Cold)
      statusText = "Very far away.";
    }
  }

  if (error) {
    statusText = "Error: " + error;
  }

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3]
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0]
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <X color={colors.foreground} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Item</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.radarContainer}>
        {/* Animated Pulse Circles */}
        <Animated.View style={[styles.pulseCircle, {
            backgroundColor: radarColor,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity
        }]} />
        
        {/* Core Dot */}
        <View style={[styles.coreDot, { backgroundColor: radarColor }]}>
          <Radar color="#fff" size={32} />
        </View>

        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: radarColor }]}>{statusText}</Text>
          {rssi !== null ? (
            <Text style={styles.rssiText}>Signal: {rssi} dBm</Text>
          ) : (
            <Text style={styles.rssiText}>Looking for {trackerId}...</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  radarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  coreDot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rssiText: {
    fontSize: 16,
    color: colors.mutedForeground,
  }
});
