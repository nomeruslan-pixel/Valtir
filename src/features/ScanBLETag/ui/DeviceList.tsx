import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useBleStore } from '../../../entities/tracker/model/useBleStore';

export const DeviceList = () => {
  const { devices } = useBleStore();

  const sortedDevices = [...devices].sort((a, b) => {
    const rssiA = a.rssi ?? -100;
    const rssiB = b.rssi ?? -100;
    return rssiB - rssiA;
  });

  return (
    <FlatList
      data={sortedDevices}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name || 'Неизвестное устройство'}</Text>
            <Text style={styles.id}>{item.id}</Text>
          </View>
          <View style={styles.rssiContainer}>
            <Text style={styles.rssi}>{item.rssi || 'N/A'}</Text>
            <Text style={styles.rssiLabel}>дБм</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>Устройства не найдены. Нажмите сканировать, чтобы начать поиск.</Text>
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  id: { fontSize: 12, color: '#888' },
  rssiContainer: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  rssi: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  rssiLabel: { fontSize: 10, color: '#888' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 32, fontSize: 14 }
});
