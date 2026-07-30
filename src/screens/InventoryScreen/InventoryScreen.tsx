import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Key, Briefcase, Wallet, ChevronRight, ClipboardList, Plus, FileUp, Package, MapPin, Radar, Search, X as XIcon, Trash2, CheckSquare, Check } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useInventoryStore } from '../../entities/inventory/model/useInventoryStore';

export const InventoryScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [activeFilter, setActiveFilter] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const items = useInventoryStore(state => state.items);
  const fetchInventory = useInventoryStore(state => state.fetchInventory);
  const deleteItem = useInventoryStore(state => state.deleteItem);
  const [refreshing, setRefreshing] = useState(false);
  const filters = ['All Items', 'Tracked', 'Untracked'];

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  }, [fetchInventory]);

  const filteredItems = items.filter(item => {
    if (activeFilter === 'Tracked' && !item.linkedTrackerId) return false;
    if (activeFilter === 'Untracked' && !!item.linkedTrackerId) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const skuMatch = item.skuName?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const yardMatch = item.yard?.toLowerCase().includes(q);
      if (!skuMatch && !descMatch && !yardMatch) return false;
    }
    
    return true;
  });

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (newSelected.size === 0) setSelectionMode(false);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Inventory</Text>
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

        <View style={styles.searchContainer}>
          <Search color={colors.mutedForeground} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <XIcon color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.listContainer}>
          {filteredItems.map((item) => {
            const isTracked = !!item.linkedTrackerId;
            
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.itemCard}
                onPress={() => {
                  if (selectionMode) {
                    toggleSelection(item.id);
                  } else {
                    navigation.navigate('ItemForm', { itemId: item.id });
                  }
                }}
                onLongPress={() => {
                  if (!selectionMode) {
                    setSelectionMode(true);
                    setSelectedIds(new Set([item.id]));
                  }
                }}
                delayLongPress={300}
              >
                <View style={styles.itemLeft}>
                  {selectionMode && (
                    <View style={[styles.checkbox, selectedIds.has(item.id) && styles.checkboxSelected]}>
                      {selectedIds.has(item.id) && <Check color={colors.primaryForeground || '#FFF'} size={16} />}
                    </View>
                  )}
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
                  {isTracked && item.linkedTrackerId && (
                    <TouchableOpacity 
                      style={{padding: 8, marginRight: 8, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: 20}}
                      onPress={() => {
                        navigation.navigate('Radar', { trackerId: item.linkedTrackerId });
                      }}
                    >
                      <Radar color="#3b82f6" size={20} />
                    </TouchableOpacity>
                  )}
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
      {!selectionMode && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('ItemForm')}
        >
          <Plus color="#FFF" size={28} />
        </TouchableOpacity>
      )}

      {/* Floating Selection Bar */}
      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionCount}>{selectedIds.size} selected</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={() => {
              const all = new Set(filteredItems.map(i => i.id));
              setSelectedIds(all);
            }}>
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => {
              Alert.alert('Delete Items', `Are you sure you want to delete ${selectedIds.size} items?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {
                  selectedIds.forEach(id => deleteItem(id));
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                }}
              ]);
            }} style={styles.deleteActionBtn}>
              <Trash2 color={colors.destructive} size={18} />
              <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => {
              setSelectionMode(false);
              setSelectedIds(new Set());
            }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: colors.foreground,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.mutedForeground,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectionBar: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    right: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 30,
  },
  selectionCount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.foreground,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectAllText: {
    color: colors.primary,
    fontWeight: '600',
  },
  cancelText: {
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteActionText: {
    color: colors.destructive,
    fontWeight: '600',
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


