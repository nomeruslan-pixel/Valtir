import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Key, Briefcase, Wallet, ChevronRight, ClipboardList, Plus, FileUp, Package, MapPin } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useInventoryStore } from '../../entities/inventory/model/useInventoryStore';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';

export const InventoryScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [activeFilter, setActiveFilter] = useState('All Items');
  
  const items = useInventoryStore(state => state.items);
  const importCSV = useInventoryStore(state => state.importCSV);

  const filters = ['All Items', 'Tracked', 'Untracked'];

  const filteredItems = items.filter(item => {
    if (activeFilter === 'Tracked') return !!item.linkedTrackerId;
    if (activeFilter === 'Untracked') return !item.linkedTrackerId;
    return true;
  });

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Assume columns might be named 'item name' and 'qty on hand' (case insensitive match later, or map index)
          const data = results.data as any[];
          const parsedData = data.map(row => {
            const keys = Object.keys(row);
            const nameKey = keys.find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('sku')) || keys[0];
            const qtyKey = keys.find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity')) || keys[1];
            
            return {
              skuName: row[nameKey],
              qty: parseInt(row[qtyKey], 10) || 0,
            };
          });

          importCSV(parsedData);
          Alert.alert('Success', `Imported ${parsedData.length} items from CSV.`);
        },
        error: (error: any) => {
          Alert.alert('Error', `Failed to parse CSV: ${error.message}`);
        }
      });

    } catch (e: any) {
      Alert.alert('Error', 'Failed to read file: ' + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Inventory</Text>
          
          <TouchableOpacity 
            style={styles.importButton}
            onPress={handleImportCSV}
          >
            <FileUp color={colors.primaryForeground} size={16} style={{ marginRight: 6 }} />
            <Text style={styles.importText}>Import CSV</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {filteredItems.map((item) => {
            const isTracked = !!item.linkedTrackerId;
            
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.itemCard}
                onPress={() => navigation.navigate('ItemForm', { itemId: item.id })}
              >
                <View style={styles.itemLeft}>
                  <View style={[
                    styles.iconContainer,
                    isTracked ? styles.iconContainerTracked : styles.iconContainerNormal
                  ]}>
                    <Package color={isTracked ? colors.primaryForeground : colors.secondaryForeground} size={24} />
                  </View>
                  <View>
                    <Text style={styles.itemName}>{item.skuName}</Text>
                    <View style={styles.itemStatusRow}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: isTracked ? colors.primary : colors.mutedForeground }
                      ]} />
                      <Text style={styles.itemLocation}>Qty: {item.qty} | {isTracked ? 'Tracked' : 'Untracked'}</Text>
                    </View>
                  </View>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  {isTracked && item.lastLocation && (
                    <TouchableOpacity 
                      style={{padding: 8, marginRight: 8, backgroundColor: 'rgba(246, 159, 60, 0.15)', borderRadius: 20}}
                      onPress={() => {
                        navigation.navigate('Map', { focusLat: item.lastLocation!.lat, focusLng: item.lastLocation!.lng });
                      }}
                    >
                      <MapPin color={colors.primary} size={20} />
                    </TouchableOpacity>
                  )}
                  <ChevronRight color={colors.border} size={20} />
                </View>
              </TouchableOpacity>
            );
          })}
          {filteredItems.length === 0 && (
             <Text style={{color: colors.mutedForeground, textAlign: 'center', marginTop: 40}}>
               No items found. Tap + to add or Import CSV.
             </Text>
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('ItemForm')}
      >
        <Plus color="#FFF" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.cardForeground,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  importText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
    fontSize: 12,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.muted,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  filterTextActive: {
    color: colors.primaryForeground,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 16,
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerNormal: {
    backgroundColor: colors.secondary,
  },
  iconContainerTracked: {
    backgroundColor: colors.primary,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardForeground,
  },
  itemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  itemLocation: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  fab: {
    position: 'absolute',
    bottom: 120, // above the bottom tab bar
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  }
});


